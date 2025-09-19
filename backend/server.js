import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import mqtt from 'mqtt';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './db.js';
import cors from 'cors';
import http from "http";
import { WebSocketServer } from "ws";
import { captureSnapshot } from './cctv.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket broadcast function
function broadcast(data) {
    //console.log("Broadcasting to", wss.clients.size, "clients:", data);
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(data));
        }
    });
}

//-----------------------------------------------------//
//-----------------------------------------------------//
//-----------------------------------------------------//

// !! WEBSOCKET CONNECTION FUNCTION
wss.on("connection", (ws) => {
    //console.log("WebSocket client connected. Total clients:", wss.clients.size);

    ws.send(JSON.stringify({
        type: "info",
        message: "Connected to WebSocket server",
        timestamp: new Date().toISOString()
    }));

    ws.on("message", (message) => {
        //console.log("Message from client:", message.toString());
    });

    ws.on("close", () => {
        //console.log("WebSocket client disconnected. Remaining clients:", wss.clients.size);
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
});
// !! END OF WEBSOCKET FUNCTION

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

async function handleEmployeeExit(uid, licensePlate, attendanceRecord) {
    //console.log("Checking leave permission for exit:", licensePlate);
    const attendanceDate = attendanceRecord.datein ? new Date(attendanceRecord.datein).toISOString().split('T')[0] : null;
    //console.log("Query params:", { licensePlate, attendanceDate });
    const leavePermission = await db.query(
        `SELECT * FROM leave_permission 
        WHERE licenseplate = $1 
        AND date = $2
        AND statusfromhr = 'approved' 
        AND statusfromdept = 'approved' 
        AND (
            role = 'Staff'
            OR role = 'Head Department'
        )
        AND actual_exittime IS NULL
        ORDER BY date DESC
        LIMIT 1`,
        [licensePlate, attendanceDate]
    );

    //console.log("leavePermission.rows:", leavePermission.rows);

    if (leavePermission.rows.length > 0) {
        const permission = leavePermission.rows[0];
        //console.log(permission);
        const now = new Date();
        const plannedExitTime = new Date(permission.exittime);
        
        //console.log("Found approved leave permission for:", licensePlate);
        //console.log("Planned exit time:", plannedExitTime);
        //console.log("Actual exit time:", now);
        
        // Update attendance_logs (leave permission exit)
        await db.query(
            `UPDATE attendance_logs 
            SET actual_exittime = CURRENT_TIMESTAMP, 
                status = 'leave_exit'
            WHERE id = $1`,
            [attendanceRecord.id]
        );
        
        // Update leave_permission with actual_exittime
        await db.query(
            `UPDATE leave_permission 
            SET actual_exittime = CURRENT_TIMESTAMP 
            WHERE id = $1`,
            [permission.id]
        );
        
        //console.log("Leave exit recorded - actual_exittime set in both attendance_logs and leave_permission");
        
        return {
            type: 'leave_exit',
            permission: permission,
            isEarly: now < plannedExitTime,
            isLate: now > plannedExitTime
        };
    } else {
        //console.log("No approved leave permission found, treating as regular exit");
        
        // Regular exit
        await db.query(
            `UPDATE attendance_logs 
            SET dateout = CURRENT_TIMESTAMP, 
                status = 'exit'
            WHERE id = $1`,
            [attendanceRecord.id]
        );
        
        return {
            type: 'regular_exit'
        };
    }
}

async function handleEmployeeReturn(uid, licensePlate) {
    //console.log("Checking for active leave permission return:", licensePlate);
    
    // Check for leave that was exited but not returned (and not final)
    const activeLeavePermission = await db.query(
        `SELECT * FROM leave_permission 
        WHERE licenseplate = $1 
        AND date = CURRENT_DATE 
        AND actual_exittime IS NOT NULL 
        AND actual_returntime IS NULL`,
        [licensePlate]
    );
    
    if (activeLeavePermission.rows.length > 0) {
        const permission = activeLeavePermission.rows[0];
        
        // Check if this was a final leave (no return expected)
        const leaveReason = permission.reason.toLowerCase();
        const isNoReturnLeave = leaveReason.includes('sick') || 
                                leaveReason.includes('sakit') || 
                                leaveReason.includes('emergency') || 
                                leaveReason.includes('darurat') ||
                                leaveReason.includes('pulang') ||
                                leaveReason.includes('home');
        
        if (isNoReturnLeave) {
            // This was supposed to be final, but user is back - treat as new entry
            //console.log("User returned after final leave - treating as new entry");
            return {
                type: 'new_entry_after_final'
            };
        }
        
        const now = new Date();
        const plannedReturnTime = new Date(permission.returntime);
        
        //console.log("Found active leave permission for return:", licensePlate);
        //console.log("Planned return time:", plannedReturnTime);
        //console.log("Actual return time:", now);
        
        // Update the attendance record for today with actual_returntime
        await db.query(
            `UPDATE attendance_logs 
            SET actual_returntime = CURRENT_TIMESTAMP,
                status = 'leave_return'
            WHERE licenseplate = $1 
            AND DATE(datein) = CURRENT_DATE
            AND leave_permission_id = $2`,
            [licensePlate, permission.id]
        );
        
        // Update leave_permission with actual_returntime
        await db.query(
            `UPDATE leave_permission 
            SET actual_returntime = CURRENT_TIMESTAMP 
            WHERE id = $1`,
            [permission.id]
        );
        
        return {
            type: 'leave_return',
            permission: permission,
            isEarly: now < plannedReturnTime,
            isLate: now > plannedReturnTime
        };
    } else {
        //console.log("No active leave permission found, treating as new entry");
        return {
            type: 'new_entry'
        };
    }
}

//------------------------------------------------------//
//------------------------------------------------------//
//------------------------------------------------------//

// !! MQTT CONNECT FUNCTION DATA FROM IOT
// MQTT Setup
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://mqtt:1884');

mqttClient.on('connect', () => {
    //console.log('Connected to MQTT broker');
    mqttClient.subscribe('rfid/entry', (err) => {
        if (err) {
            console.error('Failed to subscribe to rfid/entry topic:', err);
        } else {
            //console.log('Subscribed to rfid/entry topic');
        }
    });
});
mqttClient.on('error', (error) => {
    console.error('MQTT Client Error:', error);
});


mqttClient.on('message', async (topic, message) => {
    if (topic === 'rfid/entry') {
        try {
            const payload = JSON.parse(message.toString());
            //console.log('RFID payload:', payload);

            const { uid, timestamp } = payload;

            if (!uid) {
                //console.log('Missing UID in payload');
                return;
            }

            const user = await db.query('SELECT * FROM users WHERE uid = $1', [uid]);

            if (user.rows.length === 0) {
                //console.log("UID not found:", uid);
                
                mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify({
                    status: 'rejected',
                    reason: 'Unknown Card'  
                }));
                return;
            }

            const userInfo = user.rows[0];
            const licensePlate = userInfo.licenseplate;
            //console.log("Valid UID:", uid, "User:", userInfo.name);

            const today = new Date().toISOString().split('T')[0];
            
            // Check for current attendance state - find ANY open attendance record for today
            const existingEntry = await db.query(
                `SELECT * FROM attendance_logs 
                WHERE uid = $1 AND DATE(datein) = $2 AND dateout IS NULL 
                ORDER BY id DESC LIMIT 1`,
                [uid, today]
            );

            if (existingEntry.rows.length > 0) {
                // =================== EXIT/LEAVE LOGIC ===================
                const attendance = existingEntry.rows[0];
                //console.log("Found existing entry:", attendance);

                // Priority 1: Check if we need to return from a leave first
                const returningLeavePermission = await db.query(
                    `SELECT * FROM leave_permission 
                    WHERE licenseplate = $1 
                    AND date = $2
                    AND (
                        (statusfromhr = 'approved' AND statusfromdept = 'approved' AND role = 'Staff')
                        OR
                        (statusfromhr = 'approved' AND role = 'Head Department')
                    )
                    AND actual_exittime IS NOT NULL
                    AND actual_returntime IS NULL
                    ORDER BY actual_exittime DESC
                    LIMIT 1`,
                    [licensePlate, today]
                );
                const returningLeave = returningLeavePermission.rows[0];

                // Priority 2: Check for new leave permission to exit
                const leavePermission = await db.query(
                    `SELECT * FROM leave_permission 
                    WHERE licenseplate = $1 
                    AND date = $2
                    AND (
                        (statusfromhr = 'approved' AND statusfromdept = 'approved' AND role = 'Staff')
                        OR
                        (statusfromhr = 'approved' AND role = 'Head Department')
                    )
                    AND actual_exittime IS NULL
                    ORDER BY submittedat ASC
                    LIMIT 1`,
                    [licensePlate, today]
                );
                const leave = leavePermission.rows[0];

                //Leave Return - HIGHEST PRIORITY
                if (returningLeave) {
                    //console.log("Processing LEAVE RETURN");
                    const imagePathLeaveReturn = await captureSnapshot(uid);
                    
                    // Update the attendance record that has this leave_permission_id
                    await db.query(
                        'UPDATE attendance_logs SET image_path_leave_return = $1, actual_returntime = CURRENT_TIMESTAMP, status = $2 WHERE leave_permission_id = $3 AND uid = $4 AND DATE(datein) = $5',
                        [imagePathLeaveReturn, 'leave_return', returningLeave.id, uid, today]
                    );
                    
                    await db.query(
                        'UPDATE leave_permission SET actual_returntime = CURRENT_TIMESTAMP WHERE id = $1',
                        [returningLeave.id]
                    );
                    
                    const updatedRecord = await db.query(
                        'SELECT * FROM attendance_logs WHERE leave_permission_id = $1 AND uid = $2 AND DATE(datein) = $3',
                        [returningLeave.id, uid, today]
                    );
                    
                    const returnDataFull = {
                        ...updatedRecord.rows[0],
                        type: 'leave_return',
                        leaveInfo: {
                            permissionId: returningLeave.id,
                            plannedTime: returningLeave.returntime,
                            isEarly: new Date() < new Date(returningLeave.returntime),
                            isLate: new Date() > new Date(returningLeave.returntime),
                            reason: returningLeave.reason
                        },
                        timestamp: new Date().toISOString()
                    };
                    broadcast(returnDataFull);
                    mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify({
                        status: 'approved',
                        name: userInfo.name.substring(0, 16),
                        department: userInfo.department.substring(0, 8),
                        action: 'Leave Return'
                    }));
                    return;
                }

                //Leave Exit - SECOND PRIORITY
                else if (leave && !leave.actual_exittime) {
                    //console.log("Processing LEAVE EXIT - updating existing row");
                    
                    const imagePathLeaveExit = await captureSnapshot(uid);
                    
                    // Check if this is a "no-return" leave (sick, emergency, etc.)
                    const leaveReason = leave.reason.toLowerCase();
                    const isNoReturnLeave = leaveReason.includes('sick') || 
                                            leaveReason.includes('sakit') || 
                                            leaveReason.includes('emergency') || 
                                            leaveReason.includes('darurat') ||
                                            leaveReason.includes('pulang') ||
                                            leaveReason.includes('home');
                    
                    if (isNoReturnLeave) {
                        // For no-return leaves, close the record completely
                        await db.query(
                            'UPDATE attendance_logs SET image_path_leave_exit = $1, actual_exittime = CURRENT_TIMESTAMP, dateout = CURRENT_TIMESTAMP, status = $2, leave_permission_id = $3 WHERE id = $4',
                            [imagePathLeaveExit, 'leave_exit_final', leave.id, attendance.id]
                        );
                        
                        // Also mark the leave as completed (no return expected)
                        await db.query(
                            'UPDATE leave_permission SET actual_exittime = CURRENT_TIMESTAMP, actual_returntime = CURRENT_TIMESTAMP WHERE id = $1',
                            [leave.id]
                        );
                        
                        const exitDataFull = {
                            ...attendance,
                            image_path_leave_exit: imagePathLeaveExit,
                            actual_exittime: new Date().toISOString(),
                            dateout: new Date().toISOString(),
                            status: 'leave_exit_final',
                            type: 'leave_exit_final',
                            leaveInfo: {
                                permissionId: leave.id,
                                plannedTime: leave.exittime,
                                isEarly: new Date() < new Date(leave.exittime),
                                isLate: new Date() > new Date(leave.exittime),
                                reason: leave.reason,
                                noReturn: true
                            },
                            timestamp: new Date().toISOString()
                        };
                        broadcast(exitDataFull);
                        mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify({
                            status: 'approved',
                            name: userInfo.name.substring(0, 16),
                            department: userInfo.department.substring(0, 8),
                            action: 'Leave (Final)'
                        }));
                    } else {
                        // Regular leave exit (expecting return)
                        await db.query(
                            'UPDATE attendance_logs SET image_path_leave_exit = $1, actual_exittime = CURRENT_TIMESTAMP, status = $2, leave_permission_id = $3 WHERE id = $4',
                            [imagePathLeaveExit, 'leave_exit', leave.id, attendance.id]
                        );
                        
                        await db.query(
                            'UPDATE leave_permission SET actual_exittime = CURRENT_TIMESTAMP WHERE id = $1',
                            [leave.id]
                        );
                        
                        const updatedRecord = await db.query('SELECT * FROM attendance_logs WHERE id = $1', [attendance.id]);
                        const exitDataFull = {
                            ...updatedRecord.rows[0],
                            type: 'leave_exit',
                            leaveInfo: {
                                permissionId: leave.id,
                                plannedTime: leave.exittime,
                                isEarly: new Date() < new Date(leave.exittime),
                                isLate: new Date() > new Date(leave.exittime),
                                reason: leave.reason,
                                noReturn: false
                            },
                            timestamp: new Date().toISOString()
                        };
                        broadcast(exitDataFull);
                        mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify({
                            status: 'approved',
                            name: userInfo.name.substring(0, 16),
                            department: userInfo.department.substring(0, 8),
                            action: 'Leave Exit'
                        }));
                    }
                    return;
                }

                //Exit Regular - Close current open attendance record
                else {
                    //console.log("Processing REGULAR EXIT");
                    const imagePathOut = await captureSnapshot(uid);
                
                    // Close the current open record only
                    await db.query(
                        'UPDATE attendance_logs SET image_path_out = $1, dateout = CURRENT_TIMESTAMP, status = $2 WHERE id = $3',
                        [imagePathOut, 'exit', attendance.id]
                    );
                    
                    const updatedRecord = await db.query('SELECT * FROM attendance_logs WHERE id = $1', [attendance.id]);
                    const exitDataFull = {
                        ...updatedRecord.rows[0],
                        type: 'exit',
                        leaveInfo: null,
                        timestamp: new Date().toISOString()
                    };
                    broadcast(exitDataFull);
                    
                    mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify({
                        status: 'approved',
                        name: userInfo.name.substring(0, 16),
                        department: userInfo.department.substring(0, 8),
                        action: 'Exit'
                    }));
                    return;
                }
            
            } else {
                // =================== ENTRY LOGIC ===================
                // Only allow entry if NO open attendance record exists for today
                //console.log("Processing ENTRY for:", userInfo.name);
                
                // Check for open records (dateout is NULL)
                const doubleCheckEntry = await db.query(
                    `SELECT * FROM attendance_logs 
                    WHERE uid = $1 AND DATE(datein) = $2 AND dateout IS NULL`,
                    [uid, today]
                );
                
                if (doubleCheckEntry.rows.length > 0) {
                    //console.log("Found open record, should not create new entry");
                    mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify({
                        status: 'rejected',
                        reason: 'Open Record Exists'
                    }));
                    return;
                }
                
                // Check if user had a leave_exit_final today (no return expected but might come back next tap)
                const hadFinalLeaveToday = await db.query(
                    `SELECT * FROM attendance_logs 
                    WHERE uid = $1 AND DATE(datein) = $2 AND status = 'leave_exit_final'`,
                    [uid, today]
                );
                
                if (hadFinalLeaveToday.rows.length > 0) {
                    // This is a new entry after a final leave (like coming back after sick leave)
                    //console.log("User returning after final leave, creating new entry");
                }
                
                const returnResult = await handleEmployeeReturn(uid, licensePlate);
                
                if (returnResult.type === 'leave_return') {
                    //console.log("Processing LEAVE RETURN for:", userInfo.name);
                    const imagePath = await captureSnapshot(uid);
                    
                    await db.query(
                        'UPDATE attendance_logs SET image_path_out = $1 WHERE licenseplate = $2 AND DATE(datein) = CURRENT_DATE',
                        [imagePath, licensePlate]
                    );
                    
                    const updatedRecord = await db.query(
                        'SELECT * FROM attendance_logs WHERE licenseplate = $1 AND DATE(datein) = CURRENT_DATE',
                        [licensePlate]
                    );
                    
                    let actionMessage = 'Return';
                    let statusMessage = 'Welcome back!';
                    
                    if (returnResult.isEarly) {
                        statusMessage = 'Early return';
                    } else if (returnResult.isLate) {
                        statusMessage = 'Late return';
                    }

                    const returnDataFull = {
                        id: updatedRecord.rows[0].id,
                        uid: uid,
                        licenseplate: licensePlate,
                        name: userInfo.name,
                        department: userInfo.department,
                        image_path: updatedRecord.rows[0].image_path,
                        image_path_out: imagePath,
                        datein: updatedRecord.rows[0].datein,
                        exittime: updatedRecord.rows[0].exittime,
                        returntime: updatedRecord.rows[0].returntime,
                        status: updatedRecord.rows[0].status,
                        type: 'leave_return',
                        leaveInfo: {
                            permissionId: returnResult.permission.id,
                            plannedTime: returnResult.permission.returntime,
                            isEarly: returnResult.isEarly,
                            isLate: returnResult.isLate
                        },
                        timestamp: new Date().toISOString()
                    };

                    broadcast(returnDataFull);
                    //console.log("LEAVE RETURN broadcasted to dashboard");

                    const esp32Response = {
                        status: 'approved',
                        name: userInfo.name.substring(0, 16),        
                        department: userInfo.department.substring(0, 8),  
                        action: actionMessage                             
                    };

                    mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify(esp32Response));
                    //console.log("Sent LEAVE RETURN approval to ESP32:", esp32Response);
                    
                } else if (returnResult.type === 'new_entry_after_final') {
                    //console.log("Processing NEW ENTRY after final leave for:", userInfo.name);
                    
                    const insertResult = await db.query(
                        'INSERT INTO attendance_logs (uid, licenseplate, status) VALUES ($1, $2, $3) RETURNING *',
                        [uid, licensePlate, 'entry']
                    );

                    const imagePath = await captureSnapshot(uid);
                    if (imagePath) {
                        await db.query(
                            'UPDATE attendance_logs SET image_path = $1 WHERE id = $2',
                            [imagePath, insertResult.rows[0].id]
                        );
                    }

                    const entryDataFull = {
                        id: insertResult.rows[0].id,
                        uid: uid,
                        licenseplate: licensePlate,
                        name: userInfo.name,
                        department: userInfo.department,
                        image_path: imagePath,
                        datein: new Date().toISOString(),
                        dateout: null,
                        status: 'entry',
                        type: 'entry_after_final',
                        leaveInfo: null,
                        timestamp: new Date().toISOString()
                    };

                    broadcast(entryDataFull);
                    //console.log("ENTRY AFTER FINAL broadcasted to dashboard");

                    const esp32Response = {
                        status: 'approved',
                        name: userInfo.name.substring(0, 16),        
                        department: userInfo.department.substring(0, 8),  
                        action: 'Re-Entry'                             
                    };

                    mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify(esp32Response));
                    //console.log("Sent RE-ENTRY approval to ESP32:", esp32Response);
                    
                } else {
                    //console.log("Processing NEW ENTRY for:", userInfo.name);

                    const today = new Date().toISOString().split('T')[0];
                    const leavePermissionToday = await db.query(
                        `SELECT * FROM leave_permission 
                        WHERE uid = $1 AND date = $2 
                        AND statusfromhr = 'approved' 
                        AND statusfromdept = 'approved' 
                        AND (role = 'Staff' OR role = 'Head Department')
                        ORDER BY submittedat DESC LIMIT 1`,
                        [uid, today]
                    );
                    let plannedExitTime = null;
                    let plannedReturnTime = null;
                    if (leavePermissionToday.rows.length > 0) {
                        plannedExitTime = leavePermissionToday.rows[0].exittime;
                        plannedReturnTime = leavePermissionToday.rows[0].returntime;
                    }

                    const insertResult = await db.query(
                        'INSERT INTO attendance_logs (uid, licenseplate, status, exittime, returntime) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                        [uid, licensePlate, 'entry', plannedExitTime, plannedReturnTime]
                    );

                    const imagePath = await captureSnapshot(uid);
                    if (imagePath) {
                        await db.query(
                            'UPDATE attendance_logs SET image_path = $1 WHERE id = $2',
                            [imagePath, insertResult.rows[0].id]
                        );
                    }

                    const entryDataFull = {
                        id: insertResult.rows[0].id,
                        uid: uid,
                        licenseplate: licensePlate,
                        name: userInfo.name,
                        department: userInfo.department,
                        image_path: imagePath,
                        datein: new Date().toISOString(),
                        dateout: null,
                        status: 'entry',
                        type: 'entry',
                        leaveInfo: leavePermissionToday.rows.length > 0 ? {
                            permissionId: leavePermissionToday.rows[0].id,
                            plannedExitTime: leavePermissionToday.rows[0].exittime,
                            plannedReturnTime: leavePermissionToday.rows[0].returntime,
                            reason: leavePermissionToday.rows[0].reason
                        } : null,
                        timestamp: new Date().toISOString()
                    };

                    broadcast(entryDataFull);
                    //console.log("ENTRY broadcasted to dashboard");

                    const esp32Response = {
                        status: 'approved',
                        name: userInfo.name.substring(0, 16),        
                        department: userInfo.department.substring(0, 8),  
                        action: 'Entry'                             
                    };

                    mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify(esp32Response));
                    //console.log("Sent ENTRY approval to ESP32:", esp32Response);
                }
            }

        } catch (error) {
            console.error('❌ Error processing MQTT message:', error);
            
            if (payload && payload.uid) {
                mqttClient.publish(`rfid/approval/${payload.uid}`, JSON.stringify({
                    status: 'rejected',
                    reason: 'Server Error'
                }));
            }
        }
    }
});


