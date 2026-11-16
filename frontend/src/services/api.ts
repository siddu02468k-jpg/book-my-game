import { User, Sport, Venue, SlotAvailability, Booking, BackendHealth } from '../types';

const TOKEN_KEY = 'bmg_auth_token';
const USER_KEY = 'bmg_user_profile';
const API_URL_KEY = 'bmg_custom_api_url';

export const getDefaultApiUrl = (): string => {
  // In production (Render, custom domain), always use relative URL so calls hit the same server
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '';
  }

  const custom = localStorage.getItem(API_URL_KEY);
  if (custom) return custom;

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  return 'http://localhost:5000';
};

class ApiService {
  private baseUrl = getDefaultApiUrl();

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.trim().replace(/\/$/, '');
    localStorage.setItem(API_URL_KEY, this.baseUrl);
  }

  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public setToken(token: string | null): void {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  public getStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public setStoredUser(user: User | null): void {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.error || `HTTP error! status: ${response.status}`);
      }

      return json;
    } catch (err: any) {
      console.error(`API Request Failed [${endpoint}]:`, err);
      throw err;
    }
  }

  // Health
  public async checkHealth(): Promise<BackendHealth> {
    try {
      const res = await this.request<any>('/api/health');
      return {
        status: 'online',
        platform: res.platform,
        uptime: res.uptime,
        stats: res.stats,
      };
    } catch {
      return { status: 'offline' };
    }
  }

  // Auth
  public async register(name: string, email: string, password: string, phone?: string, role: string = 'player'): Promise<User> {
    const res = await this.request<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone, role }),
    });

    this.setToken(res.data.token);
    this.setStoredUser(res.data.user);
    return res.data.user;
  }

  public async login(email: string, password: string): Promise<User> {
    const res = await this.request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setToken(res.data.token);
    this.setStoredUser(res.data.user);
    return res.data.user;
  }

  public logout(): void {
    this.setToken(null);
    this.setStoredUser(null);
  }

  // Venues & Sports
  public async getSports(): Promise<Sport[]> {
    const res = await this.request<{ success: boolean; data: Sport[] }>('/api/venues/sports/list');
    return res.data;
  }

  public async getAreas(): Promise<string[]> {
    const res = await this.request<{ success: boolean; data: string[] }>('/api/venues/areas/list');
    return res.data;
  }

  public async getVenues(filters?: { sport?: string; area?: string; search?: string; sort?: string }): Promise<Venue[]> {
    const params = new URLSearchParams();
    if (filters?.sport) params.append('sport', filters.sport);
    if (filters?.area) params.append('area', filters.area);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sort) params.append('sort', filters.sort);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request<{ success: boolean; data: Venue[] }>(`/api/venues${query}`);
    return res.data;
  }

  public async getVenueBySlug(slug: string): Promise<Venue> {
    const res = await this.request<{ success: boolean; data: Venue }>(`/api/venues/${slug}`);
    return res.data;
  }

  public async getVenueSlots(venueId: string, date: string): Promise<SlotAvailability[]> {
    const res = await this.request<{ success: boolean; data: SlotAvailability[] }>(`/api/venues/${venueId}/slots?date=${date}`);
    return res.data;
  }

  // Bookings
  public async createBooking(data: {
    venueId: string;
    sportSlug: string;
    date: string;
    startHour: number;
    hours: number;
    playerName: string;
    playerPhone: string;
    playersCount: number;
    notes?: string;
  }): Promise<Booking> {
    const res = await this.request<{ success: boolean; message: string; data: Booking }>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  public async getMyBookings(): Promise<Booking[]> {
    const res = await this.request<{ success: boolean; data: Booking[] }>('/api/bookings/my');
    return res.data;
  }

  public async cancelBooking(id: string): Promise<Booking> {
    const res = await this.request<{ success: boolean; message: string; data: Booking }>(`/api/bookings/${id}/cancel`, {
      method: 'PUT',
    });
    return res.data;
  }

  // Owner Operations
  public async getOwnerVenues(): Promise<Venue[]> {
    const res = await this.request<{ success: boolean; data: Venue[] }>('/api/owner/venues');
    return res.data;
  }

  public async addOwnerVenue(venueData: any): Promise<Venue> {
    const res = await this.request<{ success: boolean; data: Venue }>('/api/owner/venues', {
      method: 'POST',
      body: JSON.stringify(venueData),
    });
    return res.data;
  }

  public async toggleVenueActive(venueId: string): Promise<Venue> {
    const res = await this.request<{ success: boolean; data: Venue }>(`/api/owner/venues/${venueId}/toggle`, {
      method: 'PUT',
    });
    return res.data;
  }

  public async updateVenueUpi(venueId: string, upiId: string): Promise<Venue> {
    const res = await this.request<{ success: boolean; data: Venue }>(`/api/owner/venues/${venueId}/upi`, {
      method: 'PUT',
      body: JSON.stringify({ upiId }),
    });
    return res.data;
  }

  public async settleCommission(venueId: string, amount: number, ref?: string): Promise<{ success: boolean; message: string; data: Venue }> {
    return await this.request(`/api/owner/venues/${venueId}/settle-commission`, {
      method: 'POST',
      body: JSON.stringify({ amount, ref }),
    });
  }

  public async getOwnerBookings(): Promise<Booking[]> {
    const res = await this.request<{ success: boolean; data: Booking[] }>('/api/owner/bookings');
    return res.data;
  }

  public async updateBookingStatus(id: string, status: 'confirmed' | 'completed' | 'cancelled', paymentStatus?: 'unpaid' | 'paid'): Promise<Booking> {
    const res = await this.request<{ success: boolean; data: Booking }>(`/api/owner/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, paymentStatus }),
    });
    return res.data;
  }

  public async verifyPass(bookingRef: string): Promise<{ success: boolean; message: string; data: Booking }> {
    return await this.request('/api/owner/verify-pass', {
      method: 'POST',
      body: JSON.stringify({ bookingRef }),
    });
  }

  public async becomeOwner(): Promise<User> {
    const res = await this.request<{ success: boolean; data: User }>('/api/owner/become', {
      method: 'POST',
    });
    this.setStoredUser(res.data);
    return res.data;
  }

  public async exportBackup(): Promise<any> {
    const res = await this.request<{ success: boolean; data: any }>('/api/owner/backup/export');
    return res.data;
  }

  public async restoreBackup(backupData: any): Promise<{ success: boolean; message: string }> {
    return await this.request('/api/owner/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ backupData })
    });
  }

  public async getSystemHealth(): Promise<any> {
    const res = await this.request<{ success: boolean; data: any }>('/api/owner/system-health');
    return res.data;
  }

  // Payments
  public async getPaymentConfig(): Promise<{ razorpayKeyId?: string; defaultUpiId?: string }> {
    try {
      const res = await this.request('/api/payments/config');
      return res;
    } catch {
      return { razorpayKeyId: '', defaultUpiId: 'bookmygame@upi' };
    }
  }

  public async createPaymentOrder(bookingId: string, amount: number, paymentMethod: string): Promise<any> {
    return await this.request('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ bookingId, amount, paymentMethod }),
    });
  }

  public async verifyPayment(bookingId: string, transactionId: string, paymentMethod: string): Promise<Booking> {
    const res = await this.request<{ success: boolean; data: Booking }>('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ bookingId, transactionId, paymentMethod }),
    });
    return res.data;
  }

  // Reviews
  public async addReview(venueId: string, rating: number, comment: string, authorName?: string): Promise<any> {
    return await this.request(`/api/venues/${venueId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment, authorName }),
    });
  }
}

export const api = new ApiService();
