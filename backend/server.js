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
    console.log("📡 Broadcasting to", wss.clients.size, "clients:", data);
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // 1 === OPEN
            client.send(JSON.stringify(data));
        }
    });
}

// WebSocket setup
wss.on("connection", (ws) => {
    console.log("🔌 WebSocket client connected. Total clients:", wss.clients.size);

    ws.send(JSON.stringify({
        type: "info",
        message: "Connected to WebSocket server",
        timestamp: new Date().toISOString()
    }));

    ws.on("message", (message) => {
        console.log("📨 Message from client:", message.toString());
    });

    ws.on("close", () => {
        console.log("❌ WebSocket client disconnected. Remaining clients:", wss.clients.size);
    });

    ws.on("error", (error) => {
        console.error("🚨 WebSocket error:", error);
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
    console.log('✅ Connected to MQTT broker');
    mqttClient.subscribe('rfid/entry', (err) => {
        if (err) {
            console.error('❌ Failed to subscribe to rfid/entry topic:', err);
        } else {
            console.log('✅ Subscribed to rfid/entry topic');
        }
    });
});

// Enhanced function to handle employee exit with leave permission validation
async function handleEmployeeExit(uid, licensePlate, attendanceRecord) {
    console.log("🔍 Checking leave permission for exit:", licensePlate);

    // Only match leave permission for today (or the date of the attendance record)
    const attendanceDate = attendanceRecord.datein ? new Date(attendanceRecord.datein).toISOString().split('T')[0] : null;

    // Debug: Print the values being used for the query
    console.log("🔎 Query params:", { licensePlate, attendanceDate });

    // Check for any approved leave permission for today that is not yet used
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

    // Debug: Print what was returned
    console.log("🔎 leavePermission.rows:", leavePermission.rows);

    if (leavePermission.rows.length > 0) {
        const permission = leavePermission.rows[0];
        console.log(permission);
        const now = new Date();
        const plannedExitTime = new Date(permission.exittime);
        
        console.log("✅ Found approved leave permission for:", licensePlate);
        console.log("⏰ Planned exit time:", plannedExitTime);
        console.log("⏰ Actual exit time:", now);
        
        // Update attendance_logs with actual_exittime (leave permission exit)
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
        
        console.log("✅ Leave exit recorded - actual_exittime set in both attendance_logs and leave_permission");
        
        return {
            type: 'leave_exit',
            permission: permission,
            isEarly: now < plannedExitTime,
            isLate: now > plannedExitTime
        };
    } else {
        console.log("📋 No approved leave permission found, treating as regular exit");
        
        // Regular end-of-day exit
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

// Enhanced function to handle employee return with leave permission validation
async function handleEmployeeReturn(uid, licensePlate) {
    console.log("🔍 Checking for active leave permission return:", licensePlate);
    
    // Check for leave permission that has actual_exittime but not actual_returntime
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
        
        console.log("✅ Found active leave permission for return:", licensePlate);
        console.log("⏰ Planned return time:", plannedReturnTime);
        console.log("⏰ Actual return time:", now);
        
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
        console.log("📋 No active leave permission found, treating as new entry");
        return {
            type: 'new_entry'
        };
    }
}

mqttClient.on('error', (error) => {
    console.error('🚨 MQTT Client Error:', error);
});


mqttClient.on('message', async (topic, message) => {
    if (topic === 'rfid/entry') {
        try {
            const payload = JSON.parse(message.toString());
            console.log('📄 RFID payload:', payload);

            const { uid, timestamp } = payload;

            if (!uid) {
                console.log('❌ Missing UID in payload');
                return;
            }

            const user = await db.query('SELECT * FROM users WHERE uid = $1', [uid]);

            if (user.rows.length === 0) {
                console.log("❌ UID not found:", uid);
                
                // OPTIMIZED: Minimal rejection response for ESP32
                mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify({
                    status: 'rejected',
                    reason: 'Unknown Card'  // Short reason for LCD
                }));
                return;
            }

            const userInfo = user.rows[0];
            const licensePlate = userInfo.licenseplate;
            console.log("✅ Valid UID:", uid, "User:", userInfo.name);

            const today = new Date().toISOString().split('T')[0];
            const existingEntry = await db.query(
                'SELECT * FROM attendance_logs WHERE uid = $1 AND DATE(datein) = $2 AND dateout IS NULL ORDER BY datein DESC LIMIT 1',
                [uid, today]
            );

            if (existingEntry.rows.length > 0) {
                // =================== EXIT/LEAVE LOGIC ===================
                const attendance = existingEntry.rows[0];

                // Check for leave permission for today
                const leavePermission = await db.query(
                    `SELECT * FROM leave_permission 
                    WHERE licenseplate = $1 
                    AND date = $2
                    AND (
                        (statusfromhr = 'approved' AND statusfromdept = 'approved' AND role = 'Staff')
                        OR
                        (statusfromhr = 'approved' AND statusfromdirector = 'approved' AND role = 'Head Department')
                    )
                    ORDER BY date DESC
                    LIMIT 1`,
                    [licensePlate, today]
                );
                const leave = leavePermission.rows[0];

                // 1. If leave permission exists and actual_exittime is not set, do leave_exit
                if (leave && !leave.actual_exittime) {
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

                // 2. LEAVE RETURN - capture image specifically for leave return
                if (leave && leave.actual_exittime && !leave.actual_returntime) {
                    const imagePathLeaveReturn = await captureSnapshot(uid);
                    await db.query(
                        'UPDATE attendance_logs SET image_path_leave_return = $1, actual_returntime = CURRENT_TIMESTAMP, status = $2, leave_permission_id = $3 WHERE id = $4',
                        [imagePathLeaveReturn, 'leave_return', leave.id, attendance.id]
                    );
                    await db.query(
                        'UPDATE leave_permission SET actual_returntime = CURRENT_TIMESTAMP WHERE id = $1',
                        [leave.id]
                    );
                    
                    const updatedRecord = await db.query('SELECT * FROM attendance_logs WHERE id = $1', [attendance.id]);
                    const returnDataFull = {
                        ...updatedRecord.rows[0],
                        type: 'leave_return',
                        leaveInfo: {
                            permissionId: leave.id,
                            plannedTime: leave.returntime,
                            isEarly: new Date() < new Date(leave.returntime),
                            isLate: new Date() > new Date(leave.returntime),
                            reason: leave.reason
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

                // 3. REGULAR EXIT - capture image for regular exit
                const imagePathOut = await captureSnapshot(uid);
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
            
            } else {
                // =================== ENTRY LOGIC ===================
                console.log("🚪 Processing ENTRY for:", userInfo.name);

                // Check if this is a return from leave or new entry
                const returnResult = await handleEmployeeReturn(uid, licensePlate);
                
                if (returnResult.type === 'leave_return') {
                    // This is a return from approved leave
                    console.log("🔄 Processing LEAVE RETURN for:", userInfo.name);
                    
                    // Capture return image
                    const imagePath = await captureSnapshot(uid);
                    
                    // Update the existing attendance record with return image
                    await db.query(
                        'UPDATE attendance_logs SET image_path_out = $1 WHERE licenseplate = $2 AND DATE(datein) = CURRENT_DATE',
                        [imagePath, licensePlate]
                    );
                    
                    // Get the updated record
                    const updatedRecord = await db.query(
                        'SELECT * FROM attendance_logs WHERE licenseplate = $1 AND DATE(datein) = CURRENT_DATE',
                        [licensePlate]
                    );
                    
                    // Prepare response message
                    let actionMessage = 'Return';
                    let statusMessage = 'Welcome back!';
                    
                    if (returnResult.isEarly) {
                        statusMessage = 'Early return';
                    } else if (returnResult.isLate) {
                        statusMessage = 'Late return';
                    }

                    // Full data for WebSocket broadcast (dashboard)
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
                    console.log("🔄 LEAVE RETURN broadcasted to dashboard");

                    // OPTIMIZED: Response for ESP32 LCD
                    const esp32Response = {
                        status: 'approved',
                        name: userInfo.name.substring(0, 16),        
                        department: userInfo.department.substring(0, 8),  
                        action: actionMessage                             
                    };

                    mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify(esp32Response));
                    console.log("📤 Sent LEAVE RETURN approval to ESP32:", esp32Response);
                    
                } else {
                    // Regular new entry
                    console.log("🚪 Processing NEW ENTRY for:", userInfo.name);

                    // Check for approved leave permission for today
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

                    // Insert entry record, including planned leave times if any
                    const insertResult = await db.query(
                        'INSERT INTO attendance_logs (uid, licenseplate, status, exittime, returntime) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                        [uid, licensePlate, 'entry', plannedExitTime, plannedReturnTime]
                    );

                    // Capture entry image (background process)
                    const imagePath = await captureSnapshot(uid);

                    // Update with image path if captured
                    if (imagePath) {
                        await db.query(
                            'UPDATE attendance_logs SET image_path = $1 WHERE id = $2',
                            [imagePath, insertResult.rows[0].id]
                        );
                    }

                    // Full data for WebSocket broadcast (dashboard)
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
                        // Optionally include planned leave info for dashboard
                        leaveInfo: leavePermissionToday.rows.length > 0 ? {
                            permissionId: leavePermissionToday.rows[0].id,
                            plannedExitTime: leavePermissionToday.rows[0].exittime,
                            plannedReturnTime: leavePermissionToday.rows[0].returntime,
                            reason: leavePermissionToday.rows[0].reason
                        } : null,
                        timestamp: new Date().toISOString()
                    };

                    broadcast(entryDataFull);
                    console.log("🚪 ENTRY broadcasted to dashboard");

                    // OPTIMIZED: Minimal response for ESP32 LCD
                    const esp32Response = {
                        status: 'approved',
                        name: userInfo.name.substring(0, 16),        
                        department: userInfo.department.substring(0, 8),  
                        action: 'Entry'                             
                    };

                    mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify(esp32Response));
                    console.log("📤 Sent ENTRY approval to ESP32:", esp32Response);
                }
            }

        } catch (error) {
            console.error('❌ Error processing MQTT message:', error);
            
            // Send error response to ESP32
            if (payload && payload.uid) {
                mqttClient.publish(`rfid/approval/${payload.uid}`, JSON.stringify({
                    status: 'rejected',
                    reason: 'Server Error'
                }));
            }
        }
    }
});

// Additional helper function for testing ESP32 responses
function testESP32Response(uid) {
    // Test function untuk mengirim response ke ESP32 secara manual
    const testResponse = {
        status: 'approved',
        name: 'Test User',
        department: 'IT',
        action: 'Entry'
    };
    
    mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify(testResponse));
    console.log("🧪 Test response sent to ESP32 for UID:", uid);
}

app.post('/test-esp32', async (req, res) => {
    try {
        const { uid } = req.body;
        
        if (!uid) {
            return res.status(400).json({ message: 'UID is required' });
        }

        testESP32Response(uid);
        res.json({ 
            message: `Test response sent to ESP32 for UID: ${uid}`,
            topic: `rfid/approval/${uid}`
        });
    } catch (error) {
        console.error('❌ Error in test endpoint:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Debug endpoint to check MQTT connection
app.get('/mqtt-status', (req, res) => {
    res.json({
        connected: mqttClient.connected,
        subscribed_topics: ['rfid/entry'],
        last_message_time: mqttClient.lastMessageTime || 'Never',
        broker_url: process.env.MQTT_BROKER_URL || 'mqtt://mqtt:1884'
    });
});

// Helper function to convert database timestamp to Jakarta timezone ISO string
function convertToJakartaISO(dbTimestamp) {
    if (!dbTimestamp) return null;
    
    // If it's already a JavaScript Date object
    if (dbTimestamp instanceof Date) {
        // Create a new date with Jakarta timezone offset
        const jakartaTime = new Date(dbTimestamp.getTime() + (7 * 60 * 60 * 1000)); // Add 7 hours
        return jakartaTime.toISOString().replace('Z', '+07:00'); // Mark as Jakarta time
    }
    
    // If it's a string timestamp from database (YYYY-MM-DD HH:mm:ss format)
    if (typeof dbTimestamp === 'string') {
        // Assume database timestamp is already in Jakarta time
        // Convert format to ISO with Jakarta timezone
        const isoString = dbTimestamp.replace(' ', 'T') + '+07:00';
        return isoString;
    }
    
    return dbTimestamp;
}

// Enhanced logs endpoint with leave permission data
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

        // Convert all timestamp fields to proper Jakarta timezone
        const formattedRows = result.rows.map(row => ({
            ...row,
            datein: convertToJakartaISO(row.datein),
            dateout: convertToJakartaISO(row.dateout),
            planned_exit_time: row.planned_exit_time,
            planned_return_time: row.planned_return_time,
            actual_exittime: convertToJakartaISO(row.actual_exittime),
            actual_returntime: convertToJakartaISO(row.actual_returntime)
        }));

        console.log(`📋 Fetched ${formattedRows.length} log records with proper Jakarta timezone`);
        res.json(formattedRows);
    } catch (e) {
        console.error("❌ Error fetching logs:", e);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get all users
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
        console.log(`👥 Fetched ${result.rows.length} users`);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get users by department
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
        console.log(`👥 Fetched ${result.rows.length} users for department: ${department}`);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching users by department:', error);
        res.status(500).json({ error: 'Failed to fetch users by department' });
    }
});

// Get leave permission status for a specific employee
app.get('/employee/:uid/leave-status', async (req, res) => {
    try {
        const { uid } = req.params;
        
        // Get user info
        const user = await db.query('SELECT * FROM users WHERE uid = $1', [uid]);
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const userInfo = user.rows[0];
        
        // Get today's attendance
        const attendance = await db.query(
            'SELECT * FROM attendance_logs WHERE uid = $1 AND DATE(datein) = CURRENT_DATE ORDER BY datein DESC LIMIT 1',
            [uid]
        );
        
        // Get today's leave permissions
        const leavePermissions = await db.query(
            `SELECT * FROM leave_permission 
            WHERE uid = $1 AND date = CURRENT_DATE 
            ORDER BY submittedat DESC`,
            [uid]
        );
        
        // Get approved leave permission for today
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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        websocket_clients: wss.clients.size,
        mqtt_connected: mqttClient.connected,
        timestamp: new Date().toISOString()
    });
});

// Add a new leave permission entry
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
        res.status(201).json(result.rows[0]);
    } catch (e) {
        console.error("❌ Error inserting leave permission:", e);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// Update a leave permission entry by id
app.put('/leave-permission/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Only allow updating certain fields for approval
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
        res.json(result.rows[0]);
    } catch (e) {
        console.error('❌ Error updating leave permission:', e);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get all leave permissions
app.get('/leave-permission', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM leave_permission ORDER BY submittedat DESC');
        res.json(result.rows);
    } catch (e) {
        console.error("❌ Error fetching leave permissions:", e);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Authentication routes
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
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

        // Find user by username
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

        // For now, we'll do plain text comparison since existing data is not hashed
        // In production, you should hash passwords and use bcrypt.compare()
        const isValidPassword = password === user.password;

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Generate JWT token
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

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        console.log(`✅ User logged in: ${user.name} (${user.role})`);

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

// Get current user info (protected route)
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

// Logout endpoint (optional - mainly for token blacklisting if implemented)
app.post('/auth/logout', authenticateToken, (req, res) => {
    // In a real implementation, you might want to blacklist the token
    console.log(`👋 User logged out: ${req.user.name}`);
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Register endpoint (optional - for creating new users)
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

        console.log(`✅ New user registered: ${name} (${role})`);

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
    console.log(`🚀 Server + WebSocket listening on http://192.168.4.62:${port}`);
    console.log(`📡 WebSocket endpoint: ws://192.168.4.62:${port}`);
    console.log(`🖼️ Image uploads: http://192.168.4.62:${port}/uploads/`);
});
