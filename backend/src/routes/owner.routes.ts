import { Router } from 'express';
import {
  getOwnerVenues,
  addOwnerVenue,
  toggleVenueActive,
  getOwnerBookings,
  updateBookingStatus,
  verifyPass,
  becomeOwner
} from '../controllers/owner.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    return authenticateToken(req, res, next);
  }
  next();
});

router.get('/venues', getOwnerVenues);
router.post('/venues', addOwnerVenue);
router.put('/venues/:id/toggle', toggleVenueActive);
router.get('/bookings', getOwnerBookings);
router.put('/bookings/:id/status', updateBookingStatus);
router.post('/verify-pass', verifyPass);
router.post('/become', becomeOwner);

export default router;
