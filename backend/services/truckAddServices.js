import * as db from '../db.js';
import processImages, {validateAndFormatTime, saveImageToFile} from '../utils/utilsFunction.js'

const truckAddServices = {
    addTruck: async (truckData) => {
        const pool = await db.getPool();
        const transaction = pool.transaction();
        try {
            await transaction.begin();
            const {
                platenumber, noticket, department, nikdriver, tlpdriver, nosj, tglsj,
                driver, supplier, eta, status, type, operation, goods,
                descin, descout, statustruck, armada, kelengkapan, jenismobil, jenisbarang, date, exittime,
                arrivaltime, waitingfortimbang, starttimbang, finishtimbang, totalprocesstimbang,
                runtohpc, waitingforarrivalhpc, entryhpc, totalwaitingarrival,
                runtopt, waitingforarrivalpt, entrypt,
                startloadingtime, finishloadingtime, totalprocessloadingtime, actualwaitloadingtime,
                starttimbangneto, finishtimbangneto, waitingfortimbangneto, totalprocesstimbangneto,
                waitingforexit, totaltruckcompletiontime
            } = truckData;

            // ===== 1. PROCESS IMAGES =====
            const savedImages = await processImages(truckData);

            // ===== 2. INSERT TRUCKS TABLE =====
            const mainRequest = transaction.request();
            mainRequest.input('platenumber', db.sql.VarChar, platenumber);
            mainRequest.input('noticket', db.sql.VarChar, noticket);
            mainRequest.input('department', db.sql.VarChar, department);
            mainRequest.input('nikdriver', db.sql.VarChar, nikdriver);
            mainRequest.input('tlpdriver', db.sql.VarChar, tlpdriver);
            mainRequest.input('nosj', db.sql.VarChar, nosj);
            mainRequest.input('tglsj', db.sql.Date, tglsj || null);
            mainRequest.input('driver', db.sql.VarChar, driver);
            mainRequest.input('supplier', db.sql.VarChar, supplier);
            mainRequest.input('eta', db.sql.VarChar, eta);
            mainRequest.input('status', db.sql.VarChar, status || 'waiting');
            mainRequest.input('type', db.sql.VarChar, type);
            mainRequest.input('operation', db.sql.VarChar, operation);
            mainRequest.input('goods', db.sql.VarChar, goods);
            mainRequest.input('descin', db.sql.VarChar, descin);
            mainRequest.input('descout', db.sql.VarChar, descout);
            mainRequest.input('statustruck', db.sql.VarChar, statustruck);
            mainRequest.input('armada', db.sql.VarChar, armada);
            mainRequest.input('kelengkapan', db.sql.VarChar, kelengkapan);
            mainRequest.input('jenisbarang', db.sql.VarChar, jenisbarang);
            mainRequest.input('jenismobil', db.sql.VarChar, jenismobil);
            mainRequest.input('date', db.sql.Date, date || null);

            const mainQuery = `
                INSERT INTO trucks (
                    platenumber, noticket, department, nikdriver, tlpdriver, nosj, tglsj,
                    driver, supplier, eta, status, type, operation, goods,
                    descin, descout, statustruck, armada, kelengkapan, jenismobil, jenisbarang, date, loading_cycle
                ) 
                VALUES (
                    @platenumber, @noticket, @department, @nikdriver, @tlpdriver, @nosj, @tglsj,
                    @driver, @supplier, @eta, @status, @type, @operation, @goods,
                    @descin, @descout, @statustruck, @armada, @kelengkapan, @jenismobil, @jenisbarang, @date, 1
                );
                SELECT SCOPE_IDENTITY() AS id;
            `;

            const mainResult = await mainRequest.query(mainQuery);
            const truckId = mainResult.recordset[0].id;

            // ===== 3. INSERT TRUCK_TIMES TABLE =====
            const timesRequest = transaction.request();
            timesRequest.input('truck_id', db.sql.Int, truckId);
            timesRequest.input('cycle_number', db.sql.Int, 1);
            timesRequest.input('arrivaltime', db.sql.DateTime2, arrivaltime || null);
            timesRequest.input('waitingfortimbang', db.sql.VarChar(8), validateAndFormatTime(waitingfortimbang, 'waitingfortimbang'));
            timesRequest.input('starttimbang', db.sql.VarChar(8), validateAndFormatTime(starttimbang, 'starttimbang'));
            timesRequest.input('finishtimbang', db.sql.VarChar(8), validateAndFormatTime(finishtimbang, 'finishtimbang'));
            timesRequest.input('totalprocesstimbang', db.sql.VarChar(8), validateAndFormatTime(totalprocesstimbang, 'totalprocesstimbang'));
            timesRequest.input('runtohpc', db.sql.VarChar(8), validateAndFormatTime(runtohpc, 'runtohpc'));
            timesRequest.input('waitingforarrivalhpc', db.sql.VarChar(8), validateAndFormatTime(waitingforarrivalhpc, 'waitingforarrivalhpc'));
            timesRequest.input('entryhpc', db.sql.VarChar(8), validateAndFormatTime(entryhpc, 'entryhpc'));
            timesRequest.input('totalwaitingarrival', db.sql.VarChar(8), validateAndFormatTime(totalwaitingarrival, 'totalwaitingarrival'));
            timesRequest.input('runtopt', db.sql.VarChar(8), validateAndFormatTime(runtopt, 'runtopt'));
            timesRequest.input('waitingforarrivalpt', db.sql.VarChar(8), validateAndFormatTime(waitingforarrivalpt, 'waitingforarrivalpt'));
            timesRequest.input('entrypt', db.sql.VarChar(8), validateAndFormatTime(entrypt, 'entrypt'));
            timesRequest.input('startloadingtime', db.sql.VarChar(8), validateAndFormatTime(startloadingtime, 'startloadingtime'));
            timesRequest.input('finishloadingtime', db.sql.VarChar(8), validateAndFormatTime(finishloadingtime, 'finishloadingtime'));
            timesRequest.input('totalprocessloadingtime', db.sql.VarChar(8), validateAndFormatTime(totalprocessloadingtime, 'totalprocessloadingtime'));
            timesRequest.input('actualwaitloadingtime', db.sql.VarChar(8), validateAndFormatTime(actualwaitloadingtime, 'actualwaitloadingtime'));
            timesRequest.input('starttimbangneto', db.sql.VarChar(8), validateAndFormatTime(starttimbangneto, 'starttimbangneto'));
            timesRequest.input('finishtimbangneto', db.sql.VarChar(8), validateAndFormatTime(finishtimbangneto, 'finishtimbangneto'));
            timesRequest.input('waitingfortimbangneto', db.sql.VarChar(8), validateAndFormatTime(waitingfortimbangneto, 'waitingfortimbangneto'));
            timesRequest.input('totalprocesstimbangneto', db.sql.VarChar(8), validateAndFormatTime(totalprocesstimbangneto, 'totalprocesstimbangneto'));
            timesRequest.input('waitingforexit', db.sql.VarChar(8), validateAndFormatTime(waitingforexit, 'waitingforexit'));
            timesRequest.input('totaltruckcompletiontime', db.sql.VarChar(8), validateAndFormatTime(totaltruckcompletiontime, 'totaltruckcompletiontime'));
            timesRequest.input('exittime', db.sql.DateTime2, exittime || null);

            const timesQuery = `
                INSERT INTO truck_times (
                    truck_id, cycle_number, arrivaltime, exittime, waitingfortimbang, starttimbang, finishtimbang, totalprocesstimbang,
                    runtohpc, waitingforarrivalhpc, entryhpc, totalwaitingarrival,
                    runtopt, waitingforarrivalpt, entrypt,
                    startloadingtime, finishloadingtime, totalprocessloadingtime, actualwaitloadingtime,
                    starttimbangneto, finishtimbangneto, waitingfortimbangneto, totalprocesstimbangneto,
                    waitingforexit, totaltruckcompletiontime
                ) VALUES (
                    @truck_id, @cycle_number, @arrivaltime, @exittime, @waitingfortimbang, @starttimbang, @finishtimbang, @totalprocesstimbang,
                    @runtohpc, @waitingforarrivalhpc, @entryhpc, @totalwaitingarrival,
                    @runtopt, @waitingforarrivalpt, @entrypt,
                    @startloadingtime, @finishloadingtime, @totalprocessloadingtime, @actualwaitloadingtime,
                    @starttimbangneto, @finishtimbangneto, @waitingfortimbangneto, @totalprocesstimbangneto,
                    @waitingforexit, @totaltruckcompletiontime
                )
            `;
            await timesRequest.query(timesQuery);

            // ===== 4. INSERT TRUCK_PHOTOS TABLE =====
            const photosRequest = transaction.request();
            photosRequest.input('truck_id', db.sql.Int, truckId);
            photosRequest.input('driver_photo', db.sql.VarChar, savedImages.driver_photo);
            photosRequest.input('sim_photo', db.sql.VarChar, savedImages.sim_photo);
            photosRequest.input('stnk_photo', db.sql.VarChar, savedImages.stnk_photo);

            const photosQuery = `
                INSERT INTO truck_photos (truck_id, driver_photo, sim_photo, stnk_photo)
                VALUES (@truck_id, @driver_photo, @sim_photo, @stnk_photo)
            `;
            await photosRequest.query(photosQuery);

            // ===== 5. SELECT NEWLY CREATED TRUCK =====
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
            const newTruck = selectResult.recordset[0];
            // Commit transaction
            await transaction.commit();
            return {
                success: true,
                message: 'Truck created successfully',
                data: newTruck
            };
        }
        catch (error) {
            await transaction.rollback();
            return ({ message: 'Error Adding Trucks', error: error.message})
        }
    }
}
export default truckAddServices;