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

mqttClient.on('error', (error) => {
    console.error('🚨 MQTT Client Error:', error);
});

// Handle MQTT messages
mqttClient.on('message', async (topic, message) => {
    if (topic === 'rfid/entry') {
        try {
            const payload = JSON.parse(message.toString());
            console.log('📄 Node-RED payload:', payload);

            const { uid, timestamp } = payload;

            if (!uid) {
                console.log('❌ Missing UID in payload');
                return;
            }

            const user = await db.query('SELECT * FROM users WHERE uid = $1', [uid]);

            if (user.rows.length === 0) {
                console.log("❌ UID not found:", uid);
                mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify({
                    status: 'rejected',
                    reason: 'UID not found',
                    timestamp: new Date().toISOString()
                }));
                return;
            }

            const userInfo = user.rows[0];
            const licensePlate = userInfo.licenseplate;
            console.log("✅ Valid UID received:", uid, "License Plate:", licensePlate);

            const today = new Date().toISOString().split('T')[0];
            const existingEntry = await db.query(
                'SELECT * FROM attendance_logs WHERE uid = $1 AND DATE(datein) = $2 AND dateout IS NULL ORDER BY datein DESC LIMIT 1',
                [uid, today]
            );

            if (existingEntry.rows.length > 0) {
                // This is an EXIT
                // Capture and save exit image
                const imagePathOut = await captureSnapshot(uid);

                // Update attendance_logs with dateout, status, and image_path_out
                const updateResult = await db.query(
                    'UPDATE attendance_logs SET dateout = CURRENT_TIMESTAMP, status = $1, image_path_out = $2 WHERE id = $3 RETURNING *',
                    ['exit', imagePathOut, existingEntry.rows[0].id]
                );

                const exitData = {
                    id: updateResult.rows[0].id,
                    uid: uid,
                    licenseplate: licensePlate,
                    name: userInfo.name,
                    department: userInfo.department,
                    image_path_in: existingEntry.rows[0].image_path, // entry image
                    image_path_out: imagePathOut, // exit image
                    datein: existingEntry.rows[0].datein,
                    dateout: new Date().toISOString(),
                    status: 'exit',
                    type: 'exit',
                    timestamp: new Date().toISOString()
                };

                broadcast(exitData);
                console.log("🚪 EXIT logged and broadcasted for UID:", uid);

                mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify({
                    status: 'approved',
                    action: 'exit',
                    message: imagePathOut ? 'Exit recorded with image' : 'Exit recorded without image',
                    name: userInfo.name,
                    department: userInfo.department,
                    licenseplate: userInfo.licenseplate,
                    image_path: existingEntry.rows[0].image_path,
                    image_path_out: imagePathOut,
                    timestamp: new Date().toISOString()
                }));

            } else {
                // This is an ENTRY
                const insertResult = await db.query(
                    'INSERT INTO attendance_logs (uid, licenseplate, status) VALUES ($1, $2, $3) RETURNING *',
                    [uid, licensePlate, 'entry']
                );

                // Capture and save image
                const imagePath = await captureSnapshot(uid);

                if (imagePath) {
                    await db.query(
                        'UPDATE attendance_logs SET image_path = $1 WHERE id = $2 RETURNING *',
                        [imagePath, insertResult.rows[0].id]
                    );

                    const entryData = {
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
                        timestamp: new Date().toISOString()
                    };

                    broadcast(entryData);
                    console.log("🚪 ENTRY logged and broadcasted for UID:", uid);

                    mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify({
                        status: 'approved',
                        action: 'Entry',
                        message: 'Entry recorded with image',
                        name: userInfo.name,
                        department: userInfo.department,
                        licenseplate: userInfo.licenseplate,
                        image_path: imagePath,
                        timestamp: new Date().toISOString()
                    }));
                } else {
                    console.log("❌ Failed to capture image for UID:", uid);
                    mqttClient.publish(`rfid/approval/${uid}`, JSON.stringify({
                        status: 'approved',
                        action: 'Entry',
                        message: 'Entry recorded without image',
                        name: userInfo.name,
                        department: userInfo.department,
                        licenseplate: userInfo.licenseplate,
                        timestamp: new Date().toISOString()
                    }));
                }
            }
        } catch (error) {
            console.error('❌ Error processing MQTT message:', error);
        }
    }
});

// Enhanced logs endpoint
app.get('/logs', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                attendance_logs.*,
                users.name,
                users.department
            FROM attendance_logs
            JOIN users ON attendance_logs.uid = users.uid
            ORDER BY attendance_logs.datein DESC
        `);

        console.log(`📋 Fetched ${result.rows.length} log records`);
        res.json(result.rows);
    } catch (e) {
        console.error("❌ Error fetching logs:", e);
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
                submittedAt || new Date()
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

server.listen(port, () => {
    console.log(`🚀 Server + WebSocket listening on http://localhost:${port}`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${port}`);
    console.log(`🖼️ Image uploads: http://localhost:${port}/uploads/`);
});
