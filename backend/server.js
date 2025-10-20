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
import broadcastTwillio from './broadcastTwillio.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

function saveImageToFile(base64Data, filename) {
    return new Promise((resolve, reject) => {
        try {
            const base64Image = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
            const imageBuffer = Buffer.from(base64Image, 'base64');
            const uploadDir = path.join(__dirname, 'uploads/trucks');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const filePath = path.join(uploadDir, filename);
            fs.writeFileSync(filePath, imageBuffer);
            resolve(filename);
        } catch (error) {
            console.error('❌ Error saving image:', error);
            reject(error);
        }
    });
}

function broadcast(data) {
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
    ws.send(JSON.stringify({
        type: "info",
        message: "Connected to WebSocket server",
        timestamp: new Date().toISOString()
    }));
    ws.on("message", (message) => {
        //
    });
    ws.on("close", () => {
    });
    ws.on("error", (error) => {
        console.error("❌ WebSocket error:", error);
    });
});
// !! END OF WEBSOCKET FUNCTION

//-----------------------------------------------------//
//-----------------------------------------------------//
//-----------------------------------------------------//
// !! HELPER FUNCTIONS FOR ROUTING-BASED APPROVAL SYSTEM
async function isLeavePermissionApproved(licensePlate) {
    try {
        //console.log(`🔍 Routing check for license plate: ${licensePlate}`);

        const leaveQuery = `
            SELECT lp.*, u.role, u.department as user_department, u.name as employee_name
            FROM leave_permission lp
            JOIN users u ON lp.licenseplate = u.licenseplate
            WHERE lp.licenseplate = $1 
            AND CONVERT(DATE, lp.date) = CONVERT(DATE, GETDATE())
            AND lp.actual_exittime IS NULL
        `;
        const leaveResult = await db.query(leaveQuery, [licensePlate]);
        //console.log(`📋 Found ${leaveResult.rows.length} leave requests for today`);

        if (leaveResult.rows.length === 0) {
            //console.log(`❌ No leave requests found for ${licensePlate}`);
            return false;
        }

        const leave = leaveResult.rows[0];
        //console.log(`📄 Leave request details:`, {
        //     id: leave.id,
        //     role: leave.role,
        //     department: leave.user_department,
        //     employee: leave.employee_name,
        //     statusfromhr: leave.statusfromhr,
        //     statusfromdept: leave.statusfromdept
        // });

        const routingQuery = `
            SELECT TOP 1 approval_level1_role, approval_level2_role, 
                   approval_level1_name, approval_level2_name
            FROM master_routing 
            WHERE department = $1 
            AND (employee_name = $2 OR employee_name IS NULL)
            ORDER BY CASE WHEN employee_name IS NOT NULL THEN 1 ELSE 2 END
        `;
        const routingResult = await db.query(routingQuery, [leave.user_department, leave.employee_name]);
        //console.log(`🗂️ Found ${routingResult.rows.length} routing rules`);

        if (routingResult.rows.length === 0) {
            //console.log(`❌ No routing rules found for department: ${leave.user_department}, employee: ${leave.employee_name}`);
            return false;
        }

        const routing = routingResult.rows[0];
        //console.log(`📊 Routing rule:`, {
        //     level1_role: routing.approval_level1_role,
        //     level2_role: routing.approval_level2_role,
        //     level1_name: routing.approval_level1_name,
        //     level2_name: routing.approval_level2_name
        // });

        let isApproved = false;
        if (leave.role === 'Staff') {
            const level1Approved = (routing.approval_level1_role === 'HEAD DEPARTMENT' && leave.statusfromdept === 'approved') ||
                (routing.approval_level1_role === 'HR' && leave.statusfromhr === 'approved');
            const level2Approved = (routing.approval_level2_role === 'HEAD DEPARTMENT' && leave.statusfromdept === 'approved') ||
                (routing.approval_level2_role === 'HR' && leave.statusfromhr === 'approved');

            //console.log(`📊 Staff approval check:`, {
            //     level1Approved,
            //     level2Approved,
            //     level1Required: routing.approval_level1_role,
            //     level2Required: routing.approval_level2_role
            // });

            isApproved = level1Approved && level2Approved;
        } else if (leave.role === 'Head Department') {
            isApproved = leave.statusfromhr === 'approved';
            //console.log(`📊 Head Department approval check:`, {
            //     statusfromhr: leave.statusfromhr,
            //     isApproved
            // });
        }

        //console.log(`✅ Final approval result: ${isApproved}`);
        return isApproved;
    } catch (error) {
        console.error('❌ Error checking leave permission approval:', error);
        return false;
    }
}
// !! END OF HELPER FUNCTIONS

//-----------------------------------------------------//
//-----------------------------------------------------//
//-----------------------------------------------------//
// !! HIKVISION POLLING SYSTEM
const HIKVISION_POLL_INTERVAL = parseInt(process.env.HIKVISION_POLL_INTERVAL) || 3000;
let pollingActive = false;
let pollingInterval = null;

