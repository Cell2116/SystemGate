import * as db from '../db.js'

const truckActualQueue = {
    /**
     * 
     * @param {*} id 
     */
    getTruckActualQueue: async (id) => {
        try {
            const pool = await db.getPool()
            const result = await pool
                .request()
                .input("truck_id", db.sql.Int, id)
                .query(`
                            SELECT
                                q.*,
                                t.platenumber,
                                t.noticket,
                                t.status,
                                t.operation,
                                t.department
                            FROM truck_queue_actual q
                            JOIN trucks t ON q.truck_id = t.id
                            WHERE q.truck_id = @truck_id
                            `);
            if (result.recordset.length === 0) {
                return res.status(404).json({ message: "Truck Not Found" });
            }
            return result.recordset[0];
        }
        catch (error) {
            return ({ message: 'Error fetching actual queue', error: error.message })
        }
    }
}
export default truckActualQueue;