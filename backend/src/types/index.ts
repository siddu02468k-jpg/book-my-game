export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  avatarUrl?: string;
  role: 'player' | 'owner' | 'admin';
  createdAt: string;
}

export interface Sport {
  id: string;
  name: string;
  slug: string;
  icon: string;
  emoji: string;
  isActive: boolean;
}

export interface Venue {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  city: string;
  area: string;
  address: string;
  description: string;
  pricePerHour: number;
  weekendPricePerHour?: number;
  openHour: number; // 0-23 (e.g. 6 = 6 AM)
  closeHour: number; // 1-24 (e.g. 23 = 11 PM)
  isIndoor: boolean;
  isFeatured: boolean;
  isActive: boolean;
  amenities: string[];
  images: string[];
  sports: string[]; // sport slugs, e.g. ['badminton', 'cricket']
  rating: number;
  reviewCount: number;
  cancellationPolicy: string;
  lat?: number;
  lng?: number;
  createdAt: string;
}

export interface SlotAvailability {
  hour: number; // e.g. 6 for 06:00 - 07:00
  timeString: string; // e.g. "06:00 AM - 07:00 AM"
  price: number;
  isBooked: boolean;
  isPast: boolean;
}

export interface Booking {
  id: string;
  bookingRef: string; // e.g. "BMG-98421"
  userId: string;
  userEmail: string;
  venueId: string;
  venueName: string;
  venueArea: string;
  sportSlug: string;
  sportName: string;
  date: string; // YYYY-MM-DD
  startHour: number; // e.g. 18
  endHour: number; // e.g. 20
  hours: number;
  playerName: string;
  playerPhone: string;
  playersCount: number;
  amount: number;
  status: 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid';
  paymentMethod: 'pay_at_venue' | 'upi';
  notes?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  venueId: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
  };
  token: string;
}
