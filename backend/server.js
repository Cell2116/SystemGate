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

// Middleware untuk serve static files dari uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('📁 Static files served from:', path.join(__dirname, 'uploads'));

// Function untuk save image ke file
function saveImageToFile(base64Data, filename) {
    return new Promise((resolve, reject) => {
        try {
            console.log('📸 Saving image:', filename);
            
            // Remove data:image/jpeg;base64, prefix
            const base64Image = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
            const imageBuffer = Buffer.from(base64Image, 'base64');
            
            // Ensure uploads/trucks directory exists
            const uploadDir = path.join(__dirname, 'uploads/trucks');
            console.log('📁 Upload directory:', uploadDir);
            
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log('📁 Created directory:', uploadDir);
            }
            
            const filePath = path.join(uploadDir, filename);
            fs.writeFileSync(filePath, imageBuffer);
            console.log('✅ Image saved to:', filePath);
            
            // Return only filename for database storage
            resolve(filename);
        } catch (error) {
            console.error('❌ Error saving image:', error);
            reject(error);
        }
    });
}

// WebSocket broadcast function
function broadcast(data) {
    console.log("📢 Broadcasting to", wss.clients.size, "clients:", data.type || 'unknown');
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
    console.log("✅ WebSocket client connected. Total clients:", wss.clients.size);

    ws.send(JSON.stringify({
        type: "info",
        message: "Connected to WebSocket server",
        timestamp: new Date().toISOString()
    }));

    ws.on("message", (message) => {
        //console.log("Message from client:", message.toString());
    });

    ws.on("close", () => {
        console.log("⚠️ WebSocket client disconnected. Remaining clients:", wss.clients.size);
    });

    ws.on("error", (error) => {
        console.error("❌ WebSocket error:", error);
    });
});
// !! END OF WEBSOCKET FUNCTION

//-----------------------------------------------------//
//-----------------------------------------------------//
//-----------------------------------------------------//

// !! HIKVISION POLLING SYSTEM
const HIKVISION_POLL_INTERVAL = parseInt(process.env.HIKVISION_POLL_INTERVAL) || 3000;
let pollingActive = false;
let pollingInterval = null;

console.log(`🔧 Hikvision polling configured: ${HIKVISION_POLL_INTERVAL}ms interval`);

