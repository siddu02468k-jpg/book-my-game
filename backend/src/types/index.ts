export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  phone?: string;
  avatarUrl?: string;
  role: 'player' | 'owner' | 'admin';
  authProvider?: 'local' | 'google';
  googleId?: string;
  emailVerified?: boolean;
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

  // Real Owner Identity & Verification Details
  ownerFullName?: string; // Real full legal name of the turf owner
  ownerPhone?: string; // Primary verified phone number
  ownerAltPhone?: string; // Alternate / backup contact
  governmentIdType?: string; // e.g. "Electricity Bill", "GST Certificate", "Trade License", "Aadhaar Card", "PAN Card"
  governmentIdNumber?: string; // Document / ID number
  ownershipDocProof?: string; // Document proof image (base64 or URL)
  isVerified?: boolean; // Real owner verification status
  verificationStatus?: 'verified' | 'pending' | 'under_review';
  googleMapsUrl?: string; // Google Maps navigation link
  pitchType?: string; // e.g. "AstroTurf", "Synthetic Rubber", "Clay Court", "Wooden Floor"

  // Method 1 Direct Payment & Commission Auto-Lock
  ownerUpiId?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  commissionRate?: number; // default 0.09 (9%)
  unpaidCommission?: number; // accumulated unpaid 9% commission
  commissionThreshold?: number; // credit limit before auto-lock (e.g. 1000)
  isCommissionBlocked?: boolean; // true if venue auto-paused due to unpaid commission
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
  baseAmount?: number; // Turf owner's base rate (e.g. ₹1,000)
  platformCommission?: number; // 9% platform fee added on top (e.g. ₹90)
  amount: number; // Total customer pays (e.g. ₹1,090)
  turfEarnings?: number; // Turf owner receives full base rate (e.g. ₹1,000)
  status: 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid';
  paymentMethod: 'pay_at_venue' | 'upi';
  notes?: string;
  createdAt: string;
  venueOwnerUpiId?: string; // Turf owner UPI ID used
  commissionSettled?: boolean; // whether turf owner has paid this commission to platform
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
