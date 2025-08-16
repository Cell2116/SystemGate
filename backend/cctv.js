// cctv.js - CommonJS version


import DigestFetch from 'digest-fetch';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAMERA_IP = '192.168.5.84';
const USERNAME = 'admin';
const PASSWORD = 'hik@2025';
const client = new DigestFetch(USERNAME, PASSWORD);

// async function captureSnapshot(uid) {
// try {
//     const url = `http://${CAMERA_IP}/ISAPI/Streaming/channels/101/picture`;
//     console.log(`📸 Taking snapshot from ${url} for UID: ${uid}...`);

//     const res = await client.fetch(url, { method: 'GET' });

//     if (!res.ok) {
//         throw new Error(`HTTP ${res.status} - ${res.statusText}`);
//     }

//     const buffer = await res.arrayBuffer();
//     const fileName = `${uid}-${Date.now()}.png`;
//     const savePath = path.join(__dirname, 'uploads', fileName);

//     const uploadsDir = path.join(__dirname, 'uploads');
//     if (!fs.existsSync(uploadsDir)) {
//         fs.mkdirSync(uploadsDir, { recursive: true });
//     }

//     fs.writeFileSync(savePath, Buffer.from(buffer));
//     console.log('✅ Snapshot saved:', fileName);

//     return fileName;
//     } catch (err) {
//     console.error('❌ Failed to capture snapshot:', err.message);
//     return null;
//     }
// }

async function captureSnapshot(uid) {
    try {
        const url = `http://${CAMERA_IP}/ISAPI/Streaming/channels/101/picture`;
        console.log(`📸 Taking MAX QUALITY snapshot for UID: ${uid}...`);

        const res = await client.fetch(url, { method: 'GET' });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        }

        const buffer = await res.arrayBuffer();
        const fileName = `${uid}-${Date.now()}-hq.jpg`;
        const savePath = path.join(__dirname, 'uploads', fileName);

        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        
        await sharp(Buffer.from(buffer))
            // .resize({ 
            //     width: 2560, 
            //     height: 1440, 
            //     fit: 'inside',
            //     withoutEnlargement: true 
            // })
            .sharpen({
                sigma: 1,     
                flat: 1.5,       
                jagged: 3      
            })
            .modulate({
                brightness: 1.1,
                saturation: 1.1,
                hue: 0
            })
            .jpeg({ 
                quality: 100,     
                progressive: false,
                mozjpeg: true
            })
            .toFile(savePath);

        console.log('✅ MAX QUALITY snapshot saved:', fileName);
        return fileName;
    } catch (err) {
        console.error('❌ Failed to capture max quality snapshot:', err.message);
        return null;
    }
}


export { captureSnapshot };