app.get('/mqtt-status', (req, res) => {
    res.json({
        connected: mqttClient.connected,
        subscribed_topics: ['rfid/entry'],
        last_message_time: mqttClient.lastMessageTime || 'Never',
        broker_url: process.env.MQTT_BROKER_URL || 'mqtt://mqtt:1884'
    });
});
// !! END OF MQTT PROTOCOL FUNCTION

//------------------------------------------------------//
//------------------------------------------------------//
//------------------------------------------------------//


function convertToJakartaISO(dbTimestamp) {
    if (!dbTimestamp) return null;
    
    if (dbTimestamp instanceof Date) {
        const jakartaTime = new Date(dbTimestamp.getTime() + (7 * 60 * 60 * 1000)); // Add 7 hours
        return jakartaTime.toISOString().replace('Z', '+07:00'); // Mark as Jakarta time
    }
    
    if (typeof dbTimestamp === 'string') {
        const isoString = dbTimestamp.replace(' ', 'T') + '+07:00';
        return isoString;
    }
    
    return dbTimestamp;
}

//----------------------------------------------------------------//
//----------------------------------------------------------------//
//----------------------------------------------------------------//

// !! API FOR DASHBOARD EMPLOYEE (CONTAIN API USER/EMPLOYEE)
app.get('/logs', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                al.*,
                u.name,
                u.department,
                lp.id as leave_permission_id,
                lp.reason as leave_reason,
                lp.exittime as planned_exit_time,
                lp.returntime as planned_return_time,
                lp.actual_exittime,
                lp.actual_returntime
            FROM attendance_logs al
            JOIN users u ON al.uid = u.uid
            LEFT JOIN leave_permission lp ON al.leave_permission_id = lp.id
            ORDER BY al.datein DESC
        `);

        const formattedRows = result.rows.map(row => ({
            ...row,
            datein: convertToJakartaISO(row.datein),
            dateout: convertToJakartaISO(row.dateout),
            planned_exit_time: row.planned_exit_time,
            planned_return_time: row.planned_return_time,
            actual_exittime: convertToJakartaISO(row.actual_exittime),
            actual_returntime: convertToJakartaISO(row.actual_returntime)
        }));

        //console.log(`Fetched ${formattedRows.length} log records with proper Jakarta timezone`);
        res.json(formattedRows);
    } catch (e) {
        console.error("❌ Error fetching logs:", e);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/users', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                id,
                name,
                uid,
                licenseplate,
                department,
                role
            FROM users 
            ORDER BY name ASC
        `);
        //console.log(`Fetched ${result.rows.length} users`);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.get('/users/department/:department', async (req, res) => {
    try {
        const { department } = req.params;
        const result = await db.query(`
            SELECT 
                id,
                name,
                uid,
                licenseplate,
                department,
                role
            FROM users 
            WHERE department = $1
            ORDER BY name ASC
        `, [department]);
        //console.log(`Fetched ${result.rows.length} users for department: ${department}`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users by department:', error);
        res.status(500).json({ error: 'Failed to fetch users by department' });
    }
});

