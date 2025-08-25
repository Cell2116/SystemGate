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

// WebSocket setup
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

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
            role != 'Staff'
            OR statusfromdirector = 'approved'
            OR statusfromdirector IS NULL
            OR statusfromdirector = ''
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
            AND DATE(datein) = CURRENT_DATE`,
            [licensePlate]
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
            
            // Check for current attendance state - find the most recent row that can be "exited"
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
                        (statusfromhr = 'approved' AND statusfromdirector = 'approved' AND role = 'Head Department')
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
                        (statusfromhr = 'approved' AND statusfromdirector = 'approved' AND role = 'Head Department')
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
                    // Check if this is a SECOND leave permission (already returned from previous one)
                    const hasCompletedLeaveToday = await db.query(
                        `SELECT COUNT(*) as count FROM leave_permission 
                        WHERE licenseplate = $1 
                        AND date = $2
                        AND actual_exittime IS NOT NULL 
                        AND actual_returntime IS NOT NULL`,
                        [licensePlate, today]
                    );

                    if (hasCompletedLeaveToday.rows[0].count > 0) {
                        // This is a SECOND (or more) leave permission - CREATE NEW ROW
                        //console.log("Creating NEW row for additional leave permission");
                        
                        const imagePathLeaveExit = await captureSnapshot(uid);
                        
                        // Get the original entry data to copy
                        const originalEntry = await db.query(
                            'SELECT * FROM attendance_logs WHERE uid = $1 AND DATE(datein) = $2 AND status IN ($3, $4) ORDER BY datein ASC LIMIT 1',
                            [uid, today, 'entry', 'leave_return']
                        );
                        
                        if (originalEntry.rows.length > 0) {
                            const original = originalEntry.rows[0];
                            
                            // Create new row with copied entry data + leave_exit
                            const newLeaveRecord = await db.query(
                                `INSERT INTO attendance_logs 
                                (uid, licenseplate, image_path, image_path_leave_exit, datein, actual_exittime, status, leave_permission_id) 
                                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7) RETURNING *`,
                                [uid, licensePlate, original.image_path, imagePathLeaveExit, original.datein, 'leave_exit', leave.id]
                            );
                            
                            await db.query(
                                'UPDATE leave_permission SET actual_exittime = CURRENT_TIMESTAMP WHERE id = $1',
                                [leave.id]
                            );
                            
                            const exitDataFull = {
                                ...newLeaveRecord.rows[0],
                                type: 'leave_exit',
                                name: userInfo.name,
                                department: userInfo.department,
                                leaveInfo: {
                                    permissionId: leave.id,
                                    plannedTime: leave.exittime,
                                    isEarly: new Date() < new Date(leave.exittime),
                                    isLate: new Date() > new Date(leave.exittime),
                                    reason: leave.reason
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
                            return;
                        }
                    } else {
                        // FIRST leave permission - UPDATE existing row
                        //console.log("Updating existing row for first leave permission");
                        
                        const imagePathLeaveExit = await captureSnapshot(uid);
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
                                reason: leave.reason
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
                        return;
                    }
                }

                //Exit Regular - Close ALL open rows for end of day
                else {
                    //console.log("Processing REGULAR EXIT");
                    const imagePathOut = await captureSnapshot(uid);
                
                // Get all open attendance records for today
                const allOpenRecords = await db.query(
                    'SELECT * FROM attendance_logs WHERE uid = $1 AND DATE(datein) = $2 AND dateout IS NULL',
                    [uid, today]
                );
                
                // Close all open records
                await db.query(
                    'UPDATE attendance_logs SET image_path_out = $1, dateout = CURRENT_TIMESTAMP, status = $2 WHERE uid = $3 AND DATE(datein) = $4 AND dateout IS NULL',
                    [imagePathOut, 'exit', uid, today]
                );
                
                // Broadcast for each updated record
                for (const record of allOpenRecords.rows) {
                    const updatedRecord = await db.query('SELECT * FROM attendance_logs WHERE id = $1', [record.id]);
                    const exitDataFull = {
                        ...updatedRecord.rows[0],
                        type: 'exit',
                        leaveInfo: null,
                        timestamp: new Date().toISOString()
                    };
                    broadcast(exitDataFull);
                }
                
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
                //console.log("Processing ENTRY for:", userInfo.name);
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
                    
                } else {
                    //console.log("Processing NEW ENTRY for:", userInfo.name);

                    const today = new Date().toISOString().split('T')[0];
                    const leavePermissionToday = await db.query(
                        `SELECT * FROM leave_permission 
                        WHERE uid = $1 AND date = $2 
                        AND statusfromhr = 'approved' 
                        AND statusfromdept = 'approved' 
                        AND (statusfromdirector = 'approved' OR role != 'Staff')
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
            AND (statusfromdirector = 'approved' OR role != 'Staff')`,
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

server.listen(port, () => {
    //console.log(`Server + WebSocket listening on http://192.168.4.62:${port}`);
    //console.log(`WebSocket endpoint: ws://192.168.4.62:${port}`);
    //console.log(`Image uploads: http://192.168.4.62:${port}/uploads/`);
});
