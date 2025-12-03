import express from 'express'
import authController from '../controllers/authControllers.js';
import authenticateToken from '../middleware/authenticateToken.js'
const router = express.Router();

router.post('/login', authController.authLogin);
router.get('/me', authenticateToken, authController.getMe);
router.post('/logout', authController.authLogout);
router.post('/register', authController.authRegister);

export default router;