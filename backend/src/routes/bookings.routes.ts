import { Router } from 'express';
import { createBooking, getMyBookings, cancelBooking } from '../controllers/bookings.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Allow booking creation with or without token (pass-through for guest bookings)
router.post('/', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    return authenticateToken(req, res, next);
  }
  next();
}, createBooking);

router.get('/my', authenticateToken, getMyBookings);
router.put('/:id/cancel', authenticateToken, cancelBooking);

export default router;
