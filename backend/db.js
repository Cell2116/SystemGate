import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',       // ← gunakan service name 'postgres'
  user: process.env.DB_USER || 'espuser',
  password: process.env.DB_PASSWORD || 'esp123',
  database: process.env.DB_NAME || 'esp32db',
  port: parseInt(process.env.DB_PORT) || 5432    // ← default port di dalam container
});

export const query = (...args) => pool.query(...args);
export default pool;
