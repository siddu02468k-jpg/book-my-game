import React, { useState } from 'react';
import { Plus, Building2, Calendar, IndianRupee, Check, Power, AlertCircle, Sparkles, QrCode, Search, CheckCircle2 } from 'lucide-react';
import { Venue, Booking, User } from '../types';
import { api } from '../services/api';
import { triggerHaptic } from '../utils/device';

interface OwnerPortalProps {
  user: User | null;
  venues: Venue[];
  bookings: Booking[];
  onRefreshData: () => void;
  onOpenAuth: () => void;
}

export const OwnerPortal: React.FC<OwnerPortalProps> = ({
  user,
  venues,
  bookings,
  onRefreshData,
  onOpenAuth,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // QR Pass check-in state
  const [scanRef, setScanRef] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  // New venue form fields
  const [name, setName] = useState('');
  const [area, setArea] = useState('Budhawarpet');
  const [address, setAddress] = useState('');
  const [pricePerHour, setPricePerHour] = useState(500);
  const [weekendPrice, setWeekendPrice] = useState(650);
  const [openHour, setOpenHour] = useState(6);
  const [closeHour, setCloseHour] = useState(23);
  const [sports, setSports] = useState<string[]>(['badminton', 'cricket']);
  const [amenities, setAmenities] = useState<string>('Parking, Drinking Water, Floodlights, Changing Rooms');

  const isOwner = user?.role === 'owner';

  const handleVerifyPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanRef.trim()) return;

    try {
      setVerifying(true);
      setVerifyMessage(null);
      setError(null);
      const res = await api.verifyPass(scanRef.trim());
      triggerHaptic();
      setVerifyMessage(res.message);
      setScanRef('');
      onRefreshData();
      setTimeout(() => setVerifyMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleBecomeOwner = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    try {
      triggerHaptic();
      await api.becomeOwner();
      onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to become owner');
    }
  };

  const handleToggleActive = async (venueId: string) => {
    try {
      triggerHaptic();
      await api.toggleVenueActive(venueId);
      onRefreshData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: 'completed' | 'cancelled', payment?: 'paid') => {
    try {
      triggerHaptic();
      await api.updateBookingStatus(bookingId, status, payment);
      onRefreshData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAddVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await api.addOwnerVenue({
        name,
        area,
        address,
        pricePerHour,
        weekendPricePerHour: weekendPrice,
        openHour,
        closeHour,
        sports,
        amenities: amenities.split(',').map(s => s.trim()).filter(Boolean),
      });
      triggerHaptic();
      setShowAddModal(false);
      setName('');
      onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Error listing venue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRevenue = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-sport-500/10 text-sport-400 border border-sport-500/20">
            Manager Console
          </span>
          <h2 className="text-xl font-black text-white uppercase tracking-tight mt-1">
            Turf Owner Dashboard
          </h2>
          <p className="text-xs text-slate-400">Manage courts, monitor booking schedules & track revenue</p>
        </div>

        {isOwner && (
          <button
            onClick={() => {
              triggerHaptic();
              setShowAddModal(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow transition self-start active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>List New Venue</span>
          </button>
        )}
      </div>

      {/* Onboarding State if not owner */}
      {!isOwner && (
        <div className="bg-[#111815] border border-sport-500/40 rounded-3xl p-6 sm:p-8 text-center max-w-xl mx-auto space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-sport-500/10 border border-sport-500/30 text-sport-400 flex items-center justify-center mx-auto shadow-glow-sm">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase">List your venue in Kurnool</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Accept live online bookings for your badminton court, cricket turf, or sports complex without paying any commission fees.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleBecomeOwner}
              className="px-6 py-3 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow transition active:scale-95"
            >
              {user ? 'Activate Venue Owner Role (Instant)' : 'Sign In to List Venue'}
            </button>
          </div>
        </div>
      )}

      {/* Management Content */}
      {isOwner && (
        <div className="space-y-6">
          
          {/* QR Pass Check-in Box */}
          <div className="bg-[#111815] border border-sport-500/40 rounded-2xl p-5 shadow-glow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <QrCode className="w-5 h-5 text-sport-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                Quick Player Check-in / Scan Pass
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Scan or enter the player's 6-digit booking reference code (e.g. <code>BMG-492018</code>) to mark them as checked in and paid.
            </p>

            {verifyMessage && (
              <div className="mb-3 p-3 rounded-xl bg-sport-500/10 border border-sport-500/40 text-sport-400 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{verifyMessage}</span>
              </div>
            )}

            {error && (
              <div className="mb-3 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPass} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={scanRef}
                  onChange={(e) => setScanRef(e.target.value.toUpperCase())}
                  placeholder="Enter Ref Code (e.g. BMG-492018)..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-xs text-white font-mono uppercase focus:outline-none focus:border-sport-500"
                />
              </div>
              <button
                type="submit"
                disabled={verifying || !scanRef.trim()}
                className="px-5 py-2.5 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow-sm transition disabled:opacity-40"
              >
                {verifying ? 'Checking...' : 'Verify & Check-In'}
              </button>
            </form>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#111815] border border-[#1e2923] p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Owned Venues</span>
                <p className="text-2xl font-black text-white mt-0.5">{venues.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#16201b] text-sport-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#111815] border border-[#1e2923] p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Bookings</span>
                <p className="text-2xl font-black text-white mt-0.5">{bookings.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#16201b] text-blue-400">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#111815] border border-[#1e2923] p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Booked Value</span>
                <p className="text-2xl font-black text-sport-400 mt-0.5">₹{totalRevenue}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#16201b] text-sport-400">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Your Venues List */}
          <div className="bg-[#111815] border border-[#1e2923] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Your Listed Venues</h3>
            
            {venues.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No venues listed yet. Click "+ List New Venue" to add one.</p>
            ) : (
              <div className="divide-y divide-[#1e2923]">
                {venues.map((venue) => (
                  <div key={venue.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-white">{venue.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          venue.isActive ? 'bg-sport-500/10 text-sport-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {venue.isActive ? 'Live' : 'Paused'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{venue.area}, Kurnool • ₹{venue.pricePerHour}/hr</span>
                    </div>

                    <button
                      onClick={() => handleToggleActive(venue.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        venue.isActive
                          ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/50'
                          : 'bg-sport-500 text-black border-sport-400'
                      }`}
                    >
                      {venue.isActive ? 'Pause Listing' : 'Activate'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Reservations Table */}
          <div className="bg-[#111815] border border-[#1e2923] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Customer Reservations</h3>

            {bookings.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No customer bookings received yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1e2923] text-slate-500 uppercase text-[10px]">
                      <th className="py-2.5">When & Slot</th>
                      <th className="py-2.5">Venue</th>
                      <th className="py-2.5">Player Info</th>
                      <th className="py-2.5">Amount</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2923]">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[#16201b]/50">
                        <td className="py-3">
                          <span className="font-bold text-white block">{b.date}</span>
                          <span className="text-[11px] text-sport-400">{b.startHour}:00 - {b.endHour}:00</span>
                        </td>
                        <td className="py-3 font-medium text-slate-300">{b.venueName}</td>
                        <td className="py-3">
                          <span className="text-white block font-medium">{b.playerName}</span>
                          <span className="text-[11px] text-slate-400">{b.playerPhone}</span>
                        </td>
                        <td className="py-3 font-bold text-white">₹{b.amount}</td>
                        <td className="py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            b.status === 'completed'
                              ? 'bg-blue-500/10 text-blue-400'
                              : b.status === 'cancelled'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-sport-500/10 text-sport-400'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-1 whitespace-nowrap">
                          {b.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(b.id, 'completed', 'paid')}
                                className="px-2.5 py-1 rounded-lg bg-sport-500/20 text-sport-400 hover:bg-sport-500 hover:text-black font-bold text-[11px] transition"
                              >
                                Mark Played
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                                className="px-2 py-1 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 font-bold text-[11px] transition"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Add Venue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f1512] border border-[#1e2923] w-full max-w-lg rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-base font-black text-white uppercase mb-4">List New Sports Facility</h3>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleAddVenue} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Venue Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Strike Force Arena"
                  className="w-full px-3 py-2 rounded-xl bg-[#16201b] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Area in Kurnool</label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#16201b] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                  >
                    <option value="Budhawarpet">Budhawarpet</option>
                    <option value="Joharapuram">Joharapuram</option>
                    <option value="B-Camp">B-Camp</option>
                    <option value="Gayatri Estate">Gayatri Estate</option>
                    <option value="Venkayapalli">Venkayapalli</option>
                    <option value="Collectorate Road">Collectorate Road</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Hourly Price (₹)</label>
                  <input
                    type="number"
                    value={pricePerHour}
                    onChange={(e) => setPricePerHour(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#16201b] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Amenities (comma-separated)</label>
                <input
                  type="text"
                  value={amenities}
                  onChange={(e) => setAmenities(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#16201b] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#16201b] text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-sport-500 text-black font-extrabold shadow-glow-sm"
                >
                  {isSubmitting ? 'Creating...' : 'Publish Venue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
