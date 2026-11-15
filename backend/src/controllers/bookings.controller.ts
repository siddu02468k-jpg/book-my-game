import { Response } from 'express';
import { store } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { Booking } from '../types';

export const createBooking = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const {
      venueId,
      sportSlug,
      date,
      startHour,
      hours = 1,
      playerName,
      playerPhone,
      playersCount = 2,
      notes
    } = req.body;

    if (!venueId || !sportSlug || !date || startHour === undefined || !playerName || !playerPhone) {
      res.status(400).json({
        success: false,
        error: 'Missing required booking fields (venueId, sportSlug, date, startHour, playerName, playerPhone)'
      });
      return;
    }

    const venue = store.getVenueById(venueId);
    if (!venue) {
      res.status(404).json({ success: false, error: 'Venue does not exist' });
      return;
    }

    const endHour = startHour + hours;

    // Check operating hours boundary
    if (startHour < venue.openHour || endHour > venue.closeHour) {
      res.status(400).json({
        success: false,
        error: `Selected time outside venue operating hours (${venue.openHour}:00 - ${venue.closeHour}:00)`
      });
      return;
    }

    // Double-booking check: verify all requested hours are free
    const slots = store.getVenueSlots(venueId, date);
    for (let h = startHour; h < endHour; h++) {
      const slot = slots.find(s => s.hour === h);
      if (!slot) {
        res.status(400).json({ success: false, error: `Hour ${h}:00 is not a valid slot` });
        return;
      }
      if (slot.isBooked) {
        res.status(409).json({
          success: false,
          error: `Slot ${slot.timeString} is already booked. Please choose another time.`
        });
        return;
      }
      if (slot.isPast) {
        res.status(400).json({
          success: false,
          error: `Slot ${slot.timeString} has already passed.`
        });
        return;
      }
    }

    // Calculate rate
    const checkDate = new Date(date);
    const dayOfWeek = checkDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const hourlyRate = (isWeekend && venue.weekendPricePerHour) ? venue.weekendPricePerHour : venue.pricePerHour;
    const totalAmount = hourlyRate * hours;

    // Generate reference ID e.g. BMG-829103
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const bookingRef = `BMG-${randomCode}`;

    const newBooking: Booking = {
      id: `bkg_${Date.now()}`,
      bookingRef,
      userId: req.userId || 'guest_user',
      userEmail: req.userEmail || 'guest@bookmygame.in',
      venueId: venue.id,
      venueName: venue.name,
      venueArea: venue.area,
      sportSlug,
      sportName: sportSlug.charAt(0).toUpperCase() + sportSlug.slice(1),
      date,
      startHour,
      endHour,
      hours,
      playerName,
      playerPhone,
      playersCount: Number(playersCount),
      amount: totalAmount,
      status: 'confirmed',
      paymentStatus: 'unpaid',
      paymentMethod: 'pay_at_venue',
      notes,
      createdAt: new Date().toISOString()
    };

    const saved = store.createBooking(newBooking);

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully! Pay ₹' + totalAmount + ' at the venue.',
      data: saved
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error creating booking' });
  }
};

export const getMyBookings = (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.userId || 'usr_player_1';
  const bookings = store.getUserBookings(userId);
  res.json({ success: true, count: bookings.length, data: bookings });
};

export const cancelBooking = (req: AuthenticatedRequest, res: Response): void => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const booking = store.getBookingById(id);

  if (!booking) {
    res.status(404).json({ success: false, error: 'Booking not found' });
    return;
  }

  // Check ownership if user is authenticated
  if (req.userId && booking.userId !== req.userId && req.userId !== 'usr_owner_1') {
    res.status(403).json({ success: false, error: 'Unauthorized to cancel this booking' });
    return;
  }

  const updated = store.updateBookingStatus(id, 'cancelled');
  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    data: updated
  });
};
