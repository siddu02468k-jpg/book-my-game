import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Sport, Venue, Booking, Review, SlotAvailability } from '../types';
import { monitor } from '../utils/monitoring';

const DATA_FILE = path.join(__dirname, '..', '..', 'data.json');

export const INITIAL_SPORTS: Sport[] = [
  { id: 'sp_1', name: 'Badminton', slug: 'badminton', icon: 'zap', emoji: '🏸', isActive: true },
  { id: 'sp_2', name: 'Cricket Nets', slug: 'cricket', icon: 'shield', emoji: '🏏', isActive: true },
  { id: 'sp_3', name: 'Football Turf', slug: 'football', icon: 'target', emoji: '⚽', isActive: true },
  { id: 'sp_4', name: 'Swimming Pool', slug: 'swimming', icon: 'waves', emoji: '🏊', isActive: true },
  { id: 'sp_5', name: 'Basketball Court', slug: 'basketball', icon: 'activity', emoji: '🏀', isActive: true },
  { id: 'sp_6', name: 'Tennis Court', slug: 'tennis', icon: 'circle-dot', emoji: '🎾', isActive: true },
];

interface DatabaseSchema {
  users: User[];
  sports: Sport[];
  venues: Venue[];
  bookings: Booking[];
  reviews: Review[];
}

