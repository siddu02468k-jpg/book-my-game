import { Router } from 'express';
import { register, login, googleAuth, getProfile, sendOtp, verifyOtp, resetPassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/send-otp', authRateLimiter, sendOtp);
router.post('/verify-otp', authRateLimiter, verifyOtp);
router.post('/reset-password', authRateLimiter, resetPassword);
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/google', authRateLimiter, googleAuth);
router.get('/me', authenticateToken, getProfile);

export default router;
