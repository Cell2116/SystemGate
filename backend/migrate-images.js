import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const config = {
    server: process.env.DB_HOST || '192.168.4.108',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Marcello21',
    database: process.env.DB_NAME || 'thirdparty',
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};
function saveImageToFile(base64Data, filename) {
    return new Promise((resolve, reject) => {
        try {
            const base64Image = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
            const imageBuffer = Buffer.from(base64Image, 'base64');
            const uploadDir = path.join(__dirname, '../uploads/trucks');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const filePath = path.join(uploadDir, filename);
            fs.writeFileSync(filePath, imageBuffer);
            resolve(`/uploads/trucks/${filename}`);
        } catch (error) {
            reject(error);
        }
    });
}
async function migrateImages() {
    let pool;
    try {
        pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT id, driver_photo, sim_photo, stnk_photo
            FROM trucks
            WHERE driver_photo LIKE 'data:image%'
               OR sim_photo LIKE 'data:image%'
               OR stnk_photo LIKE 'data:image%'
        `);
        let migratedCount = 0;
        for (const truck of result.recordset) {
            const updates = {};
            const fields = ['driver_photo', 'sim_photo', 'stnk_photo'];
            for (const field of fields) {
                if (truck[field] && truck[field].startsWith('data:image')) {
                    try {
                        const filename = `${field.replace('_photo', '')}_${truck.id}_${Date.now()}.jpg`;
                        const filePath = await saveImageToFile(truck[field], filename);
                        updates[field] = filePath;
                    } catch (error) {
                        console.error(`❌ Failed to migrate ${field} for truck ${truck.id}:`, error);
                    }
                }
            }
            if (Object.keys(updates).length > 0) {
                const request = pool.request();
                request.input('id', sql.Int, truck.id);
                let updateClause = [];
                Object.keys(updates).forEach(field => {
                    request.input(field, sql.VarChar, updates[field]);
                    updateClause.push(`${field} = @${field}`);
                });
                await request.query(`UPDATE trucks SET ${updateClause.join(', ')} WHERE id = @id`);
                migratedCount++;
            }
        }
    } catch (error) {
        console.error('💥 Migration failed:', error);
    } finally {
        if (pool) {
            await pool.close();
        }
        process.exit(0);
    }
}
migrateImages();