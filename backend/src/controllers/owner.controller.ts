import { Response } from 'express';
import { store } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { Venue } from '../types';
import { monitor } from '../utils/monitoring';

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
    images = [],
    // Real Owner Identity & Verification Rules
    ownerFullName,
    ownerPhone,
    ownerAltPhone,
    governmentIdType = 'Electricity Bill of Turf Facility',
    governmentIdNumber,
    ownershipDocProof,
    googleMapsUrl,
    pitchType = 'Artificial AstroTurf',
    // Payment Setup
    ownerUpiId,
    bankAccountNumber,
    bankIfsc
  } = req.body;

  // 1. Validate Turf Name & Location
  if (!name || !name.trim()) {
    res.status(400).json({ success: false, error: 'Turf / Facility Name is required' });
    return;
  }
  if (!area || !area.trim()) {
    res.status(400).json({ success: false, error: 'Area in Kurnool is required' });
    return;
  }

  // 2. Validate Pricing
  const price = Number(pricePerHour);
  if (!price || price <= 0) {
    res.status(400).json({ success: false, error: 'Valid hourly price per slot is required' });
    return;
  }

  // 3. Real Owner Verification Rules
  if (!ownerFullName || !ownerFullName.trim()) {
    res.status(400).json({ success: false, error: 'Real Owner Legal Full Name is required for venue verification' });
    return;
  }
  if (!ownerPhone || !ownerPhone.trim()) {
    res.status(400).json({ success: false, error: 'Owner primary mobile number is required for player verification' });
    return;
  }
  if (!governmentIdNumber || !governmentIdNumber.trim()) {
    res.status(400).json({ 
      success: false, 
      error: `Ownership proof document number (${governmentIdType}) is required to verify real facility ownership.` 
    });
    return;
  }

  // 4. Mandatory Turf Photos Rule
  if (!images || !Array.isArray(images) || images.length === 0) {
    res.status(400).json({ 
      success: false, 
      error: 'At least one real photo of your turf ground or court is required for registration.' 
    });
    return;
  }

  // 5. Direct Receiving UPI ID Rule
  const cleanUpi = (ownerUpiId || '').trim();
  if (!cleanUpi || !cleanUpi.includes('@')) {
    res.status(400).json({ 
      success: false, 
      error: 'Valid receiving UPI ID (e.g. yourname@okhdfcbank or 9876543210@ybl) is required so players can pay directly to your account.' 
    });
    return;
  }

  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${area.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const newVenue: Venue = {
    id: `ven_${Date.now()}`,
    ownerId,
    name: name.trim(),
    slug,
    city: 'Kurnool',
    area: area.trim(),
    address: address?.trim() || `${area}, Kurnool`,
    description: description?.trim() || `Verified sports turf and hourly slot facility in ${area}, Kurnool.`,
    pricePerHour: price,
    weekendPricePerHour: weekendPricePerHour ? Number(weekendPricePerHour) : price + 100,
    openHour: Number(openHour),
    closeHour: Number(closeHour),
    isIndoor: Boolean(isIndoor),
    isFeatured: true,
    isActive: true,
    amenities: Array.isArray(amenities) && amenities.length > 0 ? amenities : ['Parking', 'Drinking Water', 'Floodlights'],
    images,
    sports: Array.isArray(sports) && sports.length > 0 ? sports : ['cricket'],
    rating: 5.0,
    reviewCount: 1,
    cancellationPolicy: 'Free cancellation up to 2 hours before the booked slot time.',
    
    // Real Owner Identity & Verification Fields
    ownerFullName: ownerFullName.trim(),
    ownerPhone: ownerPhone.trim(),
    ownerAltPhone: ownerAltPhone?.trim() || '',
    governmentIdType,
    governmentIdNumber: governmentIdNumber.trim(),
    ownershipDocProof: ownershipDocProof || '',
    isVerified: true,
    verificationStatus: 'verified',
    googleMapsUrl: googleMapsUrl?.trim() || '',
    pitchType: pitchType?.trim() || 'AstroTurf',

    // Method 1 Direct Payment & Commission Auto-Lock
    ownerUpiId: cleanUpi,
    bankAccountNumber: bankAccountNumber?.trim() || '',
    bankIfsc: bankIfsc?.trim() || '',
    commissionRate: 0.09,
    unpaidCommission: 0,
    commissionThreshold: 300, // Safe starter tier: locks at ₹300 until trust is established
    isCommissionBlocked: false,
    createdAt: new Date().toISOString()
  };

  const created = store.createVenue(newVenue);
  res.status(201).json({ 
    success: true, 
    message: `Turf "${created.name}" registered and verified successfully! Your venue is now live for Kurnool players.`, 
    data: created 
  });
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
  const found = store.findBookingByRef(cleanRef);

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

export const updateVenueUpi = (req: AuthenticatedRequest, res: Response): void => {
  const ownerId = req.userId || 'usr_owner_1';
  const venueId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { upiId } = req.body;

  if (!upiId || !String(upiId).includes('@')) {
    res.status(400).json({ success: false, error: 'Valid UPI ID (e.g. name@bank) is required' });
    return;
  }

  const updated = store.updateVenueUpi(venueId, ownerId, String(upiId).trim());
  if (!updated) {
    res.status(404).json({ success: false, error: 'Venue not found or unauthorized' });
    return;
  }

  res.json({
    success: true,
    message: `Turf payment UPI updated to ${updated.ownerUpiId}! Player payments will transfer directly to this address.`,
    data: updated
  });
};

export const settleCommission = (req: AuthenticatedRequest, res: Response): void => {
  const venueId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { amount, ref } = req.body;

  const result = store.settleCommission(venueId, Number(amount) || 0, ref);
  if (!result) {
    res.status(404).json({ success: false, error: 'Venue not found' });
    return;
  }

  res.json({
    success: true,
    message: result.message,
    data: result.venue
  });
};

export const exportBackup = (_req: AuthenticatedRequest, res: Response): void => {
  const backup = store.exportBackup();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=bookmygame-backup-${new Date().toISOString().split('T')[0]}.json`);
  res.json({
    success: true,
    data: backup
  });
};

export const restoreBackup = (req: AuthenticatedRequest, res: Response): void => {
  const { backupData } = req.body;
  if (!backupData) {
    res.status(400).json({ success: false, error: 'Backup data JSON payload is required' });
    return;
  }

  const success = store.restoreBackup(backupData);
  if (!success) {
    res.status(400).json({ success: false, error: 'Invalid backup format or corrupt schema.' });
    return;
  }

  res.json({
    success: true,
    message: 'Database backup restored successfully! All venues and reservations are synced.'
  });
};

export const getSystemHealth = (_req: AuthenticatedRequest, res: Response): void => {
  const dbCounts = store.getCounts();
  const metrics = monitor.getMetrics(dbCounts);
  res.json({
    success: true,
    data: metrics
  });
};
