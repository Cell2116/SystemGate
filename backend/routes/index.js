import express from 'express'
const router = express.Router();
import authRoutes from '../routes/auth.js'
import truckRoutes from '../routes/trucks.js'

router.use('/api/trucks', truckRoutes);
router.use('/auth', authRoutes);

export default router;