// Process single attlog entry (sama persis dengan MQTT flow)
async function processHikvisionEntry(attlogRecord) {
    const uid = attlogRecord.cardNo;
    const authDateTime = new Date(attlogRecord.authDateTime);
    const personName = attlogRecord.personName;
    const direction = attlogRecord.direction;

    console.log(`📡 Processing Hikvision entry: ${uid} - ${personName} - ${direction} at ${authDateTime.toISOString()}`);

    try {
        // Get user info
        const userResult = await db.query('SELECT * FROM users WHERE uid = $1', [uid]);

        if (userResult.rows.length === 0) {
            console.log(`❌ User not found: ${uid}`);
            await db.query('UPDATE attlog SET processed = 1, status = $1 WHERE id = $2', ['user_not_found', attlogRecord.id]);
            return;
        }

        const userInfo = userResult.rows[0];
        const licensePlate = userInfo.licenseplate;
        const today = new Date().toISOString().split('T')[0];

        console.log(`✅ Valid user: ${userInfo.name} (${uid})`);

        // Check existing entry today
        const existingEntry = await db.query(
            `SELECT TOP 1 * FROM attendance_logs 
            WHERE uid = $1 
            AND CONVERT(DATE, datein) = CONVERT(DATE, GETDATE())
            AND dateout IS NULL
            ORDER BY datein DESC`,
            [uid]
        );

        // SCENARIO 1: First tap (ENTRY)
        if (existingEntry.rows.length === 0) {
            console.log(`🚪 ENTRY for ${userInfo.name}`);

            // Capture entry photo
            const entryImagePath = await captureSnapshot(uid);

            await db.query(
                `INSERT INTO attendance_logs (uid, licenseplate, datein, status, image_path) 
                VALUES ($1, $2, $3, 'entry', $4)`,
                [uid, licensePlate, authDateTime, entryImagePath]
            );

            // Get the inserted record
            const recordResult = await db.query(
                `SELECT TOP 1 * FROM attendance_logs 
                WHERE uid = $1 AND licenseplate = $2 
                ORDER BY id DESC`,
                [uid, licensePlate]
            );
            const newRecord = recordResult.rows[0];

            // Broadcast to WebSocket
            broadcast({
                type: 'entry',
                id: newRecord.id,
                uid: uid,
                name: userInfo.name,
                department: userInfo.department,
                licenseplate: licensePlate,
                datein: newRecord.datein,
                status: 'entry'
            });

            console.log(`✅ ENTRY broadcast sent for ${userInfo.name}`);

            // Mark as processed
            await db.query('UPDATE attlog SET processed = 1, status = $1 WHERE id = $2', ['entry_processed', attlogRecord.id]);
            return;
        }

        // SCENARIO 2+: Subsequent taps
        const attendance = existingEntry.rows[0];
        console.log(`🔄 Found existing entry for ${userInfo.name}, checking next action...`);

        // Check for leave permission
        const leavePermission = await db.query(
            `SELECT TOP 1 * FROM leave_permission 
            WHERE licenseplate = $1 
            AND CONVERT(DATE, date) = CONVERT(DATE, GETDATE())
            AND (
                (statusfromhr = 'approved' AND statusfromdept = 'approved' AND role = 'Staff')
                OR
                (statusfromhr = 'approved' AND role = 'Head Department')
            )
            AND actual_exittime IS NULL
            ORDER BY exittime ASC`,
            [licensePlate]
        );

        // SCENARIO 2A: Has approved leave → LEAVE EXIT
        if (leavePermission.rows.length > 0) {
            const permission = leavePermission.rows[0];
            console.log(`🏃 LEAVE EXIT for ${userInfo.name} - Leave ID: ${permission.id}`);

            // Check if this is second/multiple leave
            if (attendance.leave_permission_id && attendance.leave_permission_id !== permission.id) {
                console.log(`🔄 Creating NEW ROW for second leave`);

                // Capture leave exit photo
                const leaveExitImagePath = await captureSnapshot(uid);

                // Create new row with same entry time
                await db.query(
                    `INSERT INTO attendance_logs 
                    (uid, licenseplate, datein, actual_exittime, exittime, returntime, status, leave_permission_id, image_path_leave_exit) 
                    VALUES ($1, $2, $3, $4, $5, $6, 'leave_exit', $7, $8)`,
                    [uid, licensePlate, attendance.datein, authDateTime, permission.exittime, permission.returntime, permission.id, leaveExitImagePath]
                );

                // Get the inserted leave record
                const newRowResult = await db.query(
                    `SELECT TOP 1 * FROM attendance_logs 
                    WHERE uid = $1 AND leave_permission_id = $2 
                    ORDER BY id DESC`,
                    [uid, permission.id]
                );

                await db.query(
                    'UPDATE leave_permission SET actual_exittime = $1 WHERE id = $2',
                    [authDateTime, permission.id]
                );

                broadcast({
                    type: 'leave_exit',
                    uid: uid,
                    name: userInfo.name,
                    attendanceId: newRowResult.rows[0].id,
                    leavePermissionId: permission.id,
                    isSecondLeave: true
                });

                broadcast({ type: 'data_change', table: 'attendance' });

            } else {
                // First leave - update existing row

                // Capture leave exit photo
                const leaveExitImagePath = await captureSnapshot(uid);

                await db.query(
                    'UPDATE attendance_logs SET actual_exittime = $1, exittime = $2, returntime = $3, status = $4, leave_permission_id = $5, image_path_leave_exit = $6 WHERE id = $7',
                    [authDateTime, permission.exittime, permission.returntime, 'leave_exit', permission.id, leaveExitImagePath, attendance.id]
                );

                await db.query(
                    'UPDATE leave_permission SET actual_exittime = $1 WHERE id = $2',
                    [authDateTime, permission.id]
                );

                broadcast({
                    type: 'leave_exit',
                    uid: uid,
                    name: userInfo.name,
                    attendanceId: attendance.id,
                    leavePermissionId: permission.id
                });

                broadcast({ type: 'data_change', table: 'attendance' });
            }

            console.log(`✅ LEAVE EXIT broadcast sent`);
            await db.query('UPDATE attlog SET processed = 1, status = $1 WHERE id = $2', ['leave_exit_processed', attlogRecord.id]);
            return;
        }

        // SCENARIO 2B: Check if returning from leave
        const returningLeave = await db.query(
            `SELECT TOP 1 lp.*, al.id as attendance_log_id 
            FROM leave_permission lp
            JOIN attendance_logs al ON al.leave_permission_id = lp.id
            WHERE lp.licenseplate = $1 
            AND CONVERT(DATE, lp.date) = CONVERT(DATE, GETDATE())
            AND lp.actual_exittime IS NOT NULL 
            AND lp.actual_returntime IS NULL
            AND al.uid = $2
            ORDER BY lp.actual_exittime DESC`,
            [licensePlate, uid]
        );

        // SCENARIO 2C: LEAVE RETURN
        if (returningLeave.rows.length > 0) {
            const permission = returningLeave.rows[0];
            console.log(`🔙 LEAVE RETURN for ${userInfo.name} - Leave ID: ${permission.id}`);

            // Capture leave return photo
            const leaveReturnImagePath = await captureSnapshot(uid);

            await db.query(
                'UPDATE attendance_logs SET actual_returntime = $1, returntime = $2, status = $3, image_path_leave_return = $4 WHERE id = $5',
                [authDateTime, permission.returntime, 'leave_return', leaveReturnImagePath, permission.attendance_log_id]
            );

            await db.query(
                'UPDATE leave_permission SET actual_returntime = $1 WHERE id = $2',
                [authDateTime, permission.id]
            );

            broadcast({
                type: 'leave_return',
                uid: uid,
                name: userInfo.name,
                attendanceId: permission.attendance_log_id,
                leavePermissionId: permission.id
            });

            broadcast({ type: 'data_change', table: 'attendance' });

            console.log(`✅ LEAVE RETURN broadcast sent`);
            await db.query('UPDATE attlog SET processed = 1, status = $1 WHERE id = $2', ['leave_return_processed', attlogRecord.id]);
            return;
        }

        // SCENARIO 2D: REGULAR EXIT (no more leaves)
        console.log(`🚪 REGULAR EXIT for ${userInfo.name} - closing all open records`);

        // Capture exit photo
        const exitImagePath = await captureSnapshot(uid);

        // Close ALL open records
        await db.query(
            `UPDATE attendance_logs 
            SET dateout = $2, status = 'exit', image_path_out = $3
            WHERE uid = $1 
            AND CONVERT(DATE, datein) = CONVERT(DATE, GETDATE())
            AND dateout IS NULL`,
            [uid, authDateTime, exitImagePath]
        );

        broadcast({
            type: 'exit',
            uid: uid,
            name: userInfo.name
        });

        broadcast({ type: 'data_change', table: 'attendance' });

        console.log(`✅ REGULAR EXIT broadcast sent`);
        await db.query('UPDATE attlog SET processed = 1, status = $1 WHERE id = $2', ['exit_processed', attlogRecord.id]);

    } catch (error) {
        console.error('❌ Error processing Hikvision entry:', error);
        await db.query('UPDATE attlog SET processed = 1, status = $1 WHERE id = $2',
            ['error: ' + error.message, attlogRecord.id]);
    }
}

