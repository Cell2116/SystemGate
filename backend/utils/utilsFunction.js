import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { rootPath } from '../path.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function validateAndFormatTime(timeValue, fieldName) {
    if (!timeValue) return null;
    let timeString = String(timeValue).trim();
    // Handle various time formats
    if (timeString.match(/^\d{1,3}:\d{1,2}:\d{1,2}$/)) {
        // Format: H:mm:ss or HH:mm:ss
        const parts = timeString.split(':');
        const hours = parts[0].padStart(2, '0');
        const minutes = parts[1].padStart(2, '0');
        const seconds = parts[2].padStart(2, '0');
        // Validate ranges
        if (parseInt(hours) > 838 || parseInt(minutes) > 59 || parseInt(seconds) > 59) {
            throw new Error(`Invalid time values for '${fieldName}': ${timeString}`);
        }
        return `${hours}:${minutes}:${seconds}`;
    } else if (timeString.match(/^\d{1,3}:\d{1,2}$/)) {
        // Format: H:mm or HH:mm - add seconds
        const parts = timeString.split(':');
        const hours = parts[0].padStart(2, '0');
        const minutes = parts[1].padStart(2, '0');
        // Validate ranges
        if (parseInt(hours) > 838 || parseInt(minutes) > 59) {
            throw new Error(`Invalid time values for '${fieldName}': ${timeString}`);
        }
        return `${hours}:${minutes}:00`;
    } else {
        throw new Error(`Invalid time format for '${fieldName}': ${timeString}. Expected format: HH:mm:ss or HH:mm`);
    }
};

export function saveImageToFile(base64Data, filename) {
    return new Promise((resolve, reject) => {
        try {
            const base64Image = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
            const imageBuffer = Buffer.from(base64Image, 'base64');
            const uploadDir = path.join(rootPath, 'uploads/trucks');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const filePath = path.join(uploadDir, filename);
            fs.writeFileSync(filePath, imageBuffer);
            resolve(filename);
        } catch (error) {
            console.error('Error saving image:', error);
            reject(error);
        }
    });
}
export default async function processImages(requestBody) {
    const imageFields = ['driver_photo', 'sim_photo', 'stnk_photo'];
    const result = { ...requestBody };

    for (const field of imageFields) {
        if (requestBody[field] && requestBody[field].startsWith('data:image')) {
            const filename = `${field.replace('_photo', '')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
            result[field] = await saveImageToFile(requestBody[field], filename);
        }
    }

    return result; 
};

