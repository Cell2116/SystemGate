import sql from 'mssql';

const config = {
  server: process.env.DB_HOST || '192.168.4.108',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Marcello21',
  database: process.env.DB_NAME || 'thirdparty',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true, 
    trustServerCertificate: true, 
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};


const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();


pool.on('error', err => {
  console.error('Database pool error:', err);
});

export const query = async (text, params) => {
  await poolConnect;
  try {
    const request = pool.request();
    
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
    
      let sqlQuery = text;
      params.forEach((_, index) => {
        sqlQuery = sqlQuery.replace(`$${index + 1}`, `@param${index}`);
      });
      const result = await request.query(sqlQuery); 
      result.rows = result.recordset || [];
      return result;
    } else {
      const result = await request.query(text);
      result.rows = result.recordset || [];
      return result;
    }
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
};
export const getPool = () => pool;
export { sql };
export default pool;