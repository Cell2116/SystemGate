import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'ALKINDO@2025',
  database: process.env.DB_NAME || 'postgres',
  port: parseInt(process.env.DB_PORT) || 5432
});

export const query = (...args) => pool.query(...args);
export default pool;