app.get('/employee/:uid/leave-status', async (req, res) => {
    try {
        const { uid } = req.params;
        
        const user = await db.query('SELECT * FROM users WHERE uid = $1', [uid]);
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const userInfo = user.rows[0];
        
        const attendance = await db.query(
            'SELECT * FROM attendance_logs WHERE uid = $1 AND DATE(datein) = CURRENT_DATE ORDER BY datein DESC LIMIT 1',
            [uid]
        );
        const leavePermissions = await db.query(
            `SELECT * FROM leave_permission 
            WHERE uid = $1 AND date = CURRENT_DATE 
            ORDER BY submittedat DESC`,
            [uid]
        );
        const approvedLeave = await db.query(
            `SELECT * FROM leave_permission 
            WHERE uid = $1 AND date = CURRENT_DATE 
            AND statusfromhr = 'approved' 
            AND statusfromdept = 'approved' 
            AND (role = 'Staff' OR role = 'Head Department')`,
            [uid]
        );
        
        res.json({
            user: userInfo,
            todayAttendance: attendance.rows[0] || null,
            leavePermissions: leavePermissions.rows,
            approvedLeave: approvedLeave.rows[0] || null,
            canUseLeave: approvedLeave.rows.length > 0,
            isInBuilding: attendance.rows.length > 0 && !attendance.rows[0].dateout && !attendance.rows[0].exittime
        });
    } catch (e) {
        console.error("❌ Error fetching employee leave status:", e);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        websocket_clients: wss.clients.size,
        mqtt_connected: mqttClient.connected,
        timestamp: new Date().toISOString()
    });
});

