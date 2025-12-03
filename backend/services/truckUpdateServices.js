import * as db from '../db.js'
import processImages, { validateAndFormatTime, saveImageToFile } from '../utils/utilsFunction.js'

const getCurrentLoadingCycle = async (transaction, truckId) => {
    const request = transaction.request();
    request.input('truck_id', db.sql.Int, truckId);

    const query = `SELECT loading_cycle FROM trucks WHERE id = @truck_id`;
    const result = await request.query(query);

    return result.recordset.length > 0 ? (result.recordset[0].loading_cycle || 1) : 1;
};

const checkTruckTimesExists = async (transaction, truckId, cycleNumber) => {
    const request = transaction.request();
    request.input('truck_id', db.sql.Int, truckId);
    request.input('cycle_number', db.sql.Int, cycleNumber);

    const query = `
        SELECT COUNT(*) as count FROM truck_times 
        WHERE truck_id = @truck_id AND cycle_number = @cycle_number
    `;
    const result = await request.query(query);
    return result.recordset[0].count > 0;
};

const getArrivalTimeFromCycle1 = async (transaction, truckId) => {
    const request = transaction.request();
    request.input('truck_id', db.sql.Int, truckId);

    const query = `
        SELECT arrivaltime FROM truck_times 
        WHERE truck_id = @truck_id AND cycle_number = 1
    `;
    const result = await request.query(query);
    return result.recordset.length > 0 ? result.recordset[0].arrivaltime : null;
};

