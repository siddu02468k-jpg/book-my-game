import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Sport, Venue, Booking, Review, SlotAvailability } from '../types';

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
        // Ensure sports and venues are present
        if (!this.data.sports || this.data.sports.length === 0) {
          this.data.sports = INITIAL_SPORTS;
        }
        if (!this.data.venues || this.data.venues.length === 0) {
          this.seedInitialData();
        }
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
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
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
      createdAt: new Date().toISOString()
    };

    const demoOwner: User = {
      id: 'usr_owner_1',
      name: 'Suresh Reddy',
      email: 'owner@kurnoolturf.com',
      passwordHash,
      phone: '+91 99887 76655',
      role: 'owner',
      createdAt: new Date().toISOString()
    };

    const initialVenues: Venue[] = [
      {
        id: 'ven_1',
        ownerId: demoOwner.id,
        name: 'Spartan Sports Arena',
        slug: 'spartan-sports-arena-budhawarpet',
        city: 'Kurnool',
        area: 'Budhawarpet',
        address: 'Opp. Indoor Stadium, Near Collectorate Road, Budhawarpet, Kurnool',
        description: 'Premier multi-sport sports complex featuring 4 BWF standard synthetic badminton courts and 2 floodlit box cricket nets with professional turf.',
        pricePerHour: 400,
        weekendPricePerHour: 500,
        openHour: 6,
        closeHour: 23,
        isIndoor: true,
        isFeatured: true,
        isActive: true,
        amenities: ['Parking', 'Drinking Water', 'Changing Rooms', 'Floodlights', 'Equipment Rental', 'Showers'],
        images: [
          'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop'
        ],
        sports: ['badminton', 'cricket'],
        rating: 4.8,
        reviewCount: 38,
        cancellationPolicy: 'Free cancellation up to 2 hours before the booked slot time.',
        lat: 15.8281,
        lng: 78.0373,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ven_2',
        ownerId: demoOwner.id,
        name: 'Kurnool Champions Turf',
        slug: 'kurnool-champions-turf-joharapuram',
        city: 'Kurnool',
        area: 'Joharapuram',
        address: 'Joharapuram Main Road, Beside Reliance Smart, Kurnool',
        description: 'FIFA-grade 7-a-side artificial football turf and international standard box cricket arena. High-lumen LED floodlights for night tournaments.',
        pricePerHour: 800,
        weekendPricePerHour: 950,
        openHour: 6,
        closeHour: 24,
        isIndoor: false,
        isFeatured: true,
        isActive: true,
        amenities: ['Parking', 'Drinking Water', 'Changing Rooms', 'Floodlights', 'Seating Dugouts'],
        images: [
          'https://images.unsplash.com/photo-1529900241929-5ed537dd4966?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop'
        ],
        sports: ['football', 'cricket'],
        rating: 4.9,
        reviewCount: 52,
        cancellationPolicy: 'Free cancellation up to 3 hours before start time.',
        lat: 15.8344,
        lng: 78.0498,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ven_3',
        ownerId: demoOwner.id,
        name: 'Royal Aquatic & Tennis Club',
        slug: 'royal-aquatic-tennis-b-camp',
        city: 'Kurnool',
        area: 'B-Camp',
        address: 'Near Old Bus Stand Road, B-Camp, Kurnool',
        description: 'Olympic-size clean sanitized swimming pool with certified lifeguards, alongside 2 clay tennis courts. Dedicated coaching slots available.',
        pricePerHour: 300,
        weekendPricePerHour: 350,
        openHour: 6,
        closeHour: 21,
        isIndoor: false,
        isFeatured: true,
        isActive: true,
        amenities: ['Showers', 'Lockers', 'Parking', 'Coaches Available', 'Drinking Water'],
        images: [
          'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&auto=format&fit=crop'
        ],
        sports: ['swimming', 'tennis'],
        rating: 4.7,
        reviewCount: 29,
        cancellationPolicy: 'Free cancellation up to 2 hours before the slot.',
        lat: 15.8200,
        lng: 78.0300,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ven_4',
        ownerId: demoOwner.id,
        name: 'Smashers Badminton Academy',
        slug: 'smashers-badminton-gayatri-estate',
        city: 'Kurnool',
        area: 'Gayatri Estate',
        address: 'Plot 42, 2nd Cross, Gayatri Estate, Kurnool',
        description: 'Air-conditioned wooden-floor badminton courts with Yonex anti-glare lighting and non-marking shoe rental on-site.',
        pricePerHour: 350,
        weekendPricePerHour: 450,
        openHour: 6,
        closeHour: 23,
        isIndoor: true,
        isFeatured: false,
        isActive: true,
        amenities: ['Air Conditioning', 'Shoe Rental', 'Changing Rooms', 'Drinking Water', 'Parking'],
        images: [
          'https://images.unsplash.com/photo-1613918431703-aa6321c252aa?w=800&auto=format&fit=crop'
        ],
        sports: ['badminton'],
        rating: 4.6,
        reviewCount: 19,
        cancellationPolicy: 'Free cancellation up to 2 hours prior to slot.',
        lat: 15.8150,
        lng: 78.0420,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ven_5',
        ownerId: demoOwner.id,
        name: 'Apex Pro Box Cricket & Turf',
        slug: 'apex-box-cricket-venkayapalli',
        city: 'Kurnool',
        area: 'Venkayapalli',
        address: 'Nandyal Highway Road, Venkayapalli Bypass, Kurnool',
        description: 'Giant enclosed box cricket and basketball court with netting and high-speed pitch turf. Perfect for weekend corporate matches and team rivalries.',
        pricePerHour: 750,
        weekendPricePerHour: 900,
        openHour: 6,
        closeHour: 24,
        isIndoor: false,
        isFeatured: false,
        isActive: true,
        amenities: ['Cafeteria', 'Sound System', 'Parking', 'Floodlights', 'Dugouts'],
        images: [
          'https://images.unsplash.com/photo-1531415074868-036b1c57e3ce?w=800&auto=format&fit=crop'
        ],
        sports: ['cricket', 'basketball'],
        rating: 4.8,
        reviewCount: 31,
        cancellationPolicy: 'Free cancellation up to 4 hours before the booked match.',
        lat: 15.8050,
        lng: 78.0650,
        createdAt: new Date().toISOString()
      }
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    const initialBookings: Booking[] = [
      {
        id: 'bkg_1',
        bookingRef: 'BMG-492018',
        userId: demoPlayer.id,
        userEmail: demoPlayer.email,
        venueId: initialVenues[0].id,
        venueName: initialVenues[0].name,
        venueArea: initialVenues[0].area,
        sportSlug: 'badminton',
        sportName: 'Badminton',
        date: todayStr,
        startHour: 18,
        endHour: 19,
        hours: 1,
        playerName: demoPlayer.name,
        playerPhone: demoPlayer.phone || '9876543210',
        playersCount: 4,
        amount: 400,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        paymentMethod: 'pay_at_venue',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'bkg_2',
        bookingRef: 'BMG-938172',
        userId: demoPlayer.id,
        userEmail: demoPlayer.email,
        venueId: initialVenues[1].id,
        venueName: initialVenues[1].name,
        venueArea: initialVenues[1].area,
        sportSlug: 'football',
        sportName: 'Football',
        date: todayStr,
        startHour: 20,
        endHour: 22,
        hours: 2,
        playerName: demoPlayer.name,
        playerPhone: demoPlayer.phone || '9876543210',
        playersCount: 10,
        amount: 1600,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        paymentMethod: 'pay_at_venue',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ];

    const initialReviews: Review[] = [
      {
        id: 'rev_1',
        venueId: initialVenues[0].id,
        userId: demoPlayer.id,
        authorName: 'Ravi Teja',
        rating: 5,
        comment: 'Superb wooden courts! Lighting is totally glare-free and the staff is very polite. Best badminton in Kurnool.',
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
      },
      {
        id: 'rev_2',
        venueId: initialVenues[1].id,
        userId: 'usr_anon',
        authorName: 'Karthik Varma',
        rating: 5,
        comment: 'High quality turf with good bounce for football. Floodlights are awesome for night matches.',
        createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
      }
    ];

    this.data.users = [demoPlayer, demoOwner];
    this.data.sports = INITIAL_SPORTS;
    this.data.venues = initialVenues;
    this.data.bookings = initialBookings;
    this.data.reviews = initialReviews;
  }

  // User Operations
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(user: User): User {
    this.data.users.push(user);
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
    if (!this.data.venues || this.data.venues.length === 0) {
      this.seedInitialData();
    }
    let result = (this.data.venues || []).filter(v => v.isActive);

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
    if (!this.data.venues || this.data.venues.length === 0) {
      this.seedInitialData();
    }
    return this.data.venues.find(v => v.slug === slug);
  }

  public getVenueById(id: string): Venue | undefined {
    if (!this.data.venues || this.data.venues.length === 0) {
      this.seedInitialData();
    }
    return this.data.venues.find(v => v.id === id);
  }

  public getOwnerVenues(ownerId: string): Venue[] {
    return this.data.venues.filter(v => v.ownerId === ownerId);
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
      booking.paymentStatus = paymentStatus;
    }
    this.save();
    return booking;
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
}

export const store = new Store();
