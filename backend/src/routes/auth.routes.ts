import { Router } from 'express';
import { register, login, googleAuth, getProfile } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/google', authRateLimiter, googleAuth);
router.get('/me', authenticateToken, getProfile);

export default router;
