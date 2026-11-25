import { Router } from 'express';
import {
  getOwnerVenues,
  addOwnerVenue,
  toggleVenueActive,
  getOwnerBookings,
  updateBookingStatus,
  verifyPass,
  becomeOwner,
  updateVenueUpi,
  settleCommission,
  exportBackup,
  restoreBackup,
  getSystemHealth,
  blockVenueSlot,
  unblockVenueSlot,
  getBlockedVenueSlots,
  getAdminVenues,
  verifyVenueByAdmin
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
router.put('/venues/:id/upi', updateVenueUpi);
router.post('/venues/:id/settle-commission', settleCommission);
router.post('/venues/:id/block-slot', blockVenueSlot);
router.post('/venues/:id/unblock-slot', unblockVenueSlot);
router.get('/venues/:id/blocked-slots', getBlockedVenueSlots);
router.get('/bookings', getOwnerBookings);
router.put('/bookings/:id/status', updateBookingStatus);
router.post('/verify-pass', verifyPass);
router.post('/become', becomeOwner);
router.get('/backup/export', exportBackup);
router.post('/backup/restore', restoreBackup);
router.get('/system-health', getSystemHealth);

// Platform Admin Verification & Superuser Management
router.get('/admin/venues', getAdminVenues);
router.put('/admin/venues/:id/verify', verifyVenueByAdmin);

export default router;