//-------------------------------------------------------//
//-------------------------------------------------------//
//-------------------------------------------------------//

// !! API FOR LEAVE PERMISSION RECORD EMPLOYEE FUNCTION 
app.post('/leave-permission', async (req, res) => {
    try {
        const {
            name,
            uid,
            licensePlate,
            department,
            role,
            date,
            exitTime,
            returnTime,
            reason,
            approval,
            statusFromDepartment,
            statusFromHR,
            statusFromDirector,
            submittedAt
        } = req.body;

        const result = await db.query(
            `INSERT INTO leave_permission
            (name, uid, licenseplate, department, role, date, exittime, returntime, reason, approval, statusfromdept, statusfromhr, statusfromdirector, submittedat)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            RETURNING *`,
            [
                name,
                uid,
                licensePlate,
                department,
                role,
                date,
                exitTime,
                returnTime,
                reason,
                approval,
                statusFromDepartment,
                statusFromHR,
                statusFromDirector,
                submittedAt
            ]
        );
        const inserted = result.rows[0];
        broadcast({
            type: 'leave_permission',
            action: 'insert',
            data: inserted
        });
        res.status(201).json(result.rows[0]);
    } catch (e) {
        console.error("❌ Error inserting leave permission:", e);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/leave-permission/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const allowedFields = [
            'approval',
            'statusfromhr',
            'statusfromdept',
            'statusfromdirector',
            'reason',
            'returntime',
            'exittime',
            'date',
            'role',
            'department',
            'licenseplate',
            'name',
            'submittedat'
        ];
        const updates = req.body;
        const setClauses = [];
        const values = [];
        let idx = 1;
        for (const key of Object.keys(updates)) {
            if (allowedFields.includes(key.toLowerCase())) {
                setClauses.push(`${key} = $${idx}`);
                values.push(updates[key]);
                idx++;
            }
        }
        if (setClauses.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }
        values.push(id);
        const result = await db.query(
            `UPDATE leave_permission SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
            values
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Leave permission not found' });
        }
        const inserted = result.rows[0];
        broadcast({
            type: 'leave_permission',
            action: 'insert',
            data: inserted
        });
        res.json(result.rows[0]);
    } catch (e) {
        console.error('❌ Error updating leave permission:', e);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/leave-permission', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM leave_permission ORDER BY submittedat DESC');
        res.json(result.rows);
    } catch (e) {
        console.error("❌ Error fetching leave permissions:", e);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
// !! END OF API LEAVE PERMISSION EMPLOYEE

//-------------------------------------------------------//
//-------------------------------------------------------//
//-------------------------------------------------------//

// ?? JWT TOKEN
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

//-------------------------------------------------------//
//-------------------------------------------------------//
//-------------------------------------------------------//

// !! API FOR AUTHENTICATION LOGIN
app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        const result = await db.query(
            'SELECT * FROM userlogin WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        const user = result.rows[0];
        const isValidPassword = password === user.password;
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                name: user.name,
                department: user.department,
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        const { password: _, ...userWithoutPassword } = user;

        //console.log(`User logged in: ${user.name} (${user.role})`);

        res.json({
            success: true,
            message: 'Login successful',
            user: userWithoutPassword,
            token: token
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
app.get('/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, username, department, role FROM userlogin WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.post('/auth/logout', authenticateToken, (req, res) => {
    //console.log(`User logged out: ${req.user.name}`);
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

app.post('/auth/register', async (req, res) => {
    try {
        const { name, username, password, department, role } = req.body;

        if (!name || !username || !password || !department || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if username already exists
        const existingUser = await db.query(
            'SELECT id FROM userlogin WHERE username = $1',
            [username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const result = await db.query(
            'INSERT INTO userlogin (name, username, password, department, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, username, department, role',
            [name, username, hashedPassword, department, role]
        );

        //console.log(`New user registered: ${name} (${role})`);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
//!! END API OF AUTHENTICATION LOGIN

//-------------------------------------------------------//
//-------------------------------------------------------//
//-------------------------------------------------------//

// !! API FOR SURAT JALAN 
app.get('/api/suratjalan', async (req, res) => {
    try {
        console.log('Fetching surat jalan data from database...');
        
        const query = `
            SELECT nosj, tanggal 
            FROM suratjalan 
            ORDER BY tanggal DESC
        `;
        
        const results = await db.query(query);
        console.log('Surat jalan data fetched:', results);
        console.log('Results rows:', results.rows);
        
        res.json(results.rows);

    } catch (error) {
        console.error('Error fetching surat jalan data:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data surat jalan',
            error: error.message
        });
    }
});

// API endpoint untuk menyimpan nomor surat jalan baru
app.post('/api/suratjalan', async (req, res) => {
    try {
        const { nosj, tanggal } = req.body;
        
        if (!nosj) {
            return res.status(400).json({
                success: false,
                message: 'Nomor surat jalan harus diisi'
            });
        }
        
        console.log('Saving new surat jalan:', { nosj, tanggal });
        
        // Cek apakah nomor surat jalan sudah ada
        const checkQuery = 'SELECT nosj FROM suratjalan WHERE nosj = $1';
        const existingResult = await db.query(checkQuery, [nosj]);
        
        if (existingResult.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Nomor surat jalan sudah ada'
            });
        }
        
        const insertQuery = `
            INSERT INTO suratjalan (nosj, tanggal) 
            VALUES ($1, $2)
        `;
        
        const currentDate = tanggal || new Date().toISOString().slice(0, 10);
        await db.query(insertQuery, [nosj, currentDate]);
        
        console.log('Surat jalan saved successfully');
        
        res.json({
            success: true,
            message: 'Nomor surat jalan berhasil disimpan',
            data: { nosj, tanggal: currentDate }
        });

    } catch (error) {
        console.error('Error saving surat jalan:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menyimpan nomor surat jalan',
            error: error.message
        });
    }
});
// !! END OF API SURAT JALAN 

//-------------------------------------------------------//
//-------------------------------------------------------//
//-------------------------------------------------------//

// !! API FOR TRUCKS 
app.get('/api/trucks/history', async (req, res) => {
    try {
    const { searchTerm, status, type, dateFrom, dateTo } = req.query;
    
    let query = 'SELECT * FROM trucks WHERE 1=1';
    let params = [];
    let paramIndex = 1;

    // Add search filter
    if (searchTerm) {
        query += ` AND (
        platenumber ILIKE $${paramIndex} OR 
        driver ILIKE $${paramIndex} OR 
        supplier ILIKE $${paramIndex} OR 
        goods ILIKE $${paramIndex}
        )`;
        params.push(`%${searchTerm}%`);
        paramIndex++;
    }

    // Add status filter
    if (status && status !== 'all') {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
    }

    // Add type filter  
    if (type && type !== 'all') {
        query += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
    }

    // Add date range filter
    if (dateFrom) {
        query += ` AND date >= $${paramIndex}`;
        params.push(dateFrom);
        paramIndex++;
    }

    if (dateTo) {
        query += ` AND date <= $${paramIndex}`;
        params.push(dateTo);
        paramIndex++;
    }

    query += ' ORDER BY date DESC, arrivaltime DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
    } catch (error) {
    console.error('Error fetching truck history:', error);
    res.status(500).json({ error: 'Internal server error' });
    }
});

// POST endpoint untuk membuat truck baru
app.post('/api/trucks', async (req, res) => {
    try {
        const {
            platenumber, noticket, department, nikdriver, tlpdriver, nosj, tglsj,
            driver, supplier, arrivaltime, eta, status, type, operation, goods,
            descin, descout, statustruck, estimatedfinish, estimatedwaittime,
            actualwaittime, startloadingtime, finishtime, date, armada, kelengkapan, jenismobil
        } = req.body;

        const query = `
            INSERT INTO trucks (
                platenumber, noticket, department, nikdriver, tlpdriver, nosj, tglsj,
                driver, supplier, arrivaltime, eta, status, type, operation, goods,
                descin, descout, statustruck, estimatedfinish, estimatedwaittime,
                actualwaittime, startloadingtime, finishtime, date, armada, kelengkapan, jenismobil
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
            ) RETURNING *
        `;

        const values = [
            platenumber, noticket, department, nikdriver, tlpdriver, nosj, tglsj,
            driver, supplier, arrivaltime, eta, status, type, operation, goods,
            descin, descout, statustruck, estimatedfinish, estimatedwaittime,
            actualwaittime, startloadingtime, finishtime, date, armada, kelengkapan, jenismobil
        ];

        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating truck:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT endpoint untuk update truck
app.put('/api/trucks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Build dynamic update query
        const updateFields = Object.keys(updateData).filter(key => updateData[key] !== undefined);
        const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const query = `UPDATE trucks SET ${setClause} WHERE id = $1 RETURNING *`;
        const values = [id, ...updateFields.map(field => updateData[field])];

        const result = await db.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Truck not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating truck:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE endpoint untuk menghapus truck
app.delete('/api/trucks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = 'DELETE FROM trucks WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Truck not found' });
        }

        res.json({ message: 'Truck deleted successfully', truck: result.rows[0] });
    } catch (error) {
        console.error('Error deleting truck:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET endpoint untuk trucks (tidak hanya history)
app.get('/api/trucks', async (req, res) => {
    try {
        const { searchTerm, status, type, operation, dateFrom, dateTo } = req.query;
        
        let query = 'SELECT * FROM trucks WHERE 1=1';
        let params = [];
        let paramIndex = 1;

        // Add search filter
        if (searchTerm) {
            query += ` AND (
                platenumber ILIKE $${paramIndex} OR 
                driver ILIKE $${paramIndex} OR 
                supplier ILIKE $${paramIndex} OR 
                goods ILIKE $${paramIndex}
            )`;
            params.push(`%${searchTerm}%`);
            paramIndex++;
        }

        // Add status filter
        if (status && status !== 'all') {
            query += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        // Add type filter  
        if (type && type !== 'all') {
            query += ` AND type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        // Add operation filter
        if (operation && operation !== 'all') {
            query += ` AND operation = $${paramIndex}`;
            params.push(operation);
            paramIndex++;
        }

        // Add date range filter
        if (dateFrom) {
            query += ` AND date >= $${paramIndex}`;
            params.push(dateFrom);
            paramIndex++;
        }

        if (dateTo) {
            query += ` AND date <= $${paramIndex}`;
            params.push(dateTo);
            paramIndex++;
        }

        query += ' ORDER BY date DESC, arrivaltime DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching trucks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// !! END OF API FOR TRUCKS

//-------------------------------------------------------//
//-------------------------------------------------------//
//-------------------------------------------------------//

server.listen(port, () => {
    //console.log(`Server + WebSocket listening on http://192.168.4.62:${port}`);
    //console.log(`WebSocket endpoint: ws://192.168.4.62:${port}`);
    //console.log(`Image uploads: http://192.168.4.62:${port}/uploads/`);
});