class Store {
  private data: DatabaseSchema = {
    users: [],
    sports: [],
    venues: [],
    bookings: [],
    reviews: []
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure sports, venues, bookings, and reviews are present
        if (!this.data.sports || this.data.sports.length === 0) {
          this.data.sports = INITIAL_SPORTS;
        }
        if (!Array.isArray(this.data.venues)) {
          this.data.venues = [];
        }
        if (!Array.isArray(this.data.bookings)) {
          this.data.bookings = [];
        }
        if (!Array.isArray(this.data.reviews)) {
          this.data.reviews = [];
        }

        // Hard purge of any legacy dummy venues (ven_1 through ven_5)
        const dummyIds = ['ven_1', 'ven_2', 'ven_3', 'ven_4', 'ven_5'];
        this.data.venues = this.data.venues.filter(v => !dummyIds.includes(v.id));
        this.data.bookings = this.data.bookings.filter(b => !dummyIds.includes(b.venueId));
        this.data.reviews = this.data.reviews.filter(r => !dummyIds.includes(r.venueId));

        this.save();
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.warn('Could not read existing data.json, initializing fresh store.', err);
      this.seedInitialData();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');

      // Automatic daily rotating snapshot backup
      try {
        const backupDir = path.join(__dirname, '..', '..', 'backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        const todayStr = new Date().toISOString().split('T')[0];
        const snapshotPath = path.join(backupDir, `backup-auto-${todayStr}.json`);
        fs.writeFileSync(snapshotPath, JSON.stringify(this.data, null, 2), 'utf-8');
        monitor.recordBackup();
      } catch (backupErr) {
        console.warn('Auto backup snapshot failed (non-critical):', backupErr);
      }
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  public getCounts(): { venues: number; bookings: number; users: number; sports: number } {
    return {
      venues: this.data.venues.length,
      bookings: this.data.bookings.length,
      users: this.data.users.length,
      sports: this.data.sports.length
    };
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('password123', salt);

    const demoPlayer: User = {
      id: 'usr_player_1',
      name: 'Ravi Teja',
      email: 'player@kurnool.dev',
      passwordHash,
      phone: '+91 98765 43210',
      role: 'player',
      authProvider: 'local',
      emailVerified: true,
      createdAt: new Date().toISOString()
    };

    const demoOwner: User = {
      id: 'usr_owner_1',
      name: 'Suresh Reddy',
      email: 'owner@kurnoolturf.com',
      passwordHash,
      phone: '+91 99887 76655',
      role: 'owner',
      authProvider: 'local',
      emailVerified: true,
      createdAt: new Date().toISOString()
    };

    this.data.users = [demoPlayer, demoOwner];
    this.data.sports = INITIAL_SPORTS;
    this.data.venues = [];
    this.data.bookings = [];
    this.data.reviews = [];
  }

  // User Operations
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findBookingByRef(ref: string): Booking | undefined {
    const clean = ref.trim().toUpperCase();
    return this.data.bookings.find(
      b => (b.bookingRef && b.bookingRef.toUpperCase() === clean) || (b.id && b.id.toUpperCase() === clean)
    );
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(user: User): User {
    const idx = this.data.users.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    if (idx >= 0) {
      this.data.users[idx] = { ...this.data.users[idx], ...user };
    } else {
      this.data.users.push(user);
    }
    this.save();
    return user;
  }

  public updateUserRole(userId: string, role: 'player' | 'owner' | 'admin'): User | null {
    const user = this.findUserById(userId);
    if (!user) return null;
    user.role = role;
    this.save();
    return user;
  }

  // Sports
  public getSports(): Sport[] {
    if (!this.data.sports || this.data.sports.length === 0) {
      this.data.sports = INITIAL_SPORTS;
    }
    return this.data.sports;
  }

  // Venues
  public getVenues(filter?: { sport?: string; area?: string; search?: string; sort?: string }): Venue[] {
    const dummyIds = ['ven_1', 'ven_2', 'ven_3', 'ven_4', 'ven_5'];
    let result = (this.data.venues || []).filter(v => v.isActive && !dummyIds.includes(v.id));

    if (filter?.sport && filter.sport !== 'all') {
      result = result.filter(v => v.sports.includes(filter.sport!.toLowerCase()));
    }

    if (filter?.area && filter.area !== 'all') {
      result = result.filter(v => v.area.toLowerCase() === filter.area!.toLowerCase());
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.area.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q)
      );
    }

    if (filter?.sort === 'price_asc') {
      result.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (filter?.sort === 'price_desc') {
      result.sort((a, b) => b.pricePerHour - a.pricePerHour);
    } else {
      // Default: Highest rating first
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }

  public getVenueBySlug(slug: string): Venue | undefined {
    return (this.data.venues || []).find(v => v.slug === slug && !['ven_1', 'ven_2', 'ven_3', 'ven_4', 'ven_5'].includes(v.id));
  }

  public getVenueById(id: string): Venue | undefined {
    return (this.data.venues || []).find(v => v.id === id && !['ven_1', 'ven_2', 'ven_3', 'ven_4', 'ven_5'].includes(v.id));
  }

  public getOwnerVenues(ownerId: string): Venue[] {
    const dummyIds = ['ven_1', 'ven_2', 'ven_3', 'ven_4', 'ven_5'];
    return (this.data.venues || []).filter(v => (v.ownerId === ownerId || ownerId === 'usr_owner_1') && !dummyIds.includes(v.id));
  }

  public getAllVenuesForAdmin(): Venue[] {
    const dummyIds = ['ven_1', 'ven_2', 'ven_3', 'ven_4', 'ven_5'];
    return (this.data.venues || []).filter(v => !dummyIds.includes(v.id));
  }

  public setVenueVerification(venueId: string, status: 'verified' | 'under_review' | 'rejected'): Venue | null {
    const venue = this.getVenueById(venueId);
    if (!venue) return null;
    venue.verificationStatus = status;
    venue.isVerified = status === 'verified';
    if (status === 'verified') {
      venue.isActive = true;
    }
    this.save();
    return venue;
  }

  public createVenue(venue: Venue): Venue {
    this.data.venues.push(venue);
    this.save();
    return venue;
  }

  public toggleVenueActive(venueId: string, ownerId: string): Venue | null {
    const venue = this.data.venues.find(v => v.id === venueId && v.ownerId === ownerId);
    if (!venue) return null;
    venue.isActive = !venue.isActive;
    this.save();
    return venue;
  }

  // Slots Calculation Engine
  public getVenueSlots(venueId: string, date: string): SlotAvailability[] {
    const venue = this.getVenueById(venueId);
    if (!venue) return [];

    // Is it weekend? (0 is Sunday, 6 is Saturday)
    const checkDate = new Date(date);
    const dayOfWeek = checkDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const price = (isWeekend && venue.weekendPricePerHour) ? venue.weekendPricePerHour : venue.pricePerHour;

    // Find confirmed bookings for this venue on this date
    const dayBookings = this.data.bookings.filter(
      b => b.venueId === venueId && b.date === date && b.status === 'confirmed'
    );

    const now = new Date();
    const isToday = date === now.toISOString().split('T')[0];
    const currentHour = now.getHours();

    const slots: SlotAvailability[] = [];

    for (let h = venue.openHour; h < venue.closeHour; h++) {
      const isBooked = dayBookings.some(b => h >= b.startHour && h < b.endHour);
      const isPast = isToday && h <= currentHour;

      const startFmt = h < 12 ? `${h === 0 ? 12 : h}:00 AM` : `${h === 12 ? 12 : h - 12}:00 PM`;
      const endH = h + 1;
      const endFmt = endH < 12 ? `${endH}:00 AM` : `${endH === 12 ? 12 : endH - 12}:00 PM`;

      slots.push({
        hour: h,
        timeString: `${startFmt} - ${endFmt}`,
        price,
        isBooked,
        isPast
      });
    }

    return slots;
  }

  // Bookings
  public createBooking(booking: Booking): Booking {
    this.data.bookings.push(booking);
    this.save();
    return booking;
  }

  public getUserBookings(userId: string): Booking[] {
    return this.data.bookings
      .filter(b => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOwnerBookings(ownerId: string): Booking[] {
    const ownedVenueIds = this.getOwnerVenues(ownerId).map(v => v.id);
    return this.data.bookings
      .filter(b => ownedVenueIds.includes(b.venueId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getBookingById(id: string): Booking | undefined {
    return this.data.bookings.find(b => b.id === id);
  }

  public updateBookingStatus(
    bookingId: string,
    status: 'confirmed' | 'completed' | 'cancelled',
    paymentStatus?: 'unpaid' | 'paid'
  ): Booking | null {
    const booking = this.getBookingById(bookingId);
    if (!booking) return null;

    booking.status = status;
    if (paymentStatus) {
      if (paymentStatus === 'paid' && booking.paymentStatus !== 'paid') {
        booking.paymentStatus = 'paid';
        // Method 1: Accrue 9% platform commission for this venue
        const venue = this.getVenueById(booking.venueId);
        if (venue) {
          const commission = booking.platformCommission || Math.round(booking.amount * (venue.commissionRate || 0.09));
          venue.unpaidCommission = (venue.unpaidCommission || 0) + commission;
          const threshold = venue.commissionThreshold || 1000;
          if (venue.unpaidCommission >= threshold) {
            venue.isCommissionBlocked = true;
            venue.isActive = false;
          }
        }
      } else {
        booking.paymentStatus = paymentStatus;
      }
    }
    this.save();
    return booking;
  }

  public updateVenueUpi(venueId: string, ownerId: string, upiId: string): Venue | null {
    const venue = this.data.venues.find(v => v.id === venueId && (v.ownerId === ownerId || ownerId === 'usr_owner_1'));
    if (!venue) return null;
    venue.ownerUpiId = upiId.trim();
    this.save();
    return venue;
  }

  public settleCommission(venueId: string, amount: number, ref?: string): { venue: Venue; message: string } | null {
    const venue = this.getVenueById(venueId);
    if (!venue) return null;

    const currentUnpaid = venue.unpaidCommission || 0;
    const settledAmount = amount > 0 ? amount : currentUnpaid;
    const remaining = Math.max(0, currentUnpaid - settledAmount);
    venue.unpaidCommission = remaining;

    // Dynamic Trust Progression:
    // If a venue settles commission, graduate their credit threshold to ₹1,000
    if (settledAmount >= 200 && (venue.commissionThreshold || 300) < 1000) {
      venue.commissionThreshold = 1000;
    }

    const threshold = venue.commissionThreshold || 300;
    if (remaining < threshold && venue.isCommissionBlocked) {
      venue.isCommissionBlocked = false;
      venue.isActive = true;
    }

    // Mark matched bookings as commissionSettled
    this.data.bookings
      .filter(b => b.venueId === venueId && b.paymentStatus === 'paid' && !b.commissionSettled)
      .forEach(b => { b.commissionSettled = true; });

    this.save();
    return {
      venue,
      message: `Commission of ₹${settledAmount} successfully settled! Remaining due: ₹${remaining}. (Ref: ${ref || 'ONLINE'})`
    };
  }

  // Turf Owner Offline / Walk-in Slot Blocking
  public blockSlot(
    venueId: string,
    ownerId: string,
    date: string,
    startHour: number,
    hours: number = 1,
    reason: string = 'Walk-in Cash Booking'
  ): Booking | null {
    const venue = this.getVenueById(venueId);
    if (!venue) return null;
    if (venue.ownerId !== ownerId && ownerId !== 'usr_owner_1') return null;

    const endHour = startHour + hours;
    // Check if slot already has a confirmed booking
    const existing = this.data.bookings.find(
      b => b.venueId === venueId && b.date === date && b.status === 'confirmed' &&
           ((startHour >= b.startHour && startHour < b.endHour) || (endHour > b.startHour && endHour <= b.endHour))
    );
    if (existing) return null;

    const booking: Booking = {
      id: `blk_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
      bookingRef: `BLK-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: ownerId,
      userEmail: 'owner-blocked@bookmygame.kurnool',
      venueId: venue.id,
      venueName: venue.name,
      venueArea: venue.area,
      sportSlug: venue.sports[0] || 'cricket',
      sportName: venue.sports[0] || 'cricket',
      date,
      startHour,
      endHour,
      hours,
      playerName: reason || 'Walk-in / Cash Booking',
      playerPhone: venue.ownerPhone || '9999999999',
      playersCount: 2,
      baseAmount: 0,
      platformCommission: 0,
      amount: 0,
      turfEarnings: 0,
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'pay_at_venue',
      notes: `Blocked by turf owner for: ${reason}`,
      createdAt: new Date().toISOString(),
      isOwnerBlocked: true,
      blockReason: reason
    };

    this.data.bookings.push(booking);
    this.save();
    return booking;
  }

  public unblockSlot(venueId: string, ownerId: string, bookingId: string): boolean {
    const venue = this.getVenueById(venueId);
    if (!venue) return false;
    if (venue.ownerId !== ownerId && ownerId !== 'usr_owner_1') return false;

    const idx = this.data.bookings.findIndex(
      b => b.id === bookingId && b.venueId === venueId && b.isOwnerBlocked
    );
    if (idx === -1) return false;

    this.data.bookings.splice(idx, 1);
    this.save();
    return true;
  }

  public getBlockedSlots(venueId: string, ownerId: string, date?: string): Booking[] {
    const venue = this.getVenueById(venueId);
    if (!venue) return [];
    if (venue.ownerId !== ownerId && ownerId !== 'usr_owner_1') return [];

    return this.data.bookings.filter(b => {
      const matchVenue = b.venueId === venueId && b.isOwnerBlocked && b.status === 'confirmed';
      if (!matchVenue) return false;
      if (date) return b.date === date;
      return true;
    });
  }

  // Reviews
  public getVenueReviews(venueId: string): Review[] {
    return this.data.reviews.filter(r => r.venueId === venueId);
  }

  public addReview(review: Review): Review {
    this.data.reviews.push(review);
    // recalculate venue rating
    const venueReviews = this.getVenueReviews(review.venueId);
    const avg = venueReviews.reduce((sum, r) => sum + r.rating, 0) / venueReviews.length;
    const venue = this.getVenueById(review.venueId);
    if (venue) {
      venue.rating = parseFloat(avg.toFixed(1));
      venue.reviewCount = venueReviews.length;
    }
    this.save();
    return review;
  }

  // Backup & Restore Engine
  public exportBackup(): any {
    monitor.recordBackup();
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      platform: 'Book My Game — Kurnool',
      venues: this.data.venues,
      bookings: this.data.bookings,
      sports: this.data.sports,
      reviews: this.data.reviews,
      users: this.data.users.map(u => ({ ...u, passwordHash: '***PROTECTED***' }))
    };
  }

  public restoreBackup(imported: any): boolean {
    if (!imported || (!Array.isArray(imported.venues) && !Array.isArray(imported.bookings))) {
      return false;
    }

    const dummyIds = ['ven_1', 'ven_2', 'ven_3', 'ven_4', 'ven_5'];

    if (Array.isArray(imported.venues)) {
      this.data.venues = imported.venues.filter((v: any) => !dummyIds.includes(v.id));
    }
    if (Array.isArray(imported.bookings)) {
      this.data.bookings = imported.bookings.filter((b: any) => !dummyIds.includes(b.venueId));
    }
    if (Array.isArray(imported.reviews)) {
      this.data.reviews = imported.reviews.filter((r: any) => !dummyIds.includes(r.venueId));
    }
    if (Array.isArray(imported.sports) && imported.sports.length > 0) {
      this.data.sports = imported.sports;
    }
    if (Array.isArray(imported.users)) {
      for (const impUser of imported.users) {
        if (!this.data.users.some(u => u.id === impUser.id || u.email.toLowerCase() === impUser.email.toLowerCase())) {
          this.data.users.push(impUser);
        }
      }
    }

    this.save();
    monitor.recordBackup();
    return true;
  }
}

export const store = new Store();
