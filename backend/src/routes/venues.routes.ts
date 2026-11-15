import { Router } from 'express';
import {
  getVenues,
  getVenueBySlug,
  getVenueSlots,
  getSports,
  getAreas,
  addVenueReview
} from '../controllers/venues.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', getVenues);
router.get('/sports/list', getSports);
router.get('/areas/list', getAreas);
router.get('/:id/slots', getVenueSlots);
router.get('/:slug', getVenueBySlug);

// Allow posting review (with optional auth)
router.post('/:id/reviews', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) return authenticateToken(req, res, next);
  next();
}, addVenueReview);

export default router;
