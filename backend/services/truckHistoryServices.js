import * as db from '../db.js';

const truckHistoryService = {
    /**
     * @param {Object} filters 
     * @returns {Array}
     */
    getTruckHistory: async (filters = {}) => {
        try {
            const { searchTerm, status, type, dateFrom, dateTo, offset } = filters;
            const pool = await db.getPool();
            const request = pool.request();
            const cycleOffset = offset !== undefined ? parseInt(offset) : 0;
            const targetCycle = 1 + cycleOffset;
            request.input('targetCycle', db.sql.Int, targetCycle);
            let filterQuery = '';

            if (searchTerm) {
                filterQuery += ` AND (
          t.platenumber LIKE '%' + @searchTerm + '%' OR 
          t.driver LIKE '%' + @searchTerm + '%' OR 
          t.supplier LIKE '%' + @searchTerm + '%' OR 
          t.goods LIKE '%' + @searchTerm + '%'
        )`;
                request.input('searchTerm', db.sql.VarChar, searchTerm);
            }
            if (status && status !== 'all') {
                filterQuery += ` AND t.status = @status`;
                request.input('status', db.sql.VarChar, status);
            }
            if (type && type !== 'all') {
                filterQuery += ` AND t.type = @type`;
                request.input('type', db.sql.VarChar, type);
            }
            if (dateFrom) {
                filterQuery += ` AND t.date >= @dateFrom`;
                request.input('dateFrom', db.sql.Date, dateFrom);
            }
            if (dateTo) {
                filterQuery += ` AND t.date <= @dateTo`;
                request.input('dateTo', db.sql.Date, dateTo);
            }
            const query = `
        SELECT 
          t.*,
          tt.cycle_number, tt.arrivaltime, tt.exittime, 
          tt.waitingfortimbang, tt.starttimbang, tt.finishtimbang, 
          tt.totalprocesstimbang,
          tt.runtohpc, tt.waitingforarrivalhpc, tt.entryhpc, 
          tt.totalwaitingarrival,
          tt.runtopt, tt.waitingforarrivalpt, tt.entrypt,
          tt.startloadingtime, tt.finishloadingtime, 
          tt.totalprocessloadingtime, tt.actualwaitloadingtime,
          tt.starttimbangneto, tt.finishtimbangneto, 
          tt.waitingfortimbangneto, tt.totalprocesstimbangneto,
          tt.waitingforexit, tt.totaltruckcompletiontime,
          tp.driver_photo, tp.sim_photo, tp.stnk_photo
        FROM trucks t
        LEFT JOIN truck_times tt 
          ON t.id = tt.truck_id AND tt.cycle_number = @targetCycle
        LEFT JOIN truck_photos tp 
          ON t.id = tp.truck_id
        WHERE 1=1
        ${filterQuery}
        ORDER BY t.date DESC, tt.arrivaltime DESC
      `;
            const result = await request.query(query);
            if (result.recordset.length === 0) {
                const error = new Error('No truck history found');
                error.statusCode = 404;
                throw error;
            }
            return result.recordset;
        } catch (error) {
            console.error('Error in getTruckHistory:', error);
            throw error;
        }
    },
    /** 
     * @param {Object} filters 
     * @returns {Array}
     */
    getTrucks: async (filters = {}) => {
        try {
            const { searchTerm, status, type, operation, dateFrom, dateTo, offset } = filters;
            const pool = await db.getPool();
            const request = pool.request();
            const cycleOffset = parseInt(offset) || 1;
            request.input('cycleOffset', db.sql.Int, cycleOffset);
            let query = `
            SELECT 
                t.*,
                tt.cycle_number, tt.arrivaltime, tt.exittime, tt.waitingfortimbang, tt.starttimbang, tt.finishtimbang, tt.totalprocesstimbang,
                tt.runtohpc, tt.waitingforarrivalhpc, tt.entryhpc, tt.totalwaitingarrival,
                tt.runtopt, tt.waitingforarrivalpt, tt.entrypt,
                tt.startloadingtime, tt.finishloadingtime, tt.totalprocessloadingtime, tt.actualwaitloadingtime,
                tt.starttimbangneto, tt.finishtimbangneto, tt.waitingfortimbangneto, tt.totalprocesstimbangneto,
                tt.waitingforexit, tt.totaltruckcompletiontime,
                tp.driver_photo, tp.sim_photo, tp.stnk_photo
            FROM trucks t
            LEFT JOIN truck_times tt ON t.id = tt.truck_id AND tt.cycle_number = t.loading_cycle
            LEFT JOIN truck_photos tp ON t.id = tp.truck_id
            WHERE 1=1
        `;
            let paramIndex = 1;
            if (searchTerm) {
                query += ` AND (
                            t.platenumber LIKE '%' + @searchTerm + '%' OR
                            t.driver LIKE '%' + @searchTerm + '%' OR
                            t.supplier LIKE '%' + @searchTerm + '%' OR
                            t.goods LIKE '%' + @searchTerm + '%'
                        )`;
                request.input('searchTerm', db.sql.VarChar, searchTerm);
                paramIndex++;
            }
            if (status) {
                query += ` AND t.status = @status`;
                request.input('status', db.sql.VarChar, status);
                paramIndex++;
            }
            if (type) {
                query += ` AND t.type = @type`;
                request.input('type', db.sql.VarChar, type);
                paramIndex++;
            }
            if (operation) {
                query += ` AND t.operation = @operation`;
                request.input('operation', db.sql.VarChar, operation);
                paramIndex++;
            }
            if (dateFrom) {
                query += ` AND t.date >= @dateFrom`;
                request.input('dateFrom', db.sql.Date, dateFrom);
                paramIndex++;
            }
            if (dateTo) {
                query += ` AND t.date <= @dateTo`;
                request.input('dateTo', db.sql.Date, dateTo);
                paramIndex++;
            }
            query += ` ORDER BY t.id DESC`;
            const result = await request.query(query);
            return result.recordset;
        }
        catch (error) {
            return ({ message: 'Fetching Trucks Error', error: error.message })
        }
    },
    getTrucksDelete: async (id) => {
        try {
            const query = 'SELECT * FROM trucks WHERE id = $1; DELETE FROM trucks WHERE id = $1';
            const result = await db.query(query, [id]);
            if (result.rows.length === 0) {
                return ({ error: 'Truck not found' });
            }
            return ({ message: 'Truck deleted successfully', truck: result.rows[0] })
        }
        catch(error){
            return ({ message: 'Cant delete truck', error: error.message})
        }
    }
}

export default truckHistoryService;