async function processHikvisionEntry(attlogRecord) {
    const uid = attlogRecord.cardNo;
    const authDateTime = new Date(attlogRecord.authDateTime);
    const personName = attlogRecord.personName;
    const direction = attlogRecord.direction;
    try {

        const userResult = await db.query('SELECT * FROM users WHERE uid = $1', [uid]);
        if (userResult.rows.length === 0) {
            await db.query('UPDATE attlog SET processed = 1, status = $1 WHERE id = $2', ['user_not_found', attlogRecord.id]);
            return;
        }
        const userInfo = userResult.rows[0];
        const licensePlate = userInfo.licenseplate;
        const today = new Date().toISOString().split('T')[0];
        const existingEntry = await db.query(
            `SELECT TOP 1 * FROM attendance_logs 
            WHERE uid = $1 
            AND CONVERT(DATE, datein) = CONVERT(DATE, GETDATE())
            AND dateout IS NULL
            ORDER BY datein DESC`,
            [uid]
        );
        if (existingEntry.rows.length === 0) {
            const entryImagePath = await captureSnapshot(uid);
            await db.query(
                `INSERT INTO attendance_logs (uid, licenseplate, datein, status, image_path) 
                VALUES ($1, $2, $3, 'entry', $4)`,
                [uid, licensePlate, authDateTime, entryImagePath]
            );
            const recordResult = await db.query(
                `SELECT TOP 1 * FROM attendance_logs 
                WHERE uid = $1 AND licenseplate = $2 
                ORDER BY id DESC`,
                [uid, licensePlate]
            );
            const newRecord = recordResult.rows[0];
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
            await db.query('UPDATE attlog SET processed = 1, status = $1 WHERE id = $2', ['entry_processed', attlogRecord.id]);
            return;
        }
        const attendance = existingEntry.rows[0];
        //console.log(`🔄 Found existing entry for ${userInfo.name}, checking next action...`);

        // Check for leave permission using the routing system
        //console.log(`🔍 Checking leave permission for ${licensePlate}...`);
        const hasApprovedLeave = await isLeavePermissionApproved(licensePlate);
        //console.log(`✅ Leave permission approved via routing: ${hasApprovedLeave}`);

        let leavePermission = { rows: [] };
        if (hasApprovedLeave) {
            leavePermission = await db.query(
                `SELECT TOP 1 * FROM leave_permission 
                WHERE licenseplate = $1 
                AND CONVERT(DATE, date) = CONVERT(DATE, GETDATE())
                AND actual_exittime IS NULL
                ORDER BY exittime ASC`,
                [licensePlate]
            );
            //console.log(`📋 Found ${leavePermission.rows.length} approved leave permissions via routing`);
        } else {
            //console.log(`🔄 Trying fallback approval logic...`);
            leavePermission = await db.query(
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
            //console.log(`📋 Found ${leavePermission.rows.length} approved leave permissions via fallback`);
        }
        if (leavePermission.rows.length > 0) {
            const permission = leavePermission.rows[0];
            if (attendance.leave_permission_id && attendance.leave_permission_id !== permission.id) {
                const leaveExitImagePath = await captureSnapshot(uid);
                await db.query(
                    `INSERT INTO attendance_logs 
                    (uid, licenseplate, datein, actual_exittime, exittime, returntime, status, leave_permission_id, image_path_leave_exit) 
                    VALUES ($1, $2, $3, $4, $5, $6, 'leave_exit', $7, $8)`,
                    [uid, licensePlate, attendance.datein, authDateTime, permission.exittime, permission.returntime, permission.id, leaveExitImagePath]
                );
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
            await db.query('UPDATE attlog SET processed = 1, status = $1 WHERE id = $2', ['leave_exit_processed', attlogRecord.id]);
            return;
        }

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
        if (returningLeave.rows.length > 0) {
            const permission = returningLeave.rows[0];
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
            await db.query('UPDATE attlog SET processed = 1, status = $1 WHERE id = $2', ['leave_return_processed', attlogRecord.id]);
            return;
        }
        const exitImagePath = await captureSnapshot(uid);
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
        await db.query('UPDATE attlog SET processed = 1, status = $1 WHERE id = $2', ['exit_processed', attlogRecord.id]);
    } catch (error) {
        console.error('❌ Error processing Hikvision entry:', error);
        await db.query('UPDATE attlog SET processed = 1, status = $1 WHERE id = $2',
            ['error: ' + error.message, attlogRecord.id]);
    }
}


async function pollHikvisionDatabase() {
    if (pollingActive) {

        return;
    }
    pollingActive = true;
    try {
        const result = await db.query(
            `SELECT TOP 10 * FROM attlog 
            WHERE processed = 0 OR processed IS NULL
            ORDER BY authDateTime ASC, id ASC`
        );
        if (result.rows.length > 0) {
            for (const record of result.rows) {
                await processHikvisionEntry(record);
            }
        }
    } catch (error) {
        console.error('❌ Hikvision polling error:', error);
    } finally {
        pollingActive = false;
    }
}

function startHikvisionPolling() {
    pollHikvisionDatabase();
    pollingInterval = setInterval(pollHikvisionDatabase, HIKVISION_POLL_INTERVAL);
}

function stopHikvisionPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
}


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
    const attendanceDate = attendanceRecord.datein ? new Date(attendanceRecord.datein).toISOString().split('T')[0] : null;
    const hasApprovedLeave = await isLeavePermissionApproved(licensePlate);
    let leavePermission = { rows: [] };
    if (hasApprovedLeave) {
        leavePermission = await db.query(
            `SELECT * FROM leave_permission 
            WHERE licenseplate = $1 
            AND date = $2
            AND actual_exittime IS NULL
            ORDER BY date DESC
            LIMIT 1`,
            [licensePlate, attendanceDate]
        );
    }
    if (leavePermission.rows.length > 0) {
        const permission = leavePermission.rows[0];
        const now = new Date();
        const plannedExitTime = new Date(permission.exittime);
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

        return {
            type: 'leave_exit',
            permission: permission,
            isEarly: now < plannedExitTime,
            isLate: now > plannedExitTime
        };
    } else {

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
        const leaveReason = permission.reason.toLowerCase();
        const isNoReturnLeave = leaveReason.includes('sick') ||
            leaveReason.includes('sakit') ||
            leaveReason.includes('emergency') ||
            leaveReason.includes('darurat') ||
            leaveReason.includes('pulang') ||
            leaveReason.includes('home');
        if (isNoReturnLeave) {
            return {
                type: 'new_entry_after_final'
            };
        }
        const now = new Date();
        const plannedReturnTime = new Date(permission.returntime);
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

        return {
            type: 'new_entry'
        };
    }
}
//------------------------------------------------------//
//------------------------------------------------------//
//------------------------------------------------------//
// !! HIKVISION POLLING CONFIGURATION

app.get('/hikvision-status', async (req, res) => {
    try {
        const pending = await db.query('SELECT COUNT(*) as count FROM attlog WHERE processed = 0 OR processed IS NULL');
        const processed = await db.query('SELECT COUNT(*) as count FROM attlog WHERE processed = 1');
        res.json({
            polling_active: !pollingActive,
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
        const jakartaTime = new Date(dbTimestamp.getTime() + (7 * 60 * 60 * 1000));
        return jakartaTime.toISOString().replace('Z', '+07:00');
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
        const leavePermCheck = await db.query(`
            SELECT id, uid, actual_exittime, actual_returntime 
            FROM leave_permission 
            WHERE actual_exittime IS NOT NULL OR actual_returntime IS NOT NULL
        `);
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
                lp.actual_returntime as lp_actual_returntime,
                mr.approval_level1_name,
                mr.approval_level1_role,
                mr.approval_level2_name,
                mr.approval_level2_role,
                mr.approval_level3_name,
                mr.approval_level3_role
            FROM attendance_logs al
            JOIN users u ON al.uid = u.uid
            LEFT JOIN leave_permission lp ON al.leave_permission_id = lp.id
            LEFT JOIN master_routing mr ON (
                lp.department = mr.department 
                AND lp.role = mr.role
                AND (mr.employee_name IS NULL OR mr.employee_name = lp.name)
                AND mr.is_active = 1
            )
            ORDER BY al.datein DESC
        `);
        const formattedRows = result.rows.map(row => {
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
                actual_returntime: convertToJakartaISO(actual_returntime),
                approval_level1_name: row.approval_level1_name,
                approval_level1_role: row.approval_level1_role,
                approval_level2_name: row.approval_level2_name,
                approval_level2_role: row.approval_level2_role,
                approval_level3_name: row.approval_level3_name,
                approval_level3_role: row.approval_level3_role
            };
            if (row.exittime || row.returntime || actual_exittime || actual_returntime) {
                //console.log("✅ Record with times:", {
                //     id: formatted.id,
                //     name: formatted.name,
                //     exittime: formatted.exittime,
                //     returntime: formatted.returntime,
                //     actual_exittime: formatted.actual_exittime,
                //     actual_returntime: formatted.actual_returntime,
                //     leave_permission_id: formatted.leave_permission_id
                // });
            }
            return formatted;
        });
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
            `SELECT lp.* FROM leave_permission lp
            JOIN users u ON lp.licenseplate = u.licenseplate
            WHERE lp.uid = $1 AND lp.date = CURRENT_DATE`,
            [uid]
        );

        const approvedLeaves = [];
        for (const leave of approvedLeave.rows) {
            const isApproved = await isLeavePermissionApproved(leave.licenseplate);
            if (isApproved) {
                approvedLeaves.push(leave);
            }
        }

        if (leavePermissions.rows.length > 0) {
            //console.log(`📋 Leave permissions for ${userInfo.name}:`,
            // leavePermissions.rows.map(lp => ({
            //     id: lp.id,
            //     actual_exittime: lp.actual_exittime,
            //     actual_returntime: lp.actual_returntime,
            //     status: `HR:${lp.statusfromhr}, Dept:${lp.statusfromdept}`
            // }))
            // );
        }
        // if (attendance.rows.length > 0) {
        //     //console.log(`📅 Today's attendance for ${userInfo.name}:`, {
        //     //     id: attendance.rows[0].id,
        //     //     actual_exittime: attendance.rows[0].actual_exittime,
        //     //     actual_returntime: attendance.rows[0].actual_returntime,
        //     //     leave_permission_id: attendance.rows[0].leave_permission_id
        //     // });
        // }
        res.json({
            user: userInfo,
            todayAttendance: attendance.rows[0] || null,
            leavePermissions: leavePermissions.rows,
            approvedLeave: approvedLeaves[0] || null,
            canUseLeave: approvedLeaves.length > 0,
            isInBuilding: attendance.rows.length > 0 && !attendance.rows[0].dateout && !attendance.rows[0].exittime
        });
    } catch (e) {
        // console.error("❌ Error fetching employee leave status:", e);
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

        // Send WhatsApp notification for new leave permission
        try {
            const whatsappMessage = `🔔 New Leave Permission Request\n\n` +
                `Name: ${name}\n` +
                `Department: ${department}\n` +
                `Role: ${role}\n` +
                `Date: ${new Date(date).toLocaleDateString('id-ID')}\n` +
                `Exit Time: ${exitTime}\n` +
                `Return Time: ${returnTime || 'Not specified'}\n` +
                `Reason: ${reason}\n` +
                `Status: ${approval}\n\n` +
                `Submitted at: ${new Date(submittedAt).toLocaleString('id-ID')}`;

            // Call the WhatsApp broadcast function
            const whatsappResponse = await fetch('http://localhost:3000/api/whatsapp/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: whatsappMessage
                })
            });

            if (whatsappResponse.ok) {
                //console.log('✅ WhatsApp notification sent successfully for leave permission:', inserted.id);
            } else {
                console.error('❌ Failed to send WhatsApp notification:', await whatsappResponse.text());
            }
        } catch (whatsappError) {
            console.error('❌ Error sending WhatsApp notification:', whatsappError);
            // Don't fail the main request if WhatsApp fails
        }

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

        const existsResult = await db.query('SELECT id FROM leave_permission WHERE id = $1', [id]);
        if (existsResult.rows.length === 0) {
            return res.status(404).json({ message: 'Leave permission not found' });
        }

        const updateQuery = `UPDATE leave_permission SET ${setClauses.join(', ')} WHERE id = $${values.length}`;
        await db.query(updateQuery, values);

        const result = await db.query('SELECT * FROM leave_permission WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Leave permission not found after update' });
        }
        const updatedRecord = result.rows[0];
        broadcast({
            type: 'leave_permission',
            action: 'update',
            data: updatedRecord
        });

        // Send WhatsApp notification for leave permission updates
        try {
            // Check if status fields were updated
            const statusFields = ['approval', 'statusfromhr', 'statusfromdept', 'statusfromdirector'];
            const statusUpdated = Object.keys(updates).some(key => statusFields.includes(key.toLowerCase()));

            if (statusUpdated) {
                const whatsappMessage = `🔄 Leave Permission Status Updated\n\n` +
                    `Name: ${updatedRecord.name}\n` +
                    `Department: ${updatedRecord.department}\n` +
                    `Date: ${new Date(updatedRecord.date).toLocaleDateString('id-ID')}\n` +
                    `Overall Status: ${updatedRecord.approval}\n` +
                    `Department Status: ${updatedRecord.statusfromdept || 'Pending'}\n` +
                    `HR Status: ${updatedRecord.statusfromhr || 'Pending'}\n` +
                    `Director Status: ${updatedRecord.statusfromdirector || 'Pending'}\n\n` +
                    `Updated at: ${new Date().toLocaleString('id-ID')}`;

                const whatsappResponse = await fetch('http://192.168.4.108:3000/api/whatsapp/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: whatsappMessage
                    })
                });

                if (whatsappResponse.ok) {
                    //console.log('✅ WhatsApp notification sent for leave permission update:', updatedRecord.id);
                } else {
                    console.error('❌ Failed to send WhatsApp update notification:', await whatsappResponse.text());
                }
            }
        } catch (whatsappError) {
            console.error('❌ Error sending WhatsApp update notification:', whatsappError);
        }

        res.json(updatedRecord);
    } catch (e) {
        console.error('❌ Error updating leave permission:', e);
        res.status(500).json({ message: 'Internal Server Error', error: e.message });
    }
});

