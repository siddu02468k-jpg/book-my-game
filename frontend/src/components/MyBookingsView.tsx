import React, { useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Booking } from '../types';
import { triggerHaptic } from '../utils/device';

interface MyBookingsViewProps {
  bookings: Booking[];
  onCancelBooking: (id: string) => Promise<void>;
  onExploreVenues: () => void;
  newBookingId?: string | null;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  bookings,
  onCancelBooking,
  onExploreVenues,
  newBookingId,
}) => {
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      setCancellingId(id);
      triggerHaptic();
      await onCancelBooking(id);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sport-500/10 text-sport-400 border border-sport-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span className="uppercase">Confirmed</span>
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span className="uppercase">Played</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            <span className="uppercase">Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Your Reservations &amp; Match Passes</h1>
          <p className="text-xs text-slate-400">View upcoming game slots & booking reference IDs</p>
        </div>

        <button
          onClick={() => {
            triggerHaptic();
            onExploreVenues();
          }}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow-sm"
        >
          <span>Book Turf</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-[#111815] border border-[#1e2923] rounded-3xl p-8">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No active bookings yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Ready to play? Pick a badminton court, cricket net or turf across Kurnool and reserve your slot instantly.
          </p>
          <button
            onClick={() => {
              triggerHaptic();
              onExploreVenues();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-sport-500 text-black font-extrabold text-xs shadow-glow"
          >
            Explore Kurnool Turfs
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const isJustBooked = newBookingId === booking.id;

            return (
              <div
                key={booking.id}
                className={`bg-[#111815] border rounded-2xl p-4 transition-all duration-300 ${
                  isJustBooked
                    ? 'border-sport-500 shadow-glow'
                    : 'border-[#1e2923] hover:border-slate-700'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-black text-white">
                        {booking.venueName}
                      </h3>
                      {getStatusBadge(booking.status)}
                      {isJustBooked && (
                        <span className="text-[10px] font-bold bg-sport-400 text-black px-2 py-0.5 rounded-full shadow-glow-sm">
                          ✓ Just Booked!
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-slate-400 text-xs mt-0.5">
                      <MapPin className="w-3 h-3 text-sport-400" />
                      <span>{booking.venueArea}, Kurnool</span>
                      <span className="mx-1">•</span>
                      <span className="capitalize text-sport-400 font-semibold">{booking.sportName}</span>
                    </div>
                  </div>

                  {/* Reference ID Pill */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase">Reference ID</span>
                    <span className="font-mono font-bold text-xs text-sport-300 bg-[#0a0f0d] px-2 py-1 rounded-md border border-[#1e2923]">
                      {booking.bookingRef}
                    </span>
                  </div>
                </div>

                {/* Slot Details Box */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0a0f0d] p-3 rounded-xl border border-[#1e2923] text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Date</span>
                    <span className="font-medium text-slate-200">{booking.date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Time Slot</span>
                    <span className="font-medium text-sport-400">
                      {booking.startHour}:00 - {booking.endHour}:00 ({booking.hours} hr)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Amount</span>
                    <span className="font-bold text-white">₹{booking.amount}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({booking.paymentStatus === 'paid' ? 'Paid' : 'Pay at venue'})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Player</span>
                    <span className="text-slate-300">{booking.playerName} ({booking.playersCount} players)</span>
                  </div>
                </div>

                {/* Action Bar */}
                {booking.status === 'confirmed' && (
                  <div className="mt-3 pt-2 border-t border-[#1e2923] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      Free cancellation permitted up to 2 hours before start time.
                    </span>
                    <button
                      disabled={cancellingId === booking.id}
                      onClick={() => handleCancel(booking.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:underline font-semibold"
                    >
                      {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
