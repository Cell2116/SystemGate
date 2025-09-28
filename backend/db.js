import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'ALKINDO@2025',
  database: process.env.DB_NAME || 'postgres',
  port: parseInt(process.env.DB_PORT) || 5432,
  timezone: 'Asia/Jakarta' // Set timezone ke Indonesia
});

// Set timezone untuk session
pool.on('connect', (client) => {
  client.query("SET timezone TO 'Asia/Jakarta'");
});

export const query = (...args) => pool.query(...args);
export default pool;