app.get('/leave-permission', async (req, res) => {
    try {
        // const result = await db.query('SELECT * FROM leave_permission ORDER BY submittedat DESC');
        const result = await db.query(`
            SELECT 
                lp.*,
                dept_approval.approved_by as department_approver,
                dept_approval.approved_at as department_approved_at,
                hr_approval.approved_by as hr_approver,
                hr_approval.approved_at as hr_approved_at
            FROM leave_permission lp
            LEFT JOIN approval_tracking dept_approval ON lp.id = dept_approval.leave_permission_id AND dept_approval.approval_level = 1
            LEFT JOIN approval_tracking hr_approval ON lp.id = hr_approval.leave_permission_id AND hr_approval.approval_level = 2
            `);

        const recordsWithActualTimes = result.rows.filter(row =>
            row.actual_exittime || row.actual_returntime
        );
        if (recordsWithActualTimes.length > 0) {
            //console.log("✅ Records with actual times:", recordsWithActualTimes.map(row => ({
            //     id: row.id,
            //     uid: row.uid,
            //     actual_exittime: row.actual_exittime,
            //     actual_returntime: row.actual_returntime,
            //     statusfromhr: row.statusfromhr,
            //     statusfromdept: row.statusfromdept
            // })));
        }
        res.json(result.rows);
    } catch (e) {
        console.error("❌ Error fetching leave permissions:", e);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.use("/api/whatsapp", broadcastTwillio);

//-------------------------------------------------------//
//-------------------------------------------------------//
//-------------------------------------------------------//
// !! ROUTING-BASED APPROVAL API ENDPOINTS
//-------------------------------------------------------//


// app.get('/leavepermission/:nameApproval', async (req, res) => {
//     try{
//         const {}
//     }
//     catch (e){

//     }
// })

app.get('/routing/:department/:role', async (req, res) => {
    try {
        const { department, role } = req.params;
        const { employeeName } = req.query;

        const routing = await db.query(`
            SELECT TOP 1 * FROM master_routing 
            WHERE department = $1 
              AND role = $2
              AND (employee_name = $3 OR employee_name IS NULL)
              AND is_active = 1
            ORDER BY 
              CASE WHEN employee_name IS NOT NULL THEN 0 ELSE 1 END,  -- employee-specific first
              created_at DESC
        `, [department, role, employeeName || null]);
        if (routing.rows.length === 0) {
            return res.status(404).json({
                message: 'No routing configuration found',
                department,
                role,
                employeeName
            });
        }
        res.json(routing.rows[0]);
    } catch (e) {
        console.error("❌ Error fetching routing:", e);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.get('/leave-permission/pending-for/:approverName', async (req, res) => {
    try {
        const { approverName } = req.params;
        //console.log('🔍 Fetching pending requests for approver:', approverName);

        // Step 1: Get all routing data using SQL Server syntax (no parameters)
        const allApprovers = await db.query(`
            SELECT 
                id,
                department,
                employee_name,
                role,
                approval_level1_name,
                approval_level1_role,
                approval_level2_name,
                approval_level2_role,
                is_active
            FROM master_routing 
            WHERE is_active = 1
        `);
        //console.log('📋 All approvers found:', allApprovers.rows?.length, 'records');

        // Step 2: Find the approver using JavaScript string comparison (avoiding SQL parameter issues)
        const foundApprovers = allApprovers.rows?.filter(row => {
            return row.approval_level1_name === approverName || row.approval_level2_name === approverName;
        });

        if (!foundApprovers || foundApprovers.length === 0) {
            //console.log('❌ Approver not found in master_routing table');
            return res.status(404).json({
                success: false,
                message: 'Approver not found in routing table',
                debug: {
                    approverName: approverName,
                    availableApprovers: allApprovers.rows?.map(r => ({
                        level1: r.approval_level1_name,
                        level2: r.approval_level2_name
                    }))
                }
            });
        }

        // Step 3: Get all pending leave permissions with proper routing priority
        // Use a more sophisticated JOIN that prioritizes employee-specific routing over generic routing
        const allLeaves = await db.query(`
            SELECT 
                lp.id,
                lp.name,
                lp.licenseplate,
                lp.department,
                lp.role,
                lp.statusfromhr,
                lp.statusfromdept,
                lp.statusfromdirector,
                lp.approval,
                lp.reason,
                lp.date,
                lp.exittime,
                lp.returntime,
                lp.submittedat,
                routing.approval_level1_name,
                routing.approval_level1_role,
                routing.approval_level2_name,
                routing.approval_level2_role,
                routing.employee_name as routing_employee_name
            FROM leave_permission lp
            CROSS APPLY (
                SELECT TOP 1 
                    mr.approval_level1_name,
                    mr.approval_level1_role,
                    mr.approval_level2_name,
                    mr.approval_level2_role,
                    mr.employee_name
                FROM master_routing mr 
                WHERE mr.department = lp.department 
                  AND mr.role = lp.role
                  AND mr.is_active = 1
                  AND (mr.employee_name = lp.name OR mr.employee_name IS NULL)
                ORDER BY 
                  CASE WHEN mr.employee_name IS NOT NULL THEN 0 ELSE 1 END,  -- Employee-specific first
                  mr.created_at DESC
            ) routing
            WHERE lp.approval = 'pending'
        `);

        //console.log('📋 All pending leaves with routing info:');
        allLeaves.rows?.forEach(leave => {
            //console.log(`   Leave ${leave.id}: ${leave.name} (${leave.department}/${leave.role})`);
            //console.log(`     Level 1: ${leave.approval_level1_name} (${leave.approval_level1_role})`);
            //console.log(`     Level 2: ${leave.approval_level2_name} (${leave.approval_level2_role})`);
            //console.log(`     Routing Type: ${leave.routing_employee_name ? 'Employee-Specific' : 'Department-Generic'}`);
            //console.log(`     Status: dept=${leave.statusfromdept}, hr=${leave.statusfromhr}`);
        });

        // Also check for any pending requests that don't have routing
        const pendingWithoutRouting = await db.query(`
            SELECT lp.id, lp.name, lp.department, lp.role
            FROM leave_permission lp
            LEFT JOIN master_routing mr ON (lp.department = mr.department AND lp.role = mr.role AND mr.is_active = 1)
            WHERE lp.approval = 'pending' AND mr.id IS NULL
        `);

        if (pendingWithoutRouting.rows?.length > 0) {
            //console.log('⚠️ Pending requests WITHOUT routing configuration:');
            pendingWithoutRouting.rows?.forEach(leave => {
                //console.log(`   Leave ${leave.id}: ${leave.name} (${leave.department}/${leave.role}) - NO ROUTING FOUND`);
            });
        }

        // Step 4: Filter leave requests that need approval from this specific approver
        const pendingForApprover = allLeaves.rows?.filter(leave => {
            // Check if this approver is level 1 and level 1 approval is pending
            if (leave.approval_level1_name === approverName) {
                if (leave.approval_level1_role === 'Head Department') {
                    return leave.statusfromdept === null || leave.statusfromdept === 'pending';
                } else if (leave.approval_level1_role === 'HR') {
                    return leave.statusfromhr === null || leave.statusfromhr === 'pending';
                } else if (leave.approval_level1_role === 'DIRECTOR') {
                    return leave.statusfromdirector === null || leave.statusfromdirector === 'pending';
                }
            }

            // Check if this approver is level 2 and level 1 is approved but level 2 is pending
            if (leave.approval_level2_name === approverName) {
                // First check if level 1 is approved
                let level1Approved = false;
                if (leave.approval_level1_role === 'Head Department') {
                    level1Approved = leave.statusfromdept === 'approved';
                } else if (leave.approval_level1_role === 'HR') {
                    level1Approved = leave.statusfromhr === 'approved';
                } else if (leave.approval_level1_role === 'DIRECTOR') {
                    level1Approved = leave.statusfromdirector === 'approved';
                }

                // If level 1 is approved, check if level 2 is pending
                if (level1Approved) {
                    if (leave.approval_level2_role === 'Head Department') {
                        return leave.statusfromdept === null || leave.statusfromdept === 'pending';
                    } else if (leave.approval_level2_role === 'HR') {
                        return leave.statusfromhr === null || leave.statusfromhr === 'pending';
                    } else if (leave.approval_level2_role === 'DIRECTOR') {
                        return leave.statusfromdirector === null || leave.statusfromdirector === 'pending';
                    }
                }
            }

            return false;
        });

        //console.log('📋 Found', pendingForApprover?.length || 0, 'pending requests for', approverName);

        res.json({
            success: true,
            approver: approverName,
            pendingRequests: pendingForApprover || [],
            count: pendingForApprover?.length || 0,
            debug: {
                routingData: foundApprovers,
                totalLeaves: allLeaves.rows?.length || 0,
                filteredCount: pendingForApprover?.length || 0
            }
        });

    } catch (e) {
        console.error("❌ Error fetching pending requests:", e);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: e.message,
            approver: req.params.approverName
        });
    }
});
app.put('/leave-permission/:id/routing-approval', async (req, res) => {
    try {
        const { id } = req.params;
        const { approverName, action, notes } = req.body; // action: 'approved' | 'rejected'
        if (!['approved', 'rejected'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action. Must be "approved" or "rejected"' });
        }

        const leaveData = await db.query(`
            SELECT TOP 1
                lp.*,
                mr.approval_level1_name,
                mr.approval_level1_role,
                mr.approval_level2_name,
                mr.approval_level2_role,
                mr.approval_level3_name,
                mr.approval_level3_role
            FROM leave_permission lp
            JOIN master_routing mr ON (
                lp.department = mr.department 
                AND lp.role = mr.role
                AND (mr.employee_name IS NULL OR mr.employee_name = lp.name)
                AND mr.is_active = 1
            )
            WHERE lp.id = $1 
            ORDER BY CASE WHEN mr.employee_name IS NOT NULL THEN 0 ELSE 1 END, mr.created_at DESC
        `, [id]);
        if (leaveData.rows.length === 0) {
            return res.status(404).json({ message: 'Leave permission or routing not found' });
        }
        const leave = leaveData.rows[0];

        // Debug logging
        //console.log('🔍 Approval Debug Info:');
        //console.log('   Approver Name:', approverName);
        //console.log('   Leave ID:', id);
        //console.log('   Leave Department:', leave.department);
        //console.log('   Leave Role:', leave.role);
        //console.log('   Level 1:', leave.approval_level1_name, '(', leave.approval_level1_role, ')');
        //console.log('   Level 2:', leave.approval_level2_name, '(', leave.approval_level2_role, ')');
        //console.log('   Level 3:', leave.approval_level3_name, '(', leave.approval_level3_role, ')');

        let updateField = null;
        let approverLevel = 0;

        if (leave.approval_level1_name === approverName) {
            approverLevel = 1;
            if (leave.approval_level1_role === 'Head Department') updateField = 'statusfromdept';
            else if (leave.approval_level1_role === 'HR') updateField = 'statusfromhr';
            else if (leave.approval_level1_role === 'DIRECTOR') updateField = 'statusfromdirector';
        } else if (leave.approval_level2_name === approverName) {
            approverLevel = 2;
            if (leave.approval_level2_role === 'Head Department') updateField = 'statusfromdept';
            else if (leave.approval_level2_role === 'HR') updateField = 'statusfromhr';
            else if (leave.approval_level2_role === 'DIRECTOR') updateField = 'statusfromdirector';
        } else if (leave.approval_level3_name === approverName) {
            approverLevel = 3;
            if (leave.approval_level3_role === 'Head Department') updateField = 'statusfromdept';
            else if (leave.approval_level3_role === 'HR') updateField = 'statusfromhr';
            else if (leave.approval_level3_role === 'DIRECTOR') updateField = 'statusfromdirector';
        }
        if (!updateField) {
            return res.status(403).json({
                message: 'Approver not authorized for this leave request',
                approverName,
                leaveId: id
            });
        }

        await db.query(`UPDATE leave_permission SET ${updateField} = $1 WHERE id = $2`, [action, id]);

        const updatedLeave = await db.query('SELECT * FROM leave_permission WHERE id = $1', [id]);
        const updated = updatedLeave.rows[0];
        let overallApproval = 'pending';
        if (updated.statusfromdept === 'rejected' || updated.statusfromhr === 'rejected' || updated.statusfromdirector === 'rejected') {
            overallApproval = 'rejected';
        } else {

            const requiredApprovals = [];
            if (leave.approval_level1_role === 'HEAD DEPARTMENT') requiredApprovals.push(updated.statusfromdept);
            else if (leave.approval_level1_role === 'HR') requiredApprovals.push(updated.statusfromhr);
            else if (leave.approval_level1_role === 'DIRECTOR') requiredApprovals.push(updated.statusfromdirector);
            if (leave.approval_level2_name) {
                if (leave.approval_level2_role === 'HEAD DEPARTMENT') requiredApprovals.push(updated.statusfromdept);
                else if (leave.approval_level2_role === 'HR') requiredApprovals.push(updated.statusfromhr);
                else if (leave.approval_level2_role === 'DIRECTOR') requiredApprovals.push(updated.statusfromdirector);
            }
            if (leave.approval_level3_name) {
                if (leave.approval_level3_role === 'HEAD DEPARTMENT') requiredApprovals.push(updated.statusfromdept);
                else if (leave.approval_level3_role === 'HR') requiredApprovals.push(updated.statusfromhr);
                else if (leave.approval_level3_role === 'DIRECTOR') requiredApprovals.push(updated.statusfromdirector);
            }
            if (requiredApprovals.every(status => status === 'approved')) {
                overallApproval = 'approved';
            }
        }

        await db.query('UPDATE leave_permission SET approval = $1 WHERE id = $2', [overallApproval, id]);

        await db.query(`
            INSERT INTO approval_tracking 
            (leave_permission_id, approval_level, approver_name, approver_role, status, approved_at, approved_by, notes)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7)
        `, [id, approverLevel, approverName, leave[`approval_level${approverLevel}_role`], action, approverName, notes || null]);

        const finalResult = await db.query('SELECT * FROM leave_permission WHERE id = $1', [id]);

        broadcast({
            type: 'leave_permission',
            action: 'routing_approval',
            data: finalResult.rows[0],
            approver: approverName,
            approverLevel,
            approvalAction: action
        });
        res.json({
            success: true,
            leavePermission: finalResult.rows[0],
            approver: approverName,
            approverLevel,
            fieldUpdated: updateField,
            overallApproval
        });
    } catch (e) {
        console.error("❌ Error processing routing approval:", e);
        res.status(500).json({ message: 'Internal Server Error', error: e.message });
    }
});
// !! END OF ROUTING-BASED APPROVAL API

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

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const result = await db.query(
            'INSERT INTO userlogin (name, username, password, department, role) VALUES ($1, $2, $3, $4, $5); SELECT id, name, username, department, role FROM userlogin WHERE id = SCOPE_IDENTITY()',
            [name, username, hashedPassword, department, role]
        );
        //
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
        const query = `
            SELECT nosj, tanggal 
            FROM suratjalan 
            ORDER BY tanggal DESC
        `;
        const results = await db.query(query);
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

        const pool = await db.getPool();
        const request = pool.request();

        let query = `
            SELECT 
                t.*,
                tt.arrivaltime, tt.waitingfortimbang, tt.starttimbang, tt.finishtimbang, tt.totalprocesstimbang,
                tt.runtohpc, tt.waitingforarrivalhpc, tt.entryhpc, tt.totalwaitingarrival,
                tt.startloadingtime, tt.finishloadingtime, tt.totalprocessloadingtime, tt.actualwaitloadingtime,
                tp.driver_photo, tp.sim_photo, tp.stnk_photo
            FROM trucks t
            LEFT JOIN truck_times tt ON t.id = tt.truck_id
            LEFT JOIN truck_photos tp ON t.id = tp.truck_id
            WHERE 1=1
        `;

        if (searchTerm) {
            query += ` AND (
                t.platenumber LIKE '%' + @searchTerm + '%' OR 
                t.driver LIKE '%' + @searchTerm + '%' OR 
                t.supplier LIKE '%' + @searchTerm + '%' OR 
                t.goods LIKE '%' + @searchTerm + '%'
            )`;
            request.input('searchTerm', db.sql.VarChar, searchTerm);
        }

        if (status && status !== 'all') {
            query += ` AND t.status = @status`;
            request.input('status', db.sql.VarChar, status);
        }

        if (type && type !== 'all') {
            query += ` AND t.type = @type`;
            request.input('type', db.sql.VarChar, type);
        }

        if (dateFrom) {
            query += ` AND t.date >= @dateFrom`;
            request.input('dateFrom', db.sql.Date, dateFrom);
        }
        if (dateTo) {
            query += ` AND t.date <= @dateTo`;
            request.input('dateTo', db.sql.Date, dateTo);
        }

        query += ` ORDER BY t.date DESC, tt.arrivaltime DESC`;
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error('💥 Error fetching truck history (3-table):', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});


app.post('/api/trucks', async (req, res) => {
    try {
        const {

            platenumber, noticket, department, nikdriver, tlpdriver, nosj, tglsj,
            driver, supplier, eta, status, type, operation, goods,
            descin, descout, statustruck, armada, kelengkapan, jenismobil, date, exittime,

            arrivaltime, waitingfortimbang, starttimbang, finishtimbang, totalprocesstimbang,
            runtohpc, waitingforarrivalhpc, entryhpc, totalwaitingarrival,
            startloadingtime, finishloadingtime, totalprocessloadingtime, actualwaitloadingtime,

            driver_photo, sim_photo, stnk_photo
        } = req.body;
        //console.log('=== EXTRACTED VALUES ===', {
        //     platenumber, noticket, department, nikdriver, tlpdriver, nosj, tglsj,
        //     driver, supplier, eta, status, type, operation, goods,
        //     descin, descout, statustruck, armada, kelengkapan, jenismobil, date
        // });

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

        const pool = await db.getPool();
        const transaction = pool.transaction();
        await transaction.begin();
        try {

            const mainRequest = transaction.request();
            mainRequest.input('platenumber', db.sql.VarChar, platenumber);
            mainRequest.input('noticket', db.sql.VarChar, noticket);
            mainRequest.input('department', db.sql.VarChar, department);
            mainRequest.input('nikdriver', db.sql.VarChar, nikdriver);
            mainRequest.input('tlpdriver', db.sql.VarChar, tlpdriver);
            mainRequest.input('nosj', db.sql.VarChar, nosj);
            mainRequest.input('tglsj', db.sql.Date, tglsj);
            mainRequest.input('driver', db.sql.VarChar, driver);
            mainRequest.input('supplier', db.sql.VarChar, supplier);
            mainRequest.input('eta', db.sql.VarChar, eta);
            mainRequest.input('status', db.sql.VarChar, status || 'waiting');
            mainRequest.input('type', db.sql.VarChar, type);
            mainRequest.input('operation', db.sql.VarChar, operation);
            mainRequest.input('goods', db.sql.VarChar, goods);
            mainRequest.input('descin', db.sql.VarChar, descin);
            mainRequest.input('descout', db.sql.VarChar, descout);
            mainRequest.input('statustruck', db.sql.VarChar, statustruck);
            mainRequest.input('armada', db.sql.VarChar, armada);
            mainRequest.input('kelengkapan', db.sql.VarChar, kelengkapan);
            mainRequest.input('jenismobil', db.sql.VarChar, jenismobil);
            mainRequest.input('date', db.sql.Date, date);
            mainRequest.input('exittime', db.sql.DateTime2, exittime);
            const mainQuery = `
                INSERT INTO trucks (
                    platenumber, noticket, department, nikdriver, tlpdriver, nosj, tglsj,
                    driver, supplier, eta, status, type, operation, goods,
                    descin, descout, statustruck, armada, kelengkapan, jenismobil, date, exittime
                ) OUTPUT INSERTED.id
                VALUES (
                    @platenumber, @noticket, @department, @nikdriver, @tlpdriver, @nosj, @tglsj,
                    @driver, @supplier, @eta, @status, @type, @operation, @goods,
                    @descin, @descout, @statustruck, @armada, @kelengkapan, @jenismobil, @date, @exittime
                )
            `;
            const mainResult = await mainRequest.query(mainQuery);
            const truckId = mainResult.recordset[0].id;

            const timesRequest = transaction.request();
            timesRequest.input('truck_id', db.sql.Int, truckId);
            timesRequest.input('arrivaltime', db.sql.DateTime2, arrivaltime);
            timesRequest.input('waitingfortimbang', db.sql.Time, waitingfortimbang);
            timesRequest.input('starttimbang', db.sql.Time, starttimbang);
            timesRequest.input('finishtimbang', db.sql.Time, finishtimbang);
            timesRequest.input('totalprocesstimbang', db.sql.Time, totalprocesstimbang);
            timesRequest.input('runtohpc', db.sql.Time, runtohpc);
            timesRequest.input('waitingforarrivalhpc', db.sql.Time, waitingforarrivalhpc);
            timesRequest.input('entryhpc', db.sql.Time, entryhpc);
            timesRequest.input('totalwaitingarrival', db.sql.Time, totalwaitingarrival);
            timesRequest.input('startloadingtime', db.sql.Time, startloadingtime);
            timesRequest.input('finishloadingtime', db.sql.Time, finishloadingtime);
            timesRequest.input('totalprocessloadingtime', db.sql.Time, totalprocessloadingtime);
            timesRequest.input('actualwaitloadingtime', db.sql.Time, actualwaitloadingtime);
            const timesQuery = `
                INSERT INTO truck_times (
                    truck_id, arrivaltime, waitingfortimbang, starttimbang, finishtimbang, totalprocesstimbang,
                    runtohpc, waitingforarrivalhpc, entryhpc, totalwaitingarrival,
                    startloadingtime, finishloadingtime, totalprocessloadingtime, actualwaitloadingtime
                ) VALUES (
                    @truck_id, @arrivaltime, @waitingfortimbang, @starttimbang, @finishtimbang, @totalprocesstimbang,
                    @runtohpc, @waitingforarrivalhpc, @entryhpc, @totalwaitingarrival,
                    @startloadingtime, @finishloadingtime, @totalprocessloadingtime, @actualwaitloadingtime
                )
            `;
            await timesRequest.query(timesQuery);

            const photosRequest = transaction.request();
            photosRequest.input('truck_id', db.sql.Int, truckId);
            photosRequest.input('driver_photo', db.sql.VarChar, savedImages.driver_photo);
            photosRequest.input('sim_photo', db.sql.VarChar, savedImages.sim_photo);
            photosRequest.input('stnk_photo', db.sql.VarChar, savedImages.stnk_photo);
            const photosQuery = `
                INSERT INTO truck_photos (truck_id, driver_photo, sim_photo, stnk_photo)
                VALUES (@truck_id, @driver_photo, @sim_photo, @stnk_photo)
            `;
            await photosRequest.query(photosQuery);

            const selectRequest = transaction.request();
            selectRequest.input('id', db.sql.Int, truckId);
            const selectQuery = `
                SELECT 
                    t.*,
                    tt.arrivaltime, tt.waitingfortimbang, tt.starttimbang, tt.finishtimbang, tt.totalprocesstimbang,
                    tt.runtohpc, tt.waitingforarrivalhpc, tt.entryhpc, tt.totalwaitingarrival,
                    tt.startloadingtime, tt.finishloadingtime, tt.totalprocessloadingtime, tt.actualwaitloadingtime,
                    tp.driver_photo, tp.sim_photo, tp.stnk_photo
                FROM trucks t
                LEFT JOIN truck_times tt ON t.id = tt.truck_id
                LEFT JOIN truck_photos tp ON t.id = tp.truck_id
                WHERE t.id = @id
            `;
            const selectResult = await selectRequest.query(selectQuery);
            const newTruck = selectResult.recordset[0];
            await transaction.commit();
            res.status(201).json(newTruck);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error creating truck (3-table):', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});


app.put('/api/trucks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Debug: Log the update data
        console.log('🔍 Update data received:', JSON.stringify(updateData, null, 2));

        const imageFields = ['driver_photo', 'sim_photo', 'stnk_photo'];
        const savedImages = {};
        for (const field of imageFields) {
            if (updateData[field] && updateData[field].startsWith('data:image')) {
                const filename = `${field.replace('_photo', '')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
                savedImages[field] = await saveImageToFile(updateData[field], filename);
                updateData[field] = savedImages[field];
            }
        }

        const pool = await db.getPool();
        const transaction = pool.transaction();
        await transaction.begin();
        try {

            const mainTableFields = [
                'platenumber', 'noticket', 'department', 'nikdriver', 'tlpdriver', 'nosj', 'tglsj',
                'driver', 'supplier', 'eta', 'status', 'type', 'operation', 'goods',
                'descin', 'descout', 'statustruck', 'armada', 'kelengkapan', 'jenismobil', 'date', 'exittime'
            ];
            const timeTableFields = [
                'arrivaltime', 'waitingfortimbang', 'starttimbang', 'finishtimbang', 'totalprocesstimbang',
                'runtohpc', 'waitingforarrivalhpc', 'entryhpc', 'totalwaitingarrival',
                'startloadingtime', 'finishloadingtime', 'totalprocessloadingtime', 'actualwaitloadingtime'
            ];
            const photoTableFields = ['driver_photo', 'sim_photo', 'stnk_photo'];

            const mainUpdateFields = mainTableFields.filter(field => updateData[field] !== undefined);
            if (mainUpdateFields.length > 0) {
                const mainRequest = transaction.request();
                mainRequest.input('id', db.sql.Int, id);
                const setClause = mainUpdateFields.map(field => {
                    mainRequest.input(field, db.sql.VarChar, updateData[field]);
                    return `${field} = @${field}`;
                }).join(', ');
                const mainQuery = `UPDATE trucks SET ${setClause} WHERE id = @id`;
                await mainRequest.query(mainQuery);
            }

            const timeUpdateFields = timeTableFields.filter(field => updateData[field] !== undefined);
            if (timeUpdateFields.length > 0) {
                // First check if truck_times record exists
                const checkRequest = pool.request();
                checkRequest.input('truck_id', db.sql.Int, id);
                const checkResult = await checkRequest.query('SELECT * FROM truck_times WHERE truck_id = @truck_id');
                
                if (checkResult.recordset.length === 0) {
                    // Insert new record if it doesn't exist
                    const insertRequest = pool.request();
                    insertRequest.input('truck_id', db.sql.Int, id);
                    await insertRequest.query('INSERT INTO truck_times (truck_id) VALUES (@truck_id)');
                    console.log(`✅ Created new truck_times record for truck_id: ${id}`);
                }
                
                const timeRequest = transaction.request();
                timeRequest.input('truck_id', db.sql.Int, id);
                
                // Helper function to validate and format time
                const validateAndFormatTime = (timeValue, fieldName) => {
                    if (!timeValue) return null;
                    
                    let timeString = String(timeValue).trim();
                    console.log(`🕐 Processing time field '${fieldName}': ${timeString}`);
                    
                    // Handle various time formats
                    if (timeString.match(/^\d{1,2}:\d{1,2}:\d{1,2}$/)) {
                        // Format: H:mm:ss or HH:mm:ss
                        const parts = timeString.split(':');
                        const hours = parts[0].padStart(2, '0');
                        const minutes = parts[1].padStart(2, '0');
                        const seconds = parts[2].padStart(2, '0');
                        
                        // Validate ranges
                        if (parseInt(hours) > 23 || parseInt(minutes) > 59 || parseInt(seconds) > 59) {
                            throw new Error(`Invalid time values for '${fieldName}': ${timeString}`);
                        }
                        
                        return `${hours}:${minutes}:${seconds}`;
                    } else if (timeString.match(/^\d{1,2}:\d{1,2}$/)) {
                        // Format: H:mm or HH:mm - add seconds
                        const parts = timeString.split(':');
                        const hours = parts[0].padStart(2, '0');
                        const minutes = parts[1].padStart(2, '0');
                        
                        if (parseInt(hours) > 23 || parseInt(minutes) > 59) {
                            throw new Error(`Invalid time values for '${fieldName}': ${timeString}`);
                        }
                        
                        return `${hours}:${minutes}:00`;
                    } else {
                        throw new Error(`Invalid time format for '${fieldName}': ${timeString}. Expected HH:mm:ss or HH:mm`);
                    }
                };
                
                const timeSetClause = timeUpdateFields.map(field => {
                    try {
                        if (field === 'arrivaltime') {
                            timeRequest.input(field, db.sql.DateTime2, updateData[field]);
                        } else {
                            const formattedTime = validateAndFormatTime(updateData[field], field);
                            console.log(`✅ Formatted time for '${field}': ${formattedTime}`);
                            
                            // Try using VarChar instead of Time type to avoid tedious validation issues
                            timeRequest.input(field, db.sql.VarChar(8), formattedTime);
                        }
                        return `${field} = @${field}`;
                    } catch (error) {
                        console.error(`❌ Error processing field '${field}':`, error);
                        throw new Error(`Validation failed for parameter '${field}'. ${error.message}`);
                    }
                }).join(', ');
                
                const timeQuery = `UPDATE truck_times SET ${timeSetClause} WHERE truck_id = @truck_id`;
                console.log(`🗃️ Executing time query: ${timeQuery}`);
                await timeRequest.query(timeQuery);
            }

            const photoUpdateFields = photoTableFields.filter(field => updateData[field] !== undefined);
            if (photoUpdateFields.length > 0) {
                const photoRequest = transaction.request();
                photoRequest.input('truck_id', db.sql.Int, id);
                const photoSetClause = photoUpdateFields.map(field => {
                    photoRequest.input(field, db.sql.VarChar, updateData[field]);
                    return `${field} = @${field}`;
                }).join(', ');
                const photoQuery = `UPDATE truck_photos SET ${photoSetClause} WHERE truck_id = @truck_id`;
                await photoRequest.query(photoQuery);
            }

            const selectRequest = transaction.request();
            selectRequest.input('id', db.sql.Int, id);
            const selectQuery = `
                SELECT 
                    t.*,
                    tt.arrivaltime, tt.waitingfortimbang, tt.starttimbang, tt.finishtimbang, tt.totalprocesstimbang,
                    tt.runtohpc, tt.waitingforarrivalhpc, tt.entryhpc, tt.totalwaitingarrival,
                    tt.startloadingtime, tt.finishloadingtime, tt.totalprocessloadingtime, tt.actualwaitloadingtime,
                    tp.driver_photo, tp.sim_photo, tp.stnk_photo
                FROM trucks t
                LEFT JOIN truck_times tt ON t.id = tt.truck_id
                LEFT JOIN truck_photos tp ON t.id = tp.truck_id
                WHERE t.id = @id
            `;
            const selectResult = await selectRequest.query(selectQuery);
            if (selectResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Truck not found' });
            }
            const updatedTruck = selectResult.recordset[0];
            await transaction.commit();
            res.json(updatedTruck);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
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


app.get('/api/trucks', async (req, res) => {
    try {
        const { searchTerm, status, type, operation, dateFrom, dateTo } = req.query;

        const pool = await db.getPool();
        const request = pool.request();

        let query = `
            SELECT 
                t.*,
                tt.arrivaltime, tt.waitingfortimbang, tt.starttimbang, tt.finishtimbang, tt.totalprocesstimbang,
                tt.runtohpc, tt.waitingforarrivalhpc, tt.entryhpc, tt.totalwaitingarrival,
                tt.startloadingtime, tt.finishloadingtime, tt.totalprocessloadingtime, tt.actualwaitloadingtime,
                tp.driver_photo, tp.sim_photo, tp.stnk_photo
            FROM trucks t
            LEFT JOIN truck_times tt ON t.id = tt.truck_id
            LEFT JOIN truck_photos tp ON t.id = tp.truck_id
            WHERE 1=1
        `;
        let paramIndex = 1;

        if (searchTerm) {
            query += ` AND (
                t.platenumber LIKE '%' + @searchTerm + '%' OR 
                t.driver LIKE '%' + @searchTerm + '%' OR 
                t.supplier LIKE '%' + @searchTerm + '%' OR 
                t.goods LIKE '%' + @searchTerm + '%'
            )`;
            request.input('searchTerm', db.sql.VarChar, searchTerm);
            paramIndex++;
        }

        if (status) {
            query += ` AND t.status = @status`;
            request.input('status', db.sql.VarChar, status);
            paramIndex++;
        }

        if (type) {
            query += ` AND t.type = @type`;
            request.input('type', db.sql.VarChar, type);
            paramIndex++;
        }

        if (operation) {
            query += ` AND t.operation = @operation`;
            request.input('operation', db.sql.VarChar, operation);
            paramIndex++;
        }

        if (dateFrom) {
            query += ` AND t.date >= @dateFrom`;
            request.input('dateFrom', db.sql.Date, dateFrom);
            paramIndex++;
        }
        if (dateTo) {
            query += ` AND t.date <= @dateTo`;
            request.input('dateTo', db.sql.Date, dateTo);
            paramIndex++;
        }

        query += ` ORDER BY t.id DESC`;
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error('💥 Error fetching trucks (3-table):', error);
        console.error('💥 Error details:', error.message);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});


app.delete('/api/trucks/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await db.getPool();
        const transaction = pool.transaction();
        await transaction.begin();
        try {

            const selectRequest = transaction.request();
            selectRequest.input('id', db.sql.Int, id);
            const selectQuery = `
                SELECT 
                    t.*,
                    tt.arrivaltime, tt.waitingfortimbang, tt.starttimbang, tt.finishtimbang, tt.totalprocesstimbang,
                    tt.runtohpc, tt.waitingforarrivalhpc, tt.entryhpc, tt.totalwaitingarrival,
                    tt.startloadingtime, tt.finishloadingtime, tt.totalprocessloadingtime, tt.actualwaitloadingtime,
                    tp.driver_photo, tp.sim_photo, tp.stnk_photo
                FROM trucks t
                LEFT JOIN truck_times tt ON t.id = tt.truck_id
                LEFT JOIN truck_photos tp ON t.id = tp.truck_id
                WHERE t.id = @id
            `;
            const selectResult = await selectRequest.query(selectQuery);
            if (selectResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Truck not found' });
            }
            const truckData = selectResult.recordset[0];

            const deleteRequest = transaction.request();
            deleteRequest.input('id', db.sql.Int, id);
            const deleteQuery = 'DELETE FROM trucks WHERE id = @id';
            await deleteRequest.query(deleteQuery);
            await transaction.commit();
            res.json({
                message: 'Truck deleted successfully',
                truck: truckData
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('💥 Error deleting truck (3-table):', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});


app.post('/api/trucks/upload-photo', async (req, res) => {
    try {
        const { photoData, photoType, plateNumber } = req.body;
        if (!photoData || !photoType || !plateNumber) {
            return res.status(400).json({
                success: false,
                message: 'Photo data, type, and plate number are required'
            });
        }

        const trucksUploadDir = path.join(__dirname, 'uploads', 'trucks');
        if (!fs.existsSync(trucksUploadDir)) {
            fs.mkdirSync(trucksUploadDir, { recursive: true });
        }

        const timestamp = Date.now();
        const sanitizedPlate = plateNumber.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${sanitizedPlate}-${timestamp}-${photoType}.jpg`;
        const filePath = path.join(trucksUploadDir, fileName);

        const base64Data = photoData.replace(/^data:image\/[a-z]+;base64,/, '');

        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

        const relativePath = `trucks/${fileName}`;
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
// !! DEBUG ENDPOINTS FOR ROUTING SYSTEM
app.get('/debug/simple', async (req, res) => {
    try {

        const routing = await db.query(`SELECT * FROM master_routing WHERE department = 'IT'`);
        res.json({
            message: 'Simple debug test',
            routing: routing.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/debug/test-routing', async (req, res) => {
    try {

        const routingData = await db.query('SELECT * FROM master_routing WHERE department = $1', ['IT']);

        const leaveData = await db.query(`
            SELECT * FROM leave_permission 
            WHERE name LIKE '%MARCELLO%' 
            AND CONVERT(DATE, date) = CONVERT(DATE, GETDATE())
        `);
        res.json({
            routing: routingData.rows,
            leaves: leaveData.rows,
            debug: 'Test routing configuration'
        });
    } catch (error) {
        console.error('Debug routing error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/debug/leave-approval/:licenseplate', async (req, res) => {
    try {
        const { licenseplate } = req.params;

        const leaveQuery = `
            SELECT lp.*, u.role, u.department as user_department, u.name as employee_name
            FROM leave_permission lp
            JOIN users u ON lp.licenseplate = u.licenseplate
            WHERE lp.licenseplate = $1 
            AND CONVERT(DATE, lp.date) = CONVERT(DATE, GETDATE())
            AND lp.actual_exittime IS NULL
        `;
        const leaveResult = await db.query(leaveQuery, [licenseplate]);
        if (leaveResult.rows.length === 0) {
            return res.json({
                approved: false,
                reason: 'No leave permission found for today',
                licenseplate
            });
        }
        const leave = leaveResult.rows[0];

        const routingQuery = `
            SELECT TOP 1 approval_level1_role, approval_level2_role, 
                   approval_level1_name, approval_level2_name
            FROM master_routing 
            WHERE department = $1 
            AND (employee_name = $2 OR employee_name IS NULL)
            ORDER BY CASE WHEN employee_name IS NOT NULL THEN 1 ELSE 2 END
        `;
        const routingResult = await db.query(routingQuery, [leave.user_department, leave.employee_name]);
        if (routingResult.rows.length === 0) {
            return res.json({
                approved: false,
                reason: 'No routing configuration found',
                leave,
                routing: null
            });
        }
        const routing = routingResult.rows[0];

        let approved = false;
        let approvalDetails = {};
        if (leave.role === 'Staff') {
            const level1Approved = (routing.approval_level1_role === 'HEAD DEPARTMENT' && leave.statusfromdept === 'approved') ||
                (routing.approval_level1_role === 'HR' && leave.statusfromhr === 'approved');
            const level2Approved = (routing.approval_level2_role === 'HEAD DEPARTMENT' && leave.statusfromdept === 'approved') ||
                (routing.approval_level2_role === 'HR' && leave.statusfromhr === 'approved');
            approved = level1Approved && level2Approved;
            approvalDetails = {
                level1: {
                    role: routing.approval_level1_role,
                    name: routing.approval_level1_name,
                    approved: level1Approved,
                    status: routing.approval_level1_role === 'HEAD DEPARTMENT' ? leave.statusfromdept : leave.statusfromhr
                },
                level2: {
                    role: routing.approval_level2_role,
                    name: routing.approval_level2_name,
                    approved: level2Approved,
                    status: routing.approval_level2_role === 'HEAD DEPARTMENT' ? leave.statusfromdept : leave.statusfromhr
                }
            };
        } else if (leave.role === 'Head Department') {
            approved = leave.statusfromhr === 'approved';
            approvalDetails = {
                hrApproval: {
                    approved: approved,
                    status: leave.statusfromhr
                }
            };
        }
        res.json({
            approved,
            leave,
            routing,
            approvalDetails,
            licenseplate
        });
    } catch (error) {
        console.error('Error in debug endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});
// !! END OF DEBUG ENDPOINTS

// Simple debug endpoint to test database connection
app.get('/debug/db-test', async (req, res) => {
    try {
        //console.log('🔍 Testing database connection...');

        // Test 1: Simple query
        const simpleTest = await db.query('SELECT 1 as test_value');
        //console.log('✅ Simple query test passed');

        // Test 2: Check master_routing table
        const routingCount = await db.query('SELECT COUNT(*) as count FROM master_routing');
        //console.log('✅ Master routing count:', routingCount.rows[0]?.count);

        // Test 3: Check leave_permission table
        const leaveCount = await db.query('SELECT COUNT(*) as count FROM leave_permission');
        //console.log('✅ Leave permission count:', leaveCount.rows[0]?.count);

        // Test 4: Check for specific approver
        const approverTest = await db.query(`
            SELECT TOP 3 approval_level1_name, approval_level2_name 
            FROM master_routing 
            WHERE approval_level1_name IS NOT NULL OR approval_level2_name IS NOT NULL
        `);
        //console.log('✅ Approver test rows:', approverTest.rows?.length);

        res.json({
            success: true,
            tests: {
                simpleQuery: !!simpleTest.rows,
                routingCount: routingCount.rows[0]?.count || 0,
                leaveCount: leaveCount.rows[0]?.count || 0,
                approverRows: approverTest.rows?.length || 0
            }
        });

    } catch (e) {
        console.error('❌ Database test error:', e);
        res.status(500).json({
            success: false,
            error: e.message,
            stack: e.stack
        });
    }
});

// Debug endpoint to check routing mismatch
app.get('/debug/routing-mismatch', async (req, res) => {
    try {
        //console.log('🔍 Checking routing configuration mismatch...');

        // Get all active routing configurations
        const routing = await db.query('SELECT * FROM master_routing WHERE is_active = 1 ORDER BY department, role');
        //console.log('=== ALL ACTIVE ROUTING CONFIGURATIONS ===');
        routing.rows.forEach(r => {
            //console.log(`  ID: ${r.id} | Dept: '${r.department}' | Role: '${r.role}' | Employee: '${r.employee_name || 'null'}'`);
            //console.log(`    Level 1: ${r.approval_level1_name} (${r.approval_level1_role})`);
            //console.log(`    Level 2: ${r.approval_level2_name} (${r.approval_level2_role})`);
        });

        // Get all pending leave requests
        const leaves = await db.query(`SELECT id, name, department, role FROM leave_permission WHERE approval = 'pending' ORDER BY id`);
        //console.log('=== ALL PENDING LEAVE REQUESTS ===');
        leaves.rows.forEach(l => {
            //console.log(`  Leave ID: ${l.id} | Name: '${l.name}' | Dept: '${l.department}' | Role: '${l.role}'`);
        });

        // Check specific problematic leaves
        const problematicLeaves = await db.query(`SELECT * FROM leave_permission WHERE name IN ('MIA PUTRI NURDIANTI', 'SITI ROMLAH') AND approval = 'pending'`);
        //console.log('=== EXACT MATCH CHECK ===');
        for (const leave of problematicLeaves.rows) {
            console.log(`\nChecking leave for: ${leave.name}`);
            console.log(`  Leave dept: '${leave.department}' (length: ${leave.department?.length})`);
            console.log(`  Leave role: '${leave.role}' (length: ${leave.role?.length})`);

            // Check for exact match
            const exactMatch = await db.query(`SELECT * FROM master_routing WHERE department = $1 AND role = $2 AND is_active = 1`, [leave.department, leave.role]);
            console.log(`  Exact matching routing records: ${exactMatch.rows.length}`);

            if (exactMatch.rows.length === 0) {
                console.log('  ❌ NO EXACT MATCH FOUND!');
                // Show available departments and roles
                const allRouting = await db.query(`SELECT DISTINCT department, role FROM master_routing WHERE is_active = 1`);
                //console.log('    Available departments in routing:');
                const uniqueDepts = [...new Set(allRouting.rows.map(r => r.department))];
                uniqueDepts.forEach(dept => console.log(`      '${dept}' (length: ${dept?.length})`));

                console.log('    Available roles in routing:');
                const uniqueRoles = [...new Set(allRouting.rows.map(r => r.role))];
                    uniqueRoles.forEach(role => console.log(`'${role}' (length: ${role?.length})`));

                    // Check for department matches only
                    const deptOnlyMatch = await db.query(`SELECT * FROM master_routing WHERE department = $1 AND is_active = 1`, [leave.department]);
                    console.log(`    Department-only matches: ${deptOnlyMatch.rows.length}`);
                    deptOnlyMatch.rows.forEach(match => {
                        console.log(`      - Role: '${match.role}' (expected: '${leave.role}')`);
                    });
                } else {
                    console.log('  ✅ Found matching routing!');
                    exactMatch.rows.forEach(match => {
                        console.log(`    Level 1: ${match.approval_level1_name} (${match.approval_level1_role})`);
                        console.log(`    Level 2: ${match.approval_level2_name} (${match.approval_level2_role})`);
                    });
                }
        }

            res.json({
                success: true,
                routing: routing.rows,
                leaves: leaves.rows,
                problematicLeaves: problematicLeaves.rows
            });

        } catch (e) {
            console.error('❌ Routing mismatch debug error:', e);
            res.status(500).json({
                success: false,
                error: e.message
            });
        }
    });

// Endpoint to add missing routing configuration
app.post('/debug/add-missing-routing', async (req, res) => {
    try {
        //console.log('🔧 Adding missing routing configuration for HRD GA Staff...');

        // Insert the missing routing configuration for HRD GA Staff
        const insertResult = await db.query(`
            INSERT INTO master_routing 
            (department, role, approval_level1_name, approval_level1_role, approval_level2_name, approval_level2_role, is_active, created_at)
            VALUES 
            ('HRD GA', 'Staff', 'DERMAWAN PURBA', 'Head Department', 'MIA PUTRI NURDIANTI', 'HR', 1, GETDATE())
        `);

        //console.log('✅ Successfully added routing configuration');

        // Verify the insertion
        const verify = await db.query(`
            SELECT * FROM master_routing 
            WHERE department = 'HRD GA' AND role = 'Staff' AND is_active = 1
        `);

        //console.log('✅ Verification - Found records:', verify.rows.length);
        verify.rows.forEach(record => {
            //console.log(`   ID: ${record.id} | Level 1: ${record.approval_level1_name} | Level 2: ${record.approval_level2_name}`);
        });

        res.json({
            success: true,
            message: 'Added missing routing configuration for HRD GA Staff',
            insertedRecord: verify.rows[0] || null
        });

    } catch (e) {
        console.error('❌ Error adding routing configuration:', e);
        res.status(500).json({
            success: false,
            error: e.message
        });
    }
});

//-------------------------------------------------------//
//-------------------------------------------------------//
//-------------------------------------------------------//

server.listen(port, () => {
});