import { Request, Response } from 'express';
import { store } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { Review } from '../types';

export const getVenues = (req: Request, res: Response): void => {
  const sport = req.query.sport as string | undefined;
  const area = req.query.area as string | undefined;
  const search = req.query.search as string | undefined;
  const sort = req.query.sort as string | undefined;

  const venues = store.getVenues({ sport, area, search, sort });
  res.json({ success: true, count: venues.length, data: venues });
};

export const getVenueBySlug = (req: Request, res: Response): void => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const venue = store.getVenueBySlug(slug);

  if (!venue) {
    res.status(404).json({ success: false, error: 'Venue not found' });
    return;
  }

  const reviews = store.getVenueReviews(venue.id);
  res.json({ success: true, data: { ...venue, reviews } });
};

export const getVenueSlots = (req: Request, res: Response): void => {
  const venueId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const venue = store.getVenueById(venueId);
  if (!venue) {
    res.status(404).json({ success: false, error: 'Venue not found' });
    return;
  }

  const slots = store.getVenueSlots(venueId, date);
  res.json({ success: true, venueId, date, data: slots });
};

export const getSports = (_req: Request, res: Response): void => {
  const sports = store.getSports();
  res.json({ success: true, data: sports });
};

export const getAreas = (_req: Request, res: Response): void => {
  const venues = store.getVenues();
  const areas = Array.from(new Set(venues.map(v => v.area)));
  res.json({ success: true, data: areas });
};

export const addVenueReview = (req: AuthenticatedRequest, res: Response): void => {
  const venueId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { rating, comment, authorName } = req.body;

  if (!rating || !comment) {
    res.status(400).json({ success: false, error: 'Rating and comment are required' });
    return;
  }

  const venue = store.getVenueById(venueId);
  if (!venue) {
    res.status(404).json({ success: false, error: 'Venue not found' });
    return;
  }

  const newReview: Review = {
    id: `rev_${Date.now()}`,
    venueId,
    userId: req.userId || 'usr_player_1',
    authorName: authorName || req.userEmail || 'Player from Kurnool',
    rating: Number(rating),
    comment,
    createdAt: new Date().toISOString()
  };

  const created = store.addReview(newReview);
  res.status(201).json({
    success: true,
    message: 'Review posted successfully',
    data: created,
    updatedVenueRating: venue.rating
  });
};