// Main polling function
async function pollHikvisionDatabase() {
    if (pollingActive) {
        //console.log('⏭️ Skipping poll - already active');
        return;
    }

    pollingActive = true;

    try {
        // Get unprocessed records
        const result = await db.query(
            `SELECT TOP 10 * FROM attlog 
            WHERE processed = 0 OR processed IS NULL
            ORDER BY authDateTime ASC, id ASC`
        );

        if (result.rows.length > 0) {
            console.log(`\n📊 Found ${result.rows.length} unprocessed Hikvision records`);

            for (const record of result.rows) {
                await processHikvisionEntry(record);
            }

            console.log(`✅ Processed ${result.rows.length} records\n`);
        }
    } catch (error) {
        console.error('❌ Hikvision polling error:', error);
    } finally {
        pollingActive = false;
    }
}

// Start polling on server startup
function startHikvisionPolling() {
    console.log(`\n🔄 Starting Hikvision database polling...`);
    console.log(`   Interval: ${HIKVISION_POLL_INTERVAL}ms (${HIKVISION_POLL_INTERVAL / 1000}s)`);
    console.log(`   WebSocket clients: ${wss.clients.size}\n`);

    // Run immediately
    pollHikvisionDatabase();

    // Then run on interval
    pollingInterval = setInterval(pollHikvisionDatabase, HIKVISION_POLL_INTERVAL);
}

// Stop polling (for graceful shutdown)
function stopHikvisionPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        console.log('⏹️ Hikvision polling stopped');
    }
}

// Start polling after 2 seconds (give time for database connection)
console.log('⏳ Scheduling Hikvision polling to start in 2 seconds...');
setTimeout(startHikvisionPolling, 2000);

// !! END OF HIKVISION POLLING SYSTEM

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

