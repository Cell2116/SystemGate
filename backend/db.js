// import pkg from 'pg';

// const { Pool } = pkg;

// const pool = new Pool({
//   host: process.env.DB_HOST || 'postgres',
//   user: process.env.DB_USER || 'postgres',
//   password: process.env.DB_PASSWORD || 'ALKINDO@2025',
//   database: process.env.DB_NAME || 'postgres',
//   port: parseInt(process.env.DB_PORT) || 5432,
//   timezone: 'Asia/Jakarta' // Set timezone ke Indonesia
// });

// // Set timezone untuk session
// pool.on('connect', (client) => {
//   client.query("SET timezone TO 'Asia/Jakarta'");
// });

// export const query = (...args) => pool.query(...args);
// export default pool;


import sql from 'mssql';

const config = {
  server: process.env.DB_HOST || '192.168.4.108',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Marcello21',
  database: process.env.DB_NAME || 'thirdparty',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true, // Untuk Azure SQL
    trustServerCertificate: true, // Untuk development lokal
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Buat connection pool
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

// Handle connection errors
pool.on('error', err => {
  console.error('Database pool error:', err);
});

// Query helper function (mirip dengan PostgreSQL)
// Returns result with .rows property for compatibility
export const query = async (text, params) => {
  await poolConnect;
  try {
    const request = pool.request();

    // Bind parameters jika ada
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });

      // Replace $1, $2, etc dengan @param0, @param1, etc
      let sqlQuery = text;
      params.forEach((_, index) => {
        sqlQuery = sqlQuery.replace(`$${index + 1}`, `@param${index}`);
      });

      const result = await request.query(sqlQuery);
      
      // Add .rows property for PostgreSQL compatibility
      result.rows = result.recordset || [];
      return result;
    } else {
      const result = await request.query(text);
      
      // Add .rows property for PostgreSQL compatibility
      result.rows = result.recordset || [];
      return result;
    }
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
};

// Export pool untuk advanced usage
export const getPool = () => pool;
export { sql };
export default pool;