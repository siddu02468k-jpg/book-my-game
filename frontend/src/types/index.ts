export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'player' | 'owner' | 'admin';
  avatarUrl?: string;
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
  openHour: number;
  closeHour: number;
  isIndoor: boolean;
  isFeatured: boolean;
  isActive: boolean;
  amenities: string[];
  images: string[];
  sports: string[];
  rating: number;
  reviewCount: number;
  cancellationPolicy: string;
  lat?: number;
  lng?: number;
  reviews?: Review[];
}

export interface SlotAvailability {
  hour: number;
  timeString: string;
  price: number;
  isBooked: boolean;
  isPast: boolean;
}

export interface Booking {
  id: string;
  bookingRef: string;
  userId: string;
  userEmail: string;
  venueId: string;
  venueName: string;
  venueArea: string;
  sportSlug: string;
  sportName: string;
  date: string;
  startHour: number;
  endHour: number;
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

export interface BackendHealth {
  status: 'online' | 'offline' | 'checking';
  platform?: string;
  uptime?: number;
  stats?: {
    venuesCount: number;
    sportsCount: number;
  };
}
