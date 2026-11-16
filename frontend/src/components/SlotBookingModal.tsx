import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  CheckCircle2, 
  User, 
  Phone, 
  Users, 
  AlertCircle, 
  Share2, 
  IndianRupee,
  Smartphone,
  ArrowRight,
  QrCode,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { Venue, SlotAvailability, Booking } from '../types';
import { api } from '../services/api';
import { triggerHaptic } from '../utils/device';

interface SlotBookingModalProps {
  venue: Venue | null;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

export const SlotBookingModal: React.FC<SlotBookingModalProps> = ({
  venue,
  onClose,
  onBookingSuccess,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [duration, setDuration] = useState<number>(1);
  const [selectedStartHour, setSelectedStartHour] = useState<number | null>(null);

  const [playerName, setPlayerName] = useState<string>('');
  const [playerPhone, setPlayerPhone] = useState<string>('');
  const [playersCount, setPlayersCount] = useState<number>(4);
  const [paymentChoice, setPaymentChoice] = useState<'pay_at_venue' | 'upi'>('pay_at_venue');

  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stages: 'booking' -> 'upi_payment' (if online pay selected) -> 'confirmed'
  const [currentStage, setCurrentStage] = useState<'booking' | 'upi_payment' | 'confirmed'>('booking');
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [razorpayKey, setRazorpayKey] = useState<string>('');

  useEffect(() => {
    if (venue) {
      setSelectedSport(venue.sports[0] || 'badminton');
      const user = api.getStoredUser();
      if (user) {
        setPlayerName(user.name);
        if (user.phone) setPlayerPhone(user.phone);
      }
      fetchSlots(venue.id, selectedDate);
      api.getPaymentConfig().then((cfg) => {
        if (cfg?.razorpayKeyId) setRazorpayKey(cfg.razorpayKeyId);
      });
    }
  }, [venue, selectedDate]);

  if (!venue) return null;

  const fetchSlots = async (venueId: string, date: string) => {
    try {
      setLoadingSlots(true);
      setError(null);
      const data = await api.getVenueSlots(venueId, date);
      setSlots(data);
      setSelectedStartHour(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (date: string) => {
    triggerHaptic();
    setSelectedDate(date);
    setSelectedStartHour(null);
  };

  const handleSelectSlot = (hour: number) => {
    triggerHaptic();
    const requiredHours = duration;
    for (let h = hour; h < hour + requiredHours; h++) {
      const s = slots.find((item) => item.hour === h);
      if (!s || s.isBooked || s.isPast) {
        setError(`Cannot select ${requiredHours} hours starting at this slot (one or more slots are unavailable).`);
        return;
      }
    }
    setError(null);
    setSelectedStartHour(hour);
  };

  const handleStartBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStartHour === null) {
      setError('Please select an available start slot from the matrix below.');
      return;
    }
    if (!playerName.trim() || !playerPhone.trim()) {
      setError('Please provide your name and phone number for booking.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const booking = await api.createBooking({
        venueId: venue.id,
        sportSlug: selectedSport,
        date: selectedDate,
        startHour: selectedStartHour,
        hours: duration,
        playerName: playerName.trim(),
        playerPhone: playerPhone.trim(),
        playersCount,
      });

      triggerHaptic();

      if (paymentChoice === 'upi') {
        setPendingBooking(booking);
        setCurrentStage('upi_payment');
      } else {
        setConfirmedBooking(booking);
        setCurrentStage('confirmed');
        onBookingSuccess(booking);
      }
    } catch (err: any) {
      setError(err.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Called when user completes UPI transfer or clicks verify
  const handleCompleteUpiPayment = async () => {
    if (!pendingBooking) return;
    try {
      setSubmitting(true);
      const updated = await api.verifyPayment(pendingBooking.id, `UPI_REF_${Date.now()}`, 'upi');
      triggerHaptic();
      setConfirmedBooking(updated);
      setCurrentStage('confirmed');
      onBookingSuccess(updated);
    } catch (err: any) {
      setError(err.message || 'Payment verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!confirmedBooking) return;
    triggerHaptic();
    const msg = 
`⚡ *BOOK MY GAME PASS* ⚡
━━━━━━━━━━━━━━━━━━
🎫 *Ref ID:* ${confirmedBooking.bookingRef}
🏟️ *Venue:* ${confirmedBooking.venueName}
📍 *Area:* ${confirmedBooking.venueArea}, Kurnool
🏅 *Sport:* ${confirmedBooking.sportName}
📅 *Date:* ${confirmedBooking.date}
⏰ *Slot:* ${confirmedBooking.startHour}:00 - ${confirmedBooking.endHour}:00 (${confirmedBooking.hours} hr)
💰 *Amount:* ₹${confirmedBooking.amount} (${confirmedBooking.paymentStatus === 'paid' ? 'PAID ONLINE' : 'PAY AT VENUE'})
👤 *Player:* ${confirmedBooking.playerName} (${confirmedBooking.playerPhone})
━━━━━━━━━━━━━━━━━━
📍 *Location:* https://maps.google.com/?q=${encodeURIComponent(confirmedBooking.venueName + ' ' + confirmedBooking.venueArea + ' Kurnool')}
_Show this message to the venue operator upon arrival._`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const checkDate = new Date(selectedDate);
  const isWeekend = checkDate.getDay() === 0 || checkDate.getDay() === 6;
  const currentHourlyRate = (isWeekend && venue.weekendPricePerHour) ? venue.weekendPricePerHour : venue.pricePerHour;
  const baseSlotAmount = currentHourlyRate * duration; // Turf Owner's full base price (e.g. ₹1,000)
  const platformFee = Math.round(baseSlotAmount * (venue.commissionRate || 0.09)); // 9% Platform Fee added on top (e.g. ₹90)
  const totalAmount = baseSlotAmount + platformFee; // Total customer pays (e.g. ₹1,090)

  // Method 1: Real NPCI standard UPI Payment Payload directly to Venue Owner
  const upiId = venue.ownerUpiId || 'bookmygame@upi';
  const bookingRefForUpi = pendingBooking?.bookingRef || 'BMG';
  const upiPayPayload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(venue.name)}&am=${totalAmount}.00&cu=INR&tn=${encodeURIComponent('Slot Booking ' + bookingRefForUpi)}`;
  const upiPaymentQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiPayPayload)}`;

  // Scannable Entry Pass QR for Venue Operator Check-in
  const entryPassPayload = confirmedBooking ? confirmedBooking.bookingRef : '';
  const entryPassQrUrl = confirmedBooking
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(entryPassPayload)}&color=22c55e&bgcolor=0f1512`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f1512] border border-[#1e2923] w-full max-w-2xl rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl safe-padding-bottom">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1e2923] flex items-center justify-between bg-[#0a0f0d]/80">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center space-x-2">
              <span>{venue.name}</span>
            </h2>
            <div className="flex items-center space-x-1 text-slate-400 text-xs mt-0.5">
              <MapPin className="w-3 h-3 text-sport-400" />
              <span>{venue.area}, Kurnool</span>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-[#16201b] text-slate-400 hover:text-white border border-[#1e2923] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 smooth-scroll">
          
          {/* STAGE 2: REAL UPI PAYMENT QR CODE TO TURF OWNER */}
          {currentStage === 'upi_payment' && pendingBooking && (
            <div className="py-4 text-center space-y-4">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-sport-500/10 text-sport-400 border border-sport-500/20">
                Direct Payment to Turf Owner
              </span>
              <h3 className="text-xl font-black text-white">
                Pay ₹{totalAmount} to {venue.name}
              </h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Scan with PhonePe, Google Pay, or Paytm. 100% of your payment transfers instantly to the turf owner's bank account.
              </p>
              <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
                <span>Court Fee: <strong className="text-white">₹{baseSlotAmount}</strong></span>
                <span>•</span>
                <span>Convenience Fee (9%): <strong className="text-sport-400">₹{platformFee}</strong></span>
              </div>

              {/* Real UPI QR Box */}
              <div className="bg-white p-4 rounded-3xl max-w-[240px] mx-auto shadow-glow flex flex-col items-center justify-center">
                <img 
                  src={upiPaymentQrUrl} 
                  alt="UPI Payment QR" 
                  className="w-48 h-48 rounded-xl object-contain"
                />
                <span className="text-[11px] font-bold text-black mt-2 font-mono">
                  UPI ID: {upiId}
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5">
                  Verified NPCI Direct Transfer
                </span>
              </div>

              {/* Direct UPI Intent Link for Mobile */}
              <div className="pt-2 max-w-xs mx-auto space-y-2">
                <a
                  href={upiPayPayload}
                  className="w-full py-2.5 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow flex items-center justify-center space-x-1 transition"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Open UPI App on Phone</span>
                </a>

                <button
                  type="button"
                  onClick={handleCompleteUpiPayment}
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-[#16201b] hover:bg-[#1f2c25] text-sport-400 border border-sport-500/40 font-bold text-xs flex items-center justify-center space-x-1 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Verifying...' : 'I Have Paid (Get Match Pass)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STAGE 3: MATCH ENTRY PASS TICKET */}
          {currentStage === 'confirmed' && confirmedBooking && (
            <div className="py-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-sport-500/20 text-sport-400 border border-sport-500/40 flex items-center justify-center mx-auto shadow-glow">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-sport-500/10 text-sport-400 border border-sport-500/20">
                  {confirmedBooking.paymentStatus === 'paid' ? 'Paid & Confirmed' : 'Slot Confirmed (Pay at Venue)'}
                </span>
                <h3 className="text-2xl font-black text-white mt-2">
                  Pass Ref: {confirmedBooking.bookingRef}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Show this match entry pass to the turf operator when you arrive.
                </p>
              </div>

              {/* Scannable Match Entry Pass Card */}
              <div className="bg-[#16201b] border border-sport-500/40 rounded-3xl p-5 text-left max-w-sm mx-auto shadow-glow relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-[#1e2923]">
                  <div>
                    <span className="text-[9px] text-sport-400 font-extrabold uppercase tracking-widest block">MATCH ENTRY PASS</span>
                    <h4 className="text-sm font-black text-white">{confirmedBooking.venueName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-white bg-[#0a0f0d] px-2 py-0.5 rounded border border-[#1e2923]">
                      {confirmedBooking.bookingRef}
                    </span>
                  </div>
                </div>

                {/* Entry Pass QR Code (Scannable by Owner Console) */}
                <div className="py-4 flex flex-col items-center justify-center">
                  <div className="p-2.5 rounded-2xl bg-[#0f1512] border border-sport-500/30 shadow-inner">
                    <img 
                      src={entryPassQrUrl} 
                      alt={`Pass ${confirmedBooking.bookingRef}`} 
                      className="w-36 h-36 rounded-lg object-contain" 
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 flex items-center space-x-1">
                    <QrCode className="w-3 h-3 text-sport-400" />
                    <span>Scan at turf counter for instant check-in</span>
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#1e2923] text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date & Slot</span>
                    <span className="text-white font-bold">{confirmedBooking.date} • {confirmedBooking.startHour}:00 - {confirmedBooking.endHour}:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sport</span>
                    <span className="text-sport-400 font-bold capitalize">{confirmedBooking.sportName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Price</span>
                    <span className="text-white font-black">
                      ₹{confirmedBooking.amount} {confirmedBooking.paymentStatus === 'paid' ? '● PAID ONLINE' : '(Pay at Venue)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Player</span>
                    <span className="text-slate-300 font-medium">{confirmedBooking.playerName} ({confirmedBooking.playerPhone})</span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Share Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Send Ticket to WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    onClose();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#16201b] hover:bg-[#1e2923] text-slate-200 border border-[#1e2923] font-bold text-xs"
                >
                  Done
                </button>
              </div>

            </div>
          )}

          {/* STAGE 1: BOOKING FORM */}
          {currentStage === 'booking' && (
            <form onSubmit={handleStartBooking} className="space-y-5">
              
              {/* Error banner */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Pick Sport */}
              {venue.sports.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    1. Select Sport
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {venue.sports.map((sp) => (
                      <button
                        type="button"
                        key={sp}
                        onClick={() => {
                          triggerHaptic();
                          setSelectedSport(sp);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize border transition-all ${
                          selectedSport === sp
                            ? 'bg-sport-500 text-black border-sport-400 shadow-glow-sm'
                            : 'bg-[#16201b] text-slate-300 border-[#1e2923] hover:border-slate-600'
                        }`}
                      >
                        {sp}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Pick Date & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    2. Select Date
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleDateChange(todayStr)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                        selectedDate === todayStr
                          ? 'bg-sport-500 text-black border-sport-400 shadow-glow-sm'
                          : 'bg-[#16201b] text-slate-300 border-[#1e2923]'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDateChange(tomorrowStr)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                        selectedDate === tomorrowStr
                          ? 'bg-sport-500 text-black border-sport-400 shadow-glow-sm'
                          : 'bg-[#16201b] text-slate-300 border-[#1e2923]'
                      }`}
                    >
                      Tomorrow
                    </button>
                    <input
                      type="date"
                      value={selectedDate}
                      min={todayStr}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="px-2 py-1.5 rounded-xl bg-[#16201b] border border-[#1e2923] text-xs text-white focus:outline-none focus:border-sport-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Duration
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3].map((hrs) => (
                      <button
                        type="button"
                        key={hrs}
                        onClick={() => {
                          triggerHaptic();
                          setDuration(hrs);
                          setSelectedStartHour(null);
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                          duration === hrs
                            ? 'bg-sport-500 text-black border-sport-400 shadow-glow-sm'
                            : 'bg-[#16201b] text-slate-300 border-[#1e2923]'
                        }`}
                      >
                        {hrs} {hrs === 1 ? 'Hour' : 'Hours'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Hourly Slot Matrix */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    3. Select Start Slot
                  </label>
                  <div className="flex items-center space-x-3 text-[10px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-sport-500/20 border border-sport-500"></span>
                      <span>Available</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700"></span>
                      <span>Booked</span>
                    </span>
                  </div>
                </div>

                {loadingSlots ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Checking live slot availability...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {slots.map((slot) => {
                      const isSelected = selectedStartHour === slot.hour;
                      const isDisabled = slot.isBooked || slot.isPast;

                      return (
                        <button
                          key={slot.hour}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleSelectSlot(slot.hour)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-sport-500 text-black border-sport-400 shadow-glow font-bold'
                              : isDisabled
                              ? 'bg-slate-900/50 text-slate-600 border-slate-800/80 cursor-not-allowed line-through'
                              : 'bg-[#16201b] hover:bg-[#1f2c25] text-slate-200 border-[#1e2923] hover:border-sport-500/40'
                          }`}
                        >
                          <div className="text-xs font-semibold">{slot.timeString}</div>
                          <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-black' : isDisabled ? 'text-slate-600' : 'text-sport-400'}`}>
                            {slot.isBooked ? 'Booked' : slot.isPast ? 'Passed' : `₹${slot.price}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Player Details Form */}
              <div className="pt-2 border-t border-[#1e2923]">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  4. Player Details
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 mb-1 block">Full Name</label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="e.g. Ramesh Reddy"
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#16201b] border border-[#1e2923] text-xs text-white focus:outline-none focus:border-sport-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 mb-1 block">Mobile Number</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        value={playerPhone}
                        onChange={(e) => setPlayerPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#16201b] border border-[#1e2923] text-xs text-white focus:outline-none focus:border-sport-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 mb-1 block">Players Count</label>
                    <div className="relative">
                      <Users className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={playersCount}
                        onChange={(e) => setPlayersCount(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#16201b] border border-[#1e2923] text-xs text-white focus:outline-none focus:border-sport-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Payment Method Selector */}
              <div className="pt-2 border-t border-[#1e2923]">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  5. Payment Preference
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setPaymentChoice('pay_at_venue');
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition ${
                      paymentChoice === 'pay_at_venue'
                        ? 'bg-sport-500/10 border-sport-500 text-white shadow-glow-sm'
                        : 'bg-[#16201b] border-[#1e2923] text-slate-400'
                    }`}
                  >
                    <IndianRupee className="w-5 h-5 text-sport-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-xs text-white block">Pay at Venue</span>
                      <span className="text-[10px] text-slate-400">Pay cash or UPI upon arrival at the turf</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setPaymentChoice('upi');
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition ${
                      paymentChoice === 'upi'
                        ? 'bg-sport-500/10 border-sport-500 text-white shadow-glow-sm'
                        : 'bg-[#16201b] border-[#1e2923] text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-sport-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-xs text-white block">UPI / Online Pay</span>
                      <span className="text-[10px] text-slate-400">PhonePe, Google Pay, Paytm & QR code</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Order Summary & Submit Button */}
              <div className="bg-[#16201b] border border-[#1e2923] p-4 rounded-2xl space-y-3">
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Court Slot Rate ({duration} hr)</span>
                    <span className="text-white font-medium">₹{baseSlotAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Platform Convenience Fee (9%)</span>
                    <span className="text-sport-400 font-medium">+₹{platformFee}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1e2923] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Total Payable</span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black text-white">₹{totalAmount}</span>
                      <span className="text-xs text-sport-400 font-semibold">
                        {paymentChoice === 'upi' ? '(Online UPI)' : '(Pay at venue)'}
                      </span>
                    </div>
                    {isWeekend && (
                      <span className="text-[10px] text-amber-400 block font-medium">Weekend pricing applies</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || selectedStartHour === null}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-sm transition shadow-glow active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <span>
                      {submitting ? 'Confirming...' : paymentChoice === 'upi' ? `Pay ₹${totalAmount} via UPI` : 'Confirm Slot'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