const truckUpdateServices = {
    updateTruck: async (truckId, updateData) => {
        const pool = await db.getPool();
        const transaction = pool.transaction();
        try {
            await transaction.begin();
            // ===== 0. PROCESS IMAGES =====
            const processedData = await processImages(updateData);
            updateData = processedData;

            const mainTableFields = [
                'platenumber', 'noticket', 'department', 'nikdriver', 'tlpdriver', 'nosj', 'tglsj',
                'driver', 'supplier', 'eta', 'status', 'type', 'operation', 'goods',
                'descin', 'descout', 'statustruck', 'armada', 'kelengkapan', 'jenismobil', 'date',
                'skipped_steps', 'skip_reason', 'loading_cycle', 'department_history'
            ];

            const timeTableFields = [
                'arrivaltime', 'waitingfortimbang', 'starttimbang', 'finishtimbang', 'totalprocesstimbang',
                'runtohpc', 'waitingforarrivalhpc', 'entryhpc', 'totalwaitingarrival',
                'runtopt', 'waitingforarrivalpt', 'entrypt',
                'startloadingtime', 'finishloadingtime', 'totalprocessloadingtime', 'actualwaitloadingtime',
                'starttimbangneto', 'finishtimbangneto', 'waitingfortimbangneto', 'totalprocesstimbangneto',
                'exittime', 'waitingforexit', 'totaltruckcompletiontime'
            ];

            const photoTableFields = ['driver_photo', 'sim_photo', 'stnk_photo'];
            const mainUpdateFields = mainTableFields.filter(field => updateData[field] !== undefined);
            if (mainUpdateFields.length > 0) {
                const mainRequest = transaction.request();
                mainRequest.input('id', db.sql.Int, parseInt(truckId));

                const setClause = mainUpdateFields.map(field => {
                    const value = updateData[field];
                    const stringValue = value === null ? null : String(value);
                    mainRequest.input(field, db.sql.VarChar, stringValue);
                    return `${field} = @${field}`;
                }).join(', ');

                const mainQuery = `UPDATE trucks SET ${setClause} WHERE id = @id`;
                const result = await mainRequest.query(mainQuery);
                console.log('Main table rows affected:', result.rowsAffected[0]);
            } else {
                console.log('No main table fields to update');
            }

            // ===== 2. UPDATE/INSERT TRUCK_TIMES TABLE =====
            const timeUpdateFields = timeTableFields.filter(field => updateData[field] !== undefined);
            if (timeUpdateFields.length > 0) {
                const currentLoadingCycle = await getCurrentLoadingCycle(transaction, parseInt(truckId));
                const rowExists = await checkTruckTimesExists(transaction, parseInt(truckId), currentLoadingCycle);
                if (rowExists) {
                    // UPDATE existing row
                    const timeRequest = transaction.request();
                    timeRequest.input('truck_id', db.sql.Int, parseInt(truckId));

                    const timeSetClause = timeUpdateFields.map(field => {
                        if (field === 'arrivaltime' || field === 'exittime') {
                            let dateValue = updateData[field];
                            if (typeof dateValue === 'string' && dateValue.includes(' ')) {
                                dateValue = dateValue.replace(' ', 'T');
                            }
                            if (typeof dateValue === 'string') {
                                dateValue = new Date(dateValue);
                            }
                            timeRequest.input(field, db.sql.DateTime2, dateValue);
                        } else {
                            const formattedTime = validateAndFormatTime(updateData[field], field);
                            timeRequest.input(field, db.sql.VarChar, formattedTime);
                        }
                        return `${field} = @${field}`;
                    }).join(', ');

                    timeRequest.input('cycle_number', db.sql.Int, currentLoadingCycle);
                    const timeQuery = `UPDATE truck_times SET ${timeSetClause} WHERE truck_id = @truck_id AND cycle_number = @cycle_number`;
                    const result = await timeRequest.query(timeQuery);

                } else {
                    // INSERT new row
                    let arrivalTimeForNewCycle = null;
                    if (currentLoadingCycle > 1) {
                        arrivalTimeForNewCycle = await getArrivalTimeFromCycle1(transaction, parseInt(truckId));
                    }

                    const timeRequest = transaction.request();
                    timeRequest.input('truck_id', db.sql.Int, parseInt(truckId));
                    timeRequest.input('cycle_number', db.sql.Int, currentLoadingCycle);

                    const insertFieldsMap = {};
                    timeUpdateFields.forEach(field => {
                        if (field === 'arrivaltime' || field === 'exittime') {
                            let valueToUse = (field === 'arrivaltime' && arrivalTimeForNewCycle)
                                ? arrivalTimeForNewCycle
                                : updateData[field];

                            if (typeof valueToUse === 'string') {
                                if (valueToUse.includes(' ')) {
                                    valueToUse = valueToUse.replace(' ', 'T');
                                }
                                valueToUse = new Date(valueToUse);
                            }

                            timeRequest.input(`insert_${field}`, db.sql.DateTime2, valueToUse);
                            insertFieldsMap[field] = `@insert_${field}`;
                        } else {
                            const formattedTime = validateAndFormatTime(updateData[field], field);
                            timeRequest.input(`insert_${field}`, db.sql.VarChar, formattedTime);
                            insertFieldsMap[field] = `@insert_${field}`;
                        }
                    });

                    const insertFields = ['truck_id', 'cycle_number', ...timeUpdateFields];
                    const insertValues = ['@truck_id', '@cycle_number', ...timeUpdateFields.map(field => `@insert_${field}`)];
                    const insertQuery = `
                        INSERT INTO truck_times (${insertFields.join(', ')})
                        VALUES (${insertValues.join(', ')})
                    `;
                    const result = await timeRequest.query(insertQuery);
                }
            }

            // ===== 3. UPDATE TRUCK_PHOTOS TABLE =====
            const photoUpdateFields = photoTableFields.filter(field => updateData[field] !== undefined);
            if (photoUpdateFields.length > 0) {
                const photoRequest = transaction.request();
                photoRequest.input('truck_id', db.sql.Int, parseInt(truckId));

                const photoSetClause = photoUpdateFields.map(field => {
                    const value = updateData[field];
                    const stringValue = value === null ? null : String(value);
                    photoRequest.input(field, db.sql.VarChar, stringValue);
                    return `${field} = @${field}`;
                }).join(', ');
                const photoQuery = `UPDATE truck_photos SET ${photoSetClause} WHERE truck_id = @truck_id`;
                const result = await photoRequest.query(photoQuery);
            }

            // ===== 4. SELECT UPDATED TRUCK =====
            const selectRequest = transaction.request();
            selectRequest.input('id', db.sql.Int, truckId);
            const selectQuery = `
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
                WHERE t.id = @id
            `;
            const selectResult = await selectRequest.query(selectQuery);
            if (selectResult.recordset.length === 0) {
                await transaction.rollback();
                const error = new Error('Truck not found');
                error.statusCode = 404;
                throw error;
            }
            const updatedTruck = selectResult.recordset[0];
            await transaction.commit();
            return {
                success: true,
                message: 'Truck updated successfully',
                data: updatedTruck
            };

        } catch (error) {
            if (transaction) {
                await transaction.rollback();
                console.error('❌ Transaction rolled back due to error');
            }
            console.error('Error in updateTruck service:', error);
            throw error;
        }
    }
}

export default truckUpdateServices