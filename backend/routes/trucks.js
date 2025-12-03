import express from 'express';
import truckControllers from '../controllers/truckControllers.js'
const router = express.Router();

router.get('/history', truckControllers.getHistory);
router.get('/', truckControllers.getTruck);
router.get('/actualqueue/:id', truckControllers.getTruckActualQueue);
router.delete('/:id', truckControllers.deleteTruck);
//one more delete hasnt been applied check my server.txt
router.get('/export', truckControllers.exportTruck);
router.post('/', truckControllers.createTruck);
router.put('/:id', truckControllers.updateTrucks);

export default router;  