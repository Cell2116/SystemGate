import * as db from '../db.js'

const truckExportServices = {
    /**
     * 
     * @param {Object} filters
     * @return {Object} 
     */
    exportTrucks: async (filters = {}) => {
        try {
            const { startDate, endDate, department, status } = filters;
            let whereClause = 'WHERE 1=1';
            if (startDate) {
                whereClause += ` AND t.date >= '${startDate}'`;
            }
            if (endDate) {
                whereClause += ` AND t.date <= '${endDate}'`;
            }
            if (department && department !== 'ALL') {
                whereClause += ` AND t.department = '${department}'`;
            }
            if (status) {
                whereClause += ` AND t.status = '${status}'`;
            }
            const query = `
                        SELECT
                            -- Data dari trucks
                            t.id as truck_id,
                            t.platenumber,
                            t.noticket,
                            t.driver,
                            t.nikdriver,
                            t.tlpdriver,
                            t.supplier,
                            t.nosj,
                            t.tglsj,
                            t.status,
                            t.type,
                            t.operation,
                            t.goods,
                            t.descin,
                            t.descout,
                            t.statustruck,
                            t.armada,
                            t.kelengkapan,
                            t.jenismobil,
                            t.jenisbarang,
                            t.department,
                            t.date,
                            t.loading_cycle,

                            -- Data dari truck_times cycle 1
                            CONVERT(VARCHAR, tt1.arrivaltime, 120) as arrivaltime,
                            CONVERT(VARCHAR, tt1.waitingfortimbang, 108) as waitingfortimbang,
                            CONVERT(VARCHAR, tt1.starttimbang, 108) as starttimbang,
                            CONVERT(VARCHAR, tt1.finishtimbang, 108) as finishtimbang,
                            CONVERT(VARCHAR, tt1.totalprocesstimbang, 108) as totalprocesstimbang,
                            CONVERT(VARCHAR, tt1.runtohpc, 108) as runtohpc,
                            CONVERT(VARCHAR, tt1.waitingforarrivalhpc, 108) as waitingforarrivalhpc,
                            CONVERT(VARCHAR, tt1.entryhpc, 108) as entryhpc,
                            CONVERT(VARCHAR, tt1.runtopt, 108) as runtopt,
                            CONVERT(VARCHAR, tt1.waitingforarrivalpt, 108) as waitingforarrivalpt,
                            CONVERT(VARCHAR, tt1.entrypt, 108) as entrypt,
                            CONVERT(VARCHAR, tt1.totalwaitingarrival, 108) as totalwaitingarrival,
                            CONVERT(VARCHAR, tt1.startloadingtime, 108) as startloadingtime,
                            CONVERT(VARCHAR, tt1.finishloadingtime, 108) as finishloadingtime,
                            CONVERT(VARCHAR, tt1.totalprocessloadingtime, 108) as totalprocessloadingtime,
                            CONVERT(VARCHAR, tt1.actualwaitloadingtime, 108) as actualwaitloadingtime,
                            CONVERT(VARCHAR, tt1.starttimbangneto, 108) as starttimbangneto,
                            CONVERT(VARCHAR, tt1.finishtimbangneto, 108) as finishtimbangneto,
                            CONVERT(VARCHAR, tt1.totalprocesstimbangneto, 108) as totalprocesstimbangneto,
                            CONVERT(VARCHAR, tt1.waitingfortimbangneto, 108) as waitingfortimbangneto,
                            CONVERT(VARCHAR, tt1.exittime, 108) as exittime,
                            CONVERT(VARCHAR, tt1.totaltruckcompletiontime, 108) as totaltruckcompletiontime,
                            CONVERT(VARCHAR, tt1.waitingforexit, 108) as waitingforexit,

                            -- Data dari truck_times cycle 2
                            CONVERT(VARCHAR, tt2.arrivaltime, 120) as arrivaltime_cycle2,
                            CONVERT(VARCHAR, tt2.waitingfortimbang, 108) as waitingfortimbang_cycle2,
                            CONVERT(VARCHAR, tt2.starttimbang, 108) as starttimbang_cycle2,
                            CONVERT(VARCHAR, tt2.finishtimbang, 108) as finishtimbang_cycle2,
                            CONVERT(VARCHAR, tt2.totalprocesstimbang, 108) as totalprocesstimbang_cycle2,
                            CONVERT(VARCHAR, tt2.runtohpc, 108) as runtohpc_cycle2,
                            CONVERT(VARCHAR, tt2.waitingforarrivalhpc, 108) as waitingforarrivalhpc_cycle2,
                            CONVERT(VARCHAR, tt2.entryhpc, 108) as entryhpc_cycle2,
                            CONVERT(VARCHAR, tt2.runtopt, 108) as runtopt_cycle2,
                            CONVERT(VARCHAR, tt2.waitingforarrivalpt, 108) as waitingfoarrivalpt_cycle2,
                            CONVERT(VARCHAR, tt2.entrypt, 108) as entrypt_cycle2,
                            CONVERT(VARCHAR, tt2.totalwaitingarrival, 108) as totalwaitingarrival_cycle2,
                            CONVERT(VARCHAR, tt2.startloadingtime, 108) as startloadingtime_cycle2,
                            CONVERT(VARCHAR, tt2.finishloadingtime, 108) as finishloadingtime_cycle2,
                            CONVERT(VARCHAR, tt2.totalprocessloadingtime, 108) as totalprocessloadingtime_cycle2,
                            CONVERT(VARCHAR, tt2.actualwaitloadingtime, 108) as actualwaitloadingtime_cycle2,
                            CONVERT(VARCHAR, tt2.starttimbangneto, 108) as starttimbangneto_cycle2,
                            CONVERT(VARCHAR, tt2.finishtimbangneto, 108) as finishtimbangneto_cycle2,
                            CONVERT(VARCHAR, tt2.totalprocesstimbangneto, 108) as totalprocesstimbangneto_cycle2,
                            CONVERT(VARCHAR, tt2.waitingfortimbangneto, 108) as waitingfortimbangneto_cycle2,
                            CONVERT(VARCHAR, tt2.exittime, 108) as exittime_cycle2,
                            CONVERT(VARCHAR, tt2.totaltruckcompletiontime, 108) as totaltruckcompletiontime_cycle2,
                            CONVERT(VARCHAR, tt2.waitingforexit, 108) as waitingforexit_cycle2,

                            -- Data dari truck_queue_actual
                            tqa.queue_position,
                            tqa.queue_ticket,

                            -- Data dari truck_photos
                            tp.driver_photo,
                            tp.stnk_photo,
                            tp.sim_photo

                        FROM trucks t
                        LEFT JOIN truck_times tt1 ON t.id = tt1.truck_id AND tt1.cycle_number = 1
                        LEFT JOIN truck_times tt2 ON t.id = tt2.truck_id AND tt2.cycle_number = 2
                        LEFT JOIN truck_queue_actual tqa ON t.id = tqa.truck_id
                        LEFT JOIN truck_photos tp ON t.id = tp.truck_id
                        ` + whereClause + `
                        ORDER BY t.date DESC, t.id DESC
                    `;
            const pool = await db.getPool();
            const result = await pool.request().query(query);
            return ({
                success: true,
                data: result.recordset,
                count: result.recordset.length
            }) 
        }
        catch (error) {
            return ({ message: "Error Exporting Data Truck", error: error.message })
        }
    }
}
export default truckExportServices;