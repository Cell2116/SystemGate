// cctv.js - ES Modules version

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAMERA_RTSP = 'rtsp://admin:hik@2025@192.168.5.101:554/Streaming/Channels/101';
// Gunakan ffmpeg yang tersedia di sistem atau Docker container
const isDocker = process.env.NODE_ENV === 'production' || fs.existsSync('/.dockerenv');
const FFMPEG = isDocker ? 'ffmpeg' : "C:/Users/iotal/Downloads/ffmpeg-8.0/ffmpeg-8.0/bin/ffmpeg.exe";

// === FUNGSI SNAPSHOT DARI RTSP PAKAI FFMPEG ===
async function captureSnapshot(uid) {
    return new Promise((resolve, reject) => {
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileName = `${uid}-${Date.now()}.jpg`;
        const savePath = path.join(uploadsDir, fileName);

        // Ambil 1 frame dari RTSP (optimized untuk speed)
        const cmd = `${FFMPEG} -y -rtsp_transport tcp -i "${CAMERA_RTSP}" -frames:v 1 -q:v 2 -f image2 "${savePath}"`;
        
        console.log(`🎥 Capturing with command: ${cmd}`);

        exec(cmd, { timeout: 30000 }, (error) => {
            if (error) {
                console.error('❌ FFmpeg capture failed:', error);
                return reject(error);
            }
            console.log(`✅ Capture berhasil: ${fileName}`);
            resolve(fileName);
        });
    });
}

export { captureSnapshot };
