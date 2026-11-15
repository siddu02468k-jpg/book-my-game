import { Response } from 'express';
import { store } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { Venue } from '../types';

export const getOwnerVenues = (req: AuthenticatedRequest, res: Response): void => {
  const ownerId = req.userId || 'usr_owner_1';
  const venues = store.getOwnerVenues(ownerId);
  res.json({ success: true, count: venues.length, data: venues });
};

export const addOwnerVenue = (req: AuthenticatedRequest, res: Response): void => {
  const ownerId = req.userId || 'usr_owner_1';
  const {
    name,
    area,
    address,
    description,
    pricePerHour,
    weekendPricePerHour,
    openHour = 6,
    closeHour = 23,
    isIndoor = false,
    amenities = [],
    sports = ['cricket'],
    images = []
  } = req.body;

  if (!name || !area || !pricePerHour) {
    res.status(400).json({ success: false, error: 'Name, area, and pricePerHour are required' });
    return;
  }

  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${area.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const newVenue: Venue = {
    id: `ven_${Date.now()}`,
    ownerId,
    name,
    slug,
    city: 'Kurnool',
    area,
    address: address || `${area}, Kurnool`,
    description: description || `Professional sports facility in ${area}, Kurnool.`,
    pricePerHour: Number(pricePerHour),
    weekendPricePerHour: weekendPricePerHour ? Number(weekendPricePerHour) : Number(pricePerHour) + 100,
    openHour: Number(openHour),
    closeHour: Number(closeHour),
    isIndoor: Boolean(isIndoor),
    isFeatured: false,
    isActive: true,
    amenities: Array.isArray(amenities) ? amenities : ['Parking', 'Drinking Water', 'Floodlights'],
    images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop'],
    sports: Array.isArray(sports) ? sports : ['cricket'],
    rating: 5.0,
    reviewCount: 1,
    cancellationPolicy: 'Free cancellation up to 2 hours before the slot time.',
    createdAt: new Date().toISOString()
  };

  const created = store.createVenue(newVenue);
  res.status(201).json({ success: true, message: 'Venue created successfully', data: created });
};

export const toggleVenueActive = (req: AuthenticatedRequest, res: Response): void => {
  const ownerId = req.userId || 'usr_owner_1';
  const venueId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const updated = store.toggleVenueActive(venueId, ownerId);
  if (!updated) {
    res.status(404).json({ success: false, error: 'Venue not found or unauthorized' });
    return;
  }

  res.json({
    success: true,
    message: `Venue ${updated.isActive ? 'activated' : 'paused'} successfully`,
    data: updated
  });
};

export const getOwnerBookings = (req: AuthenticatedRequest, res: Response): void => {
  const ownerId = req.userId || 'usr_owner_1';
  const bookings = store.getOwnerBookings(ownerId);
  res.json({ success: true, count: bookings.length, data: bookings });
};

export const updateBookingStatus = (req: AuthenticatedRequest, res: Response): void => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { status, paymentStatus } = req.body;

  if (!status || !['confirmed', 'completed', 'cancelled'].includes(status)) {
    res.status(400).json({ success: false, error: 'Valid status is required' });
    return;
  }

  const updated = store.updateBookingStatus(id, status, paymentStatus);
  if (!updated) {
    res.status(404).json({ success: false, error: 'Booking not found' });
    return;
  }

  res.json({
    success: true,
    message: `Booking marked as ${status}`,
    data: updated
  });
};

export const verifyPass = (req: AuthenticatedRequest, res: Response): void => {
  const { bookingRef } = req.body;

  if (!bookingRef) {
    res.status(400).json({ success: false, error: 'Booking reference code is required' });
    return;
  }

  const cleanRef = String(bookingRef).trim().toUpperCase();
  const allBookings = store.getUserBookings('usr_player_1').concat(store.getOwnerBookings('usr_owner_1'));
  const found = allBookings.find(b => b.bookingRef.toUpperCase() === cleanRef || b.id === cleanRef);

  if (!found) {
    res.status(404).json({ success: false, error: `Invalid Pass! No booking found for reference ${cleanRef}` });
    return;
  }

  const updated = store.updateBookingStatus(found.id, 'completed', 'paid');
  res.json({
    success: true,
    message: `Pass Verified! Player ${found.playerName} checked in successfully.`,
    data: updated
  });
};

export const becomeOwner = (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.userId || 'usr_player_1';
  const updatedUser = store.updateUserRole(userId, 'owner');

  res.json({
    success: true,
    message: 'Congratulations! Your account is now upgraded to Venue Owner.',
    data: updatedUser
  });
};