async function handleEmployeeExit(uid, licensePlate, attendanceRecord) {
    //console.log("Checking leave permission for exit:", licensePlate);
    const attendanceDate = attendanceRecord.datein ? new Date(attendanceRecord.datein).toISOString().split('T')[0] : null;
    //console.log("Query params:", { licensePlate, attendanceDate });
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
                exittime = $2,
                returntime = $3,
                status = 'leave_exit'
            WHERE id = $1`,
            [attendanceRecord.id, permission.exittime, permission.returntime]
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
                returntime = $3,
                status = 'leave_return'
            WHERE licenseplate = $1 
            AND DATE(datein) = CURRENT_DATE
            AND leave_permission_id = $2`,
            [licensePlate, permission.id, permission.returntime]
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

// !! MQTT CONNECT FUNCTION DATA FROM IOT - DISABLED FOR HIKVISION POLLING
// MQTT Setup
// const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://mqtt:1884');

/* MQTT CODE DISABLED - NOW USING HIKVISION POLLING SYSTEM
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

            // Check for current attendance state - find the main entry record first
            const existingEntry = await db.query(
                `SELECT * FROM attendance_logs 
                WHERE uid = $1 AND DATE(datein) = $2 AND dateout IS NULL 
                ORDER BY 
                    CASE 
                        WHEN status = 'entry' THEN 1 
                        WHEN leave_permission_id IS NULL THEN 2
                        ELSE 3 
                    END, 
                    id ASC 
                LIMIT 1`,
                [uid, today]
            );

            if (existingEntry.rows.length > 0) {
                // =================== EXIT/LEAVE LOGIC ===================
                const attendance = existingEntry.rows[0];
                console.log("Found existing entry:", {
                    id: attendance.id,
                    status: attendance.status,
                    leave_permission_id: attendance.leave_permission_id,
                    user: userInfo.name
                });
                const returningLeavePermission = await db.query(
                    `SELECT TOP 1 lp.*, al.id as attendance_log_id
                    FROM leave_permission lp 
                    JOIN attendance_logs al ON lp.id = al.leave_permission_id 
                    WHERE lp.licenseplate = $1 
                    AND lp.date = $2
                    AND (
                        (lp.statusfromhr = 'approved' AND lp.statusfromdept = 'approved' AND lp.role = 'Staff')
                        OR
                        (lp.statusfromhr = 'approved' AND lp.role = 'Head Department')
                    )
                    AND lp.actual_exittime IS NOT NULL
                    AND lp.actual_returntime IS NULL
                    AND al.uid = $3
                    AND al.status IN ('leave_exit')
                    ORDER BY lp.actual_exittime DESC`,
                    [licensePlate, today, uid]
                );
                const returningLeave = returningLeavePermission.rows[0];

                const leavePermission = await db.query(
                    `SELECT TOP 1 * FROM leave_permission 
                    WHERE licenseplate = $1 
                    AND date = $2
                    AND (
                        (statusfromhr = 'approved' AND statusfromdept = 'approved' AND role = 'Staff')
                        OR
                        (statusfromhr = 'approved' AND role = 'Head Department')
                    )
                    AND actual_exittime IS NULL
                    ORDER BY submittedat ASC`,
                    [licensePlate, today]
                );
                const leave = leavePermission.rows[0];

                if (returningLeave) {
                    //console.log("Processing LEAVE RETURN - specific attendance record");
                    const imagePathLeaveReturn = await captureSnapshot(uid);

                    // Update the specific attendance record using attendance_log_id
                    await db.query(
                        'UPDATE attendance_logs SET image_path_leave_return = $1, actual_returntime = CURRENT_TIMESTAMP, returntime = $2, status = $3 WHERE id = $4',
                        [imagePathLeaveReturn, leave.returntime, 'leave_return', returningLeave.attendance_log_id]
                    );

                    await db.query(
                        'UPDATE leave_permission SET actual_returntime = CURRENT_TIMESTAMP WHERE id = $1',
                        [returningLeave.id]
                    );

                    const updatedRecord = await db.query(
                        'SELECT * FROM attendance_logs WHERE id = $1',
                        [returningLeave.attendance_log_id]
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
                    console.log("Processing LEAVE EXIT - handling multiple leaves", {
                        leaveId: leave.id,
                        currentAttendanceId: attendance.id,
                        currentLeaveId: attendance.leave_permission_id,
                        reason: leave.reason
                    });

                    const imagePathLeaveExit = await captureSnapshot(uid);

                    const leaveReason = leave.reason.toLowerCase();
                    const isNoReturnLeave = leaveReason.includes('sick') ||
                        leaveReason.includes('sakit') ||
                        leaveReason.includes('emergency') ||
                        leaveReason.includes('darurat') ||
                        leaveReason.includes('pulang') ||
                        leaveReason.includes('home');

                    let attendanceRecordToUpdate;

                    // Check if current attendance already has a different leave_permission_id
                    if (attendance.leave_permission_id && attendance.leave_permission_id !== leave.id) {
                        // This is a second/subsequent leave - create new attendance row using original entry data
                        console.log("Creating new attendance row for multiple leaves", {
                            existingLeaveId: attendance.leave_permission_id,
                            newLeaveId: leave.id
                        });

                        // Find the original entry record for today to copy its datein and image_path
                        const originalEntry = await db.query(
                            'SELECT TOP 1 * FROM attendance_logs WHERE uid = $1 AND DATE(datein) = $2 AND status = $3 ORDER BY id ASC',
                            [uid, today, 'entry']
                        );

                        let originalData = originalEntry.rows[0] || attendance; // fallback to current if no entry found

                        const newAttendanceResult = await db.query(
                            'INSERT INTO attendance_logs (uid, licenseplate, datein, status, leave_permission_id, image_path_leave_exit, actual_exittime, exittime, returntime, image_path) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7, $8, $9); SELECT * FROM attendance_logs WHERE id = SCOPE_IDENTITY()',
                            [uid, licensePlate, originalData.datein, isNoReturnLeave ? 'leave_exit_final' : 'leave_exit', leave.id, imagePathLeaveExit, leave.exittime, leave.returntime, originalData.image_path]
                        );
                        attendanceRecordToUpdate = newAttendanceResult.rows[0];

                        if (isNoReturnLeave) {
                            // For final leaves, also set dateout
                            await db.query(
                                'UPDATE attendance_logs SET dateout = CURRENT_TIMESTAMP WHERE id = $1',
                                [attendanceRecordToUpdate.id]
                            );
                        }
                    } else {
                        // This is first leave - update existing row
                        console.log("Updating existing attendance row for first leave", {
                            attendanceId: attendance.id,
                            leaveId: leave.id
                        });
                        if (isNoReturnLeave) {
                            await db.query(
                                'UPDATE attendance_logs SET image_path_leave_exit = $1, actual_exittime = CURRENT_TIMESTAMP, exittime = $2, returntime = $3, dateout = CURRENT_TIMESTAMP, status = $4, leave_permission_id = $5 WHERE id = $6',
                                [imagePathLeaveExit, leave.exittime, leave.returntime, 'leave_exit_final', leave.id, attendance.id]
                            );
                        } else {
                            await db.query(
                                'UPDATE attendance_logs SET image_path_leave_exit = $1, actual_exittime = CURRENT_TIMESTAMP, exittime = $2, returntime = $3, status = $4, leave_permission_id = $5 WHERE id = $6',
                                [imagePathLeaveExit, leave.exittime, leave.returntime, 'leave_exit', leave.id, attendance.id]
                            );
                        }
                        const updatedRecord = await db.query('SELECT * FROM attendance_logs WHERE id = $1', [attendance.id]);
                        attendanceRecordToUpdate = updatedRecord.rows[0];
                    }

                    // Update leave_permission table
                    if (isNoReturnLeave) {
                        await db.query(
                            'UPDATE leave_permission SET actual_exittime = CURRENT_TIMESTAMP, actual_returntime = CURRENT_TIMESTAMP WHERE id = $1',
                            [leave.id]
                        );
                    } else {
                        await db.query(
                            'UPDATE leave_permission SET actual_exittime = CURRENT_TIMESTAMP WHERE id = $1',
                            [leave.id]
                        );
                    }

                    const exitDataFull = {
                        ...attendanceRecordToUpdate,
                        type: isNoReturnLeave ? 'leave_exit_final' : 'leave_exit',
                        leaveInfo: {
                            permissionId: leave.id,
                            plannedTime: leave.exittime,
                            isEarly: new Date() < new Date(leave.exittime),
                            isLate: new Date() > new Date(leave.exittime),
                            reason: leave.reason,
                            noReturn: isNoReturnLeave
                        },
                        timestamp: new Date().toISOString()
                    };
                    broadcast(exitDataFull);
                    mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify({
                        status: 'approved',
                        name: userInfo.name.substring(0, 16),
                        department: userInfo.department.substring(0, 8),
                        action: isNoReturnLeave ? 'Leave (Final)' : 'Leave Exit'
                    }));
                    return;
                }

                else {
                    console.log("Processing REGULAR EXIT - closing all open attendance");

                    const imagePathOut = await captureSnapshot(uid);

                    // Get all open attendance records for today
                    const allOpenRecords = await db.query(
                        `SELECT * FROM attendance_logs 
                        WHERE uid = $1 AND DATE(datein) = $2 AND dateout IS NULL`,
                        [uid, today]
                    );

                    console.log("Found open records to close:", allOpenRecords.rows.length);

                    // Close all open records
                    for (const record of allOpenRecords.rows) {
                        await db.query(
                            'UPDATE attendance_logs SET image_path_out = $1, dateout = CURRENT_TIMESTAMP, status = $2 WHERE id = $3',
                            [imagePathOut, 'exit', record.id]
                        );
                        console.log("Closed attendance record:", record.id);
                    }

                    // Broadcast the main record exit
                    const mainRecord = allOpenRecords.rows.find(r => r.status === 'entry' || r.leave_permission_id === null) || allOpenRecords.rows[0];
                    const updatedRecord = await db.query('SELECT * FROM attendance_logs WHERE id = $1', [mainRecord.id]);
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

                const hadFinalLeaveToday = await db.query(
                    `SELECT * FROM attendance_logs 
                    WHERE uid = $1 AND DATE(datein) = $2 AND status = 'leave_exit_final'`,
                    [uid, today]
                );

                if (hadFinalLeaveToday.rows.length > 0) {
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
                        'INSERT INTO attendance_logs (uid, licenseplate, status) VALUES ($1, $2, $3); SELECT * FROM attendance_logs WHERE id = SCOPE_IDENTITY()',
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
                        AND (
                            (statusfromhr = 'approved' AND statusfromdept = 'approved' AND role = 'Staff')
                            OR
                            (statusfromhr = 'approved' AND role = 'Head Department')
                        )
                        ORDER BY submittedat DESC`,
                        [uid, today]
                    );
                    let plannedExitTime = null;
                    let plannedReturnTime = null;
                    if (leavePermissionToday.rows.length > 0) {
                        plannedExitTime = leavePermissionToday.rows[0].exittime;
                        plannedReturnTime = leavePermissionToday.rows[0].returntime;
                    }

                    const insertResult = await db.query(
                        'INSERT INTO attendance_logs (uid, licenseplate, status, exittime, returntime) VALUES ($1, $2, $3, $4, $5); SELECT * FROM attendance_logs WHERE id = SCOPE_IDENTITY()',
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
END OF MQTT CODE BLOCK */


// !! HIKVISION POLLING CONFIGURATION
// Variables already defined above in polling section

// Note: Polling is now fully implemented and running


app.get('/hikvision-status', async (req, res) => {
    try {
        // Get pending count
        const pending = await db.query('SELECT COUNT(*) as count FROM attlog WHERE processed = 0 OR processed IS NULL');
        const processed = await db.query('SELECT COUNT(*) as count FROM attlog WHERE processed = 1');

        res.json({
            polling_active: !pollingActive, // Available for next poll
            current_poll_running: pollingActive,
            poll_interval: HIKVISION_POLL_INTERVAL,
            websocket_clients: wss.clients.size,
            pending_records: pending.rows[0].count,
            processed_records: processed.rows[0].count,
            status: 'running'
        });
    } catch (error) {
        res.json({
            polling_active: !pollingActive,
            poll_interval: HIKVISION_POLL_INTERVAL,
            websocket_clients: wss.clients.size,
            status: 'running',
            error: error.message
        });
    }
});

// Legacy endpoint for backward compatibility
app.get('/mqtt-status', (req, res) => {
    res.json({
        connected: true,
        mode: 'hikvision_polling',
        poll_interval: HIKVISION_POLL_INTERVAL,
        status: 'active'
    });
});
// !! END OF HIKVISION POLLING FUNCTION

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
        // First, let's check what's in the leave_permission table
        const leavePermCheck = await db.query(`
            SELECT id, uid, actual_exittime, actual_returntime 
            FROM leave_permission 
            WHERE actual_exittime IS NOT NULL OR actual_returntime IS NOT NULL
        `);
        console.log("🔍 Records with actual times in leave_permission:", leavePermCheck.rows);

        const result = await db.query(`
            SELECT
                al.id,
                al.uid,
                al.licenseplate,
                al.datein,
                al.dateout,
                al.exittime,
                al.returntime,
                al.status,
                al.leave_permission_id,
                al.image_path,
                al.image_path_out,
                al.image_path_leave_exit,
                al.image_path_leave_return,
                al.actual_exittime as al_actual_exittime,
                al.actual_returntime as al_actual_returntime,
                u.name,
                u.department,
                lp.id as lp_id,
                lp.reason as leave_reason,
                lp.exittime as planned_exit_time,
                lp.returntime as planned_return_time,
                lp.actual_exittime as lp_actual_exittime,
                lp.actual_returntime as lp_actual_returntime
            FROM attendance_logs al
            JOIN users u ON al.uid = u.uid
            LEFT JOIN leave_permission lp ON al.leave_permission_id = lp.id
            ORDER BY al.datein DESC
        `);

        console.log("📊 Sample raw row from query:", result.rows[0]);

        const formattedRows = result.rows.map(row => {
            // Use actual times from attendance_logs first, then from leave_permission as fallback
            const actual_exittime = row.al_actual_exittime || row.lp_actual_exittime;
            const actual_returntime = row.al_actual_returntime || row.lp_actual_returntime;
            
            const formatted = {
                id: row.id,
                uid: row.uid,
                licenseplate: row.licenseplate,
                datein: convertToJakartaISO(row.datein),
                dateout: convertToJakartaISO(row.dateout),
                exittime: convertToJakartaISO(row.exittime),
                returntime: convertToJakartaISO(row.returntime),
                status: row.status,
                leave_permission_id: row.leave_permission_id,
                image_path: row.image_path,
                image_path_out: row.image_path_out,
                image_path_leave_exit: row.image_path_leave_exit,
                image_path_leave_return: row.image_path_leave_return,
                name: row.name,
                department: row.department,
                leave_reason: row.leave_reason,
                planned_exit_time: row.planned_exit_time,
                planned_return_time: row.planned_return_time,
                actual_exittime: convertToJakartaISO(actual_exittime),
                actual_returntime: convertToJakartaISO(actual_returntime)
            };

            // Log records that have exit/return times
            if (row.exittime || row.returntime || actual_exittime || actual_returntime) {
                console.log("✅ Record with times:", {
                    id: formatted.id,
                    name: formatted.name,
                    exittime: formatted.exittime,
                    returntime: formatted.returntime,
                    actual_exittime: formatted.actual_exittime,
                    actual_returntime: formatted.actual_returntime,
                    leave_permission_id: formatted.leave_permission_id
                });
            }

            return formatted;
        });

        console.log(`📈 Fetched ${formattedRows.length} log records. Records with actual times: ${formattedRows.filter(r => r.actual_exittime || r.actual_returntime).length}`);
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
        console.log(`🔍 Fetching leave status for UID: ${uid}`);

        const user = await db.query('SELECT * FROM users WHERE uid = $1', [uid]);
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userInfo = user.rows[0];

        const attendance = await db.query(
            'SELECT TOP 1 * FROM attendance_logs WHERE uid = $1 AND DATE(datein) = CURRENT_DATE ORDER BY datein DESC',
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
            AND (
                (statusfromhr = 'approved' AND statusfromdept = 'approved' AND role = 'Staff')
                OR
                (statusfromhr = 'approved' AND role = 'Head Department')
            )`,
            [uid]
        );

        // Log the leave permissions data
        if (leavePermissions.rows.length > 0) {
            console.log(`📋 Leave permissions for ${userInfo.name}:`, 
                leavePermissions.rows.map(lp => ({
                    id: lp.id,
                    actual_exittime: lp.actual_exittime,
                    actual_returntime: lp.actual_returntime,
                    status: `HR:${lp.statusfromhr}, Dept:${lp.statusfromdept}`
                }))
            );
        }

        if (attendance.rows.length > 0) {
            console.log(`📅 Today's attendance for ${userInfo.name}:`, {
                id: attendance.rows[0].id,
                actual_exittime: attendance.rows[0].actual_exittime,
                actual_returntime: attendance.rows[0].actual_returntime,
                leave_permission_id: attendance.rows[0].leave_permission_id
            });
        }

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
app.get('/health', async (req, res) => {
    try {
        const pending = await db.query('SELECT COUNT(*) as count FROM attlog WHERE processed = 0 OR processed IS NULL');

        res.json({
            status: 'OK',
            websocket_clients: wss.clients.size,
            hikvision_polling: pollingActive ? 'processing' : 'ready',
            poll_interval: HIKVISION_POLL_INTERVAL,
            pending_records: pending.rows[0].count,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            status: 'OK',
            websocket_clients: wss.clients.size,
            hikvision_polling: 'active',
            poll_interval: HIKVISION_POLL_INTERVAL,
            timestamp: new Date().toISOString()
        });
    }
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
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14);
            SELECT * FROM leave_permission WHERE id = SCOPE_IDENTITY()`,
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
        console.log(`🔄 Updating leave permission ID: ${id}`);
        console.log('📝 Update data:', req.body);
        
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
        
        // First check if record exists
        const existsResult = await db.query('SELECT id FROM leave_permission WHERE id = $1', [id]);
        if (existsResult.rows.length === 0) {
            console.log(`❌ Leave permission not found: ID ${id}`);
            return res.status(404).json({ message: 'Leave permission not found' });
        }
        
        // Update the record
        const updateQuery = `UPDATE leave_permission SET ${setClauses.join(', ')} WHERE id = $${values.length}`;
        console.log('🔧 Update query:', updateQuery);
        console.log('🔧 Update values:', values);
        
        await db.query(updateQuery, values);
        
        // Get the updated record
        const result = await db.query('SELECT * FROM leave_permission WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Leave permission not found after update' });
        }
        
        const updatedRecord = result.rows[0];
        console.log('✅ Leave permission updated successfully:', updatedRecord.id);
        
        broadcast({
            type: 'leave_permission',
            action: 'update',
            data: updatedRecord
        });
        
        res.json(updatedRecord);
    } catch (e) {
        console.error('❌ Error updating leave permission:', e);
        res.status(500).json({ message: 'Internal Server Error', error: e.message });
    }
});

app.get('/leave-permission', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM leave_permission ORDER BY submittedat DESC');
        
        // Log records with actual times
        const recordsWithActualTimes = result.rows.filter(row => 
            row.actual_exittime || row.actual_returntime
        );
        
        console.log(`📊 Leave Permission API: Total records: ${result.rows.length}, With actual times: ${recordsWithActualTimes.length}`);
        
        if (recordsWithActualTimes.length > 0) {
            console.log("✅ Records with actual times:", recordsWithActualTimes.map(row => ({
                id: row.id,
                uid: row.uid,
                actual_exittime: row.actual_exittime,
                actual_returntime: row.actual_returntime,
                statusfromhr: row.statusfromhr,
                statusfromdept: row.statusfromdept
            })));
        }
        
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

        const result = await db.query(
            'INSERT INTO userlogin (name, username, password, department, role) VALUES ($1, $2, $3, $4, $5); SELECT id, name, username, department, role FROM userlogin WHERE id = SCOPE_IDENTITY()',
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
        console.log('=== RECEIVED TRUCK DATA ===', req.body);

        const {
            platenumber, noticket, department, nikdriver, tlpdriver, nosj, tglsj,
            driver, supplier, arrivaltime, eta, status, type, operation, goods,
            descin, descout, statustruck,
            actualwaittime, totalprocessloadingtime, startloadingtime, finishtime, date, armada, kelengkapan, jenismobil,
            driver_photo, stnk_photo, sim_photo
        } = req.body;

        console.log('=== EXTRACTED VALUES ===', {
            platenumber, noticket, department, nikdriver, tlpdriver, nosj, tglsj,
            driver, supplier, arrivaltime, eta, status, type, operation, goods,
            descin, descout, statustruck,
            actualwaittime, totalprocessloadingtime, startloadingtime, finishtime, date, armada, kelengkapan, jenismobil
        });

        // Handle image saving
        const imageFields = ['driver_photo', 'sim_photo', 'stnk_photo'];
        const savedImages = {};
        
        for (const field of imageFields) {
            if (req.body[field] && req.body[field].startsWith('data:image')) {
                const filename = `${field.replace('_photo', '')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
                savedImages[field] = await saveImageToFile(req.body[field], filename);
            } else {
                savedImages[field] = req.body[field] || null;
            }
        }

        // Connect to SQL Server and execute query
        const pool = await db.getPool();
        const request = pool.request();
        
        // Add parameters
        request.input('platenumber', db.sql.VarChar, platenumber);
        request.input('noticket', db.sql.VarChar, noticket);
        request.input('department', db.sql.VarChar, department);
        request.input('nikdriver', db.sql.VarChar, nikdriver);
        request.input('tlpdriver', db.sql.VarChar, tlpdriver);
        request.input('nosj', db.sql.VarChar, nosj);
        request.input('tglsj', db.sql.Date, tglsj);
        request.input('driver', db.sql.VarChar, driver);
        request.input('supplier', db.sql.VarChar, supplier);
        request.input('arrivaltime', db.sql.DateTime2, arrivaltime);
        request.input('eta', db.sql.VarChar, eta);
        request.input('status', db.sql.VarChar, status || 'Waiting');
        request.input('type', db.sql.VarChar, type);
        request.input('operation', db.sql.VarChar, operation);
        request.input('goods', db.sql.VarChar, goods);
        request.input('descin', db.sql.VarChar, descin);
        request.input('descout', db.sql.VarChar, descout);
        request.input('statustruck', db.sql.VarChar, statustruck);
        request.input('actualwaittime', db.sql.Time, actualwaittime);
        request.input('totalprocessloadingtime', db.sql.Time, totalprocessloadingtime);
        request.input('startloadingtime', db.sql.DateTime2, startloadingtime);
        request.input('finishtime', db.sql.DateTime2, finishtime);
        request.input('date', db.sql.Date, date);
        request.input('armada', db.sql.VarChar, armada);
        request.input('kelengkapan', db.sql.VarChar, kelengkapan);
        request.input('jenismobil', db.sql.VarChar, jenismobil);
        request.input('driver_photo', db.sql.VarChar, savedImages.driver_photo);
        request.input('sim_photo', db.sql.VarChar, savedImages.sim_photo);
        request.input('stnk_photo', db.sql.VarChar, savedImages.stnk_photo);

        const query = `
            INSERT INTO trucks (
                platenumber, noticket, department, nikdriver, tlpdriver, nosj, tglsj,
                driver, supplier, arrivaltime, eta, status, type, operation, goods,
                descin, descout, statustruck,
                actualwaittime, totalprocessloadingtime, startloadingtime, finishtime, date, armada, kelengkapan, jenismobil,
                driver_photo, sim_photo, stnk_photo
            ) OUTPUT INSERTED.*
            VALUES (
                @platenumber, @noticket, @department, @nikdriver, @tlpdriver, @nosj, @tglsj,
                @driver, @supplier, @arrivaltime, @eta, @status, @type, @operation, @goods,
                @descin, @descout, @statustruck,
                @actualwaittime, @totalprocessloadingtime, @startloadingtime, @finishtime, @date, @armada, @kelengkapan, @jenismobil,
                @driver_photo, @sim_photo, @stnk_photo
            )
        `;

        const result = await request.query(query);
        console.log('=== DB RESULT ===', result.recordset[0]);
        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error('Error creating truck:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// PUT endpoint untuk update truck
app.put('/api/trucks/:id', async (req, res) => {
    try {
        console.log('=== UPDATE TRUCK API CALLED ===');
        const { id } = req.params;
        const updateData = req.body;

        console.log('Truck ID:', id);
        console.log('Update data received:', updateData);

        // Handle image saving
        const imageFields = ['driver_photo', 'sim_photo', 'stnk_photo'];
        const savedImages = {};
        
        for (const field of imageFields) {
            if (updateData[field] && updateData[field].startsWith('data:image')) {
                const filename = `${field.replace('_photo', '')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
                savedImages[field] = await saveImageToFile(updateData[field], filename);
                updateData[field] = savedImages[field];
            }
        }

        // Connect to SQL Server
        const pool = await db.getPool();
        const request = pool.request();
        
        // Build dynamic update query
        const updateFields = Object.keys(updateData).filter(key => updateData[key] !== undefined);
        console.log('Fields to update:', updateFields);

        if (updateFields.length === 0) {
            console.log('❌ No fields to update');
            return res.status(400).json({ error: 'No fields to update' });
        }

        // Add parameters
        request.input('id', db.sql.Int, id);
        const setClause = updateFields.map(field => {
            request.input(field, db.sql.VarChar, updateData[field]);
            return `${field} = @${field}`;
        }).join(', ');

        const query = `UPDATE trucks SET ${setClause} OUTPUT INSERTED.* WHERE id = @id`;
        
        console.log('SQL Query:', query);
        console.log('Update data:', updateData);

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            console.log('❌ Truck not found with ID:', id);
            return res.status(404).json({ error: 'Truck not found' });
        }

        console.log('✅ Truck updated successfully');
        console.log('Updated truck data:', result.recordset[0]);

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('💥 Error updating truck:', error);
        console.error('💥 Error message:', error.message);
        console.error('💥 Error stack:', error.stack);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// DELETE endpoint untuk menghapus truck
app.delete('/api/trucks/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = 'SELECT * FROM trucks WHERE id = $1; DELETE FROM trucks WHERE id = $1';
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

// API endpoint untuk upload foto truck
app.post('/api/trucks/upload-photo', async (req, res) => {
    try {
        const { photoData, photoType, plateNumber } = req.body;

        if (!photoData || !photoType || !plateNumber) {
            return res.status(400).json({
                success: false,
                message: 'Photo data, type, and plate number are required'
            });
        }

        // Create trucks upload directory if it doesn't exist
        const trucksUploadDir = path.join(__dirname, 'uploads', 'trucks');
        if (!fs.existsSync(trucksUploadDir)) {
            fs.mkdirSync(trucksUploadDir, { recursive: true });
        }

        // Generate filename with timestamp and plate number
        const timestamp = Date.now();
        const sanitizedPlate = plateNumber.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${sanitizedPlate}-${timestamp}-${photoType}.jpg`;
        const filePath = path.join(trucksUploadDir, fileName);

        // Remove data URL prefix if present (data:image/jpeg;base64,)
        const base64Data = photoData.replace(/^data:image\/[a-z]+;base64,/, '');

        // Save the file
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

        // Return the relative path for database storage
        const relativePath = `trucks/${fileName}`;

        console.log(`✅ Truck photo saved: ${relativePath}`);

        res.json({
            success: true,
            message: 'Photo uploaded successfully',
            filePath: relativePath
        });

    } catch (error) {
        console.error('❌ Error uploading truck photo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload photo',
            error: error.message
        });
    }
});

// !! END OF API FOR TRUCKS

//-------------------------------------------------------//
//-------------------------------------------------------//
//-------------------------------------------------------//

server.listen(port, () => {
    console.log(`\n🚀 Server + WebSocket listening on http://192.168.10.27:${port}`);
    console.log(`📡 WebSocket endpoint: ws://192.168.10.27:${port}`);
    console.log(`📁 Image uploads: http://192.168.10.27:${port}/uploads/`);
    console.log(`⏰ Hikvision polling will start in 2 seconds...\n`);
});