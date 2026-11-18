import React from 'react';
import { Search, ChevronRight, Zap, ShieldCheck, Trophy, ArrowRight, Sparkles, MapPin, CheckCircle2, QrCode, Banknote } from 'lucide-react';
import { Venue, Sport } from '../types';
import { VenueCard } from './VenueCard';
import { triggerHaptic } from '../utils/device';

interface LandingViewProps {
  sports: Sport[];
  trendingVenues: Venue[];
  onSelectSport: (sportSlug: string) => void;
  onSelectVenue: (venue: Venue) => void;
  onExploreAll: () => void;
  onOpenOwner: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExecuteSearch: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  sports,
  trendingVenues,
  onSelectSport,
  onSelectVenue,
  onExploreAll,
  onOpenOwner,
  searchQuery,
  onSearchChange,
  onExecuteSearch,
}) => {
  const quickAreas = ['Budhawarpet', 'Joharapuram', 'Fort Area', 'River View', 'Nandyal Checkpost'];

  return (
    <div className="space-y-10 pb-20">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#16271e] via-[#0f1a14] to-[#070d0a] border border-sport-500/30 p-6 sm:p-10 md:p-12 shadow-2xl">
        {/* Stadium Floodlight Visual Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sport-500/20 via-sport-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-gradient-to-tr from-sport-500/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl">
          
          {/* Animated Status Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sport-500/10 border border-sport-500/30 text-sport-400 text-xs font-bold mb-5 uppercase tracking-wider backdrop-blur-md shadow-glow-sm">
            <span className="w-2 h-2 rounded-full bg-sport-400 animate-pulse"></span>
            <span>Live Turf Booking Across Kurnool</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-tight leading-none drop-shadow-md">
            Your Game. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sport-400 via-emerald-300 to-sport-500">
              Your Live Slot.
            </span>
          </h1>

          <p className="mt-4 text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
            Reserve cricket nets, football turfs, badminton courts, and sports grounds in Kurnool in seconds. <strong className="text-white font-bold">Zero advance payment</strong> — pay directly at the venue!
          </p>

          {/* Quick Search Bar */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-sport-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onExecuteSearch()}
                placeholder="Search venue name, sport or area in Kurnool..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#09110d]/90 border border-[#1e2923] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sport-500 focus:ring-1 focus:ring-sport-500 transition shadow-inner"
              />
            </div>

            <button
              onClick={() => {
                triggerHaptic('heavy');
                onExecuteSearch();
              }}
              className="px-6 py-3 rounded-2xl bg-sport-500 hover:bg-sport-400 text-black font-black text-xs transition shadow-glow active:scale-95 flex items-center justify-center space-x-1.5 hover:shadow-glow-neon"
            >
              <span>Find Slots</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Area Tags */}
          <div className="mt-4 flex items-center flex-wrap gap-1.5 text-[11px] text-slate-400">
            <span className="text-slate-500 font-semibold mr-1">Popular Areas:</span>
            {quickAreas.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onSearchChange(area);
                  setTimeout(() => onExecuteSearch(), 50);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#111c16] hover:bg-[#182920] border border-[#1e2923] text-slate-300 hover:text-sport-400 transition"
              >
                {area}
              </button>
            ))}
          </div>

          {/* Key Trust Signals */}
          <div className="mt-6 pt-5 border-t border-[#1e2923]/60 grid grid-cols-3 gap-2 text-[11px] text-slate-300">
            <div className="flex items-center space-x-1.5">
              <Banknote className="w-4 h-4 text-sport-400 flex-shrink-0" />
              <span>Zero Advance Pay</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Verified Grounds</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <QrCode className="w-4 h-4 text-sport-400 flex-shrink-0" />
              <span>Instant Match Pass</span>
            </div>
          </div>

        </div>
      </div>

      {/* Pick Your Sport — Horizontal Swipe Rail on Mobile, Grid on Desktop */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center space-x-2">
              <span>Pick Your Sport</span>
              <Sparkles className="w-4 h-4 text-sport-400" />
            </h3>
            <p className="text-xs text-slate-400">Dedicated courts, nets & turf arenas in Kurnool</p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onExploreAll();
            }}
            className="text-xs font-bold text-sport-400 hover:underline flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Rail on Mobile, 6-col on Tablet/Desktop */}
        <div className="flex md:grid md:grid-cols-6 gap-3 overflow-x-auto pb-2 no-scrollbar smooth-scroll">
          {sports.map((sport) => (
            <button
              key={sport.slug}
              onClick={() => {
                triggerHaptic('medium');
                onSelectSport(sport.slug);
              }}
              className="flex-shrink-0 min-w-[130px] md:min-w-0 bg-gradient-to-b from-[#131d17] to-[#0c130f] hover:from-[#18271e] hover:to-[#0f1c14] border border-[#1e2923] hover:border-sport-500/50 p-4 rounded-2xl flex flex-col items-center justify-center transition-all group active:scale-95 shadow-lg hover:shadow-glow-sm"
            >
              <span className="text-3xl mb-2 group-hover:scale-115 transition-transform duration-200">
                {sport.emoji}
              </span>
              <span className="text-xs font-black text-white group-hover:text-sport-400 transition-colors">
                {sport.name}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 group-hover:text-slate-400 font-medium">
                Live Slots
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Trending Grounds in Kurnool */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
              Featured Grounds & Turfs
            </h3>
            <p className="text-xs text-slate-400">Verified Kurnool sports facilities with instant online pass</p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onExploreAll();
            }}
            className="text-xs font-bold text-sport-400 hover:underline flex items-center space-x-1"
          >
            <span>See All Venues</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {trendingVenues.length === 0 ? (
          <div className="bg-gradient-to-b from-[#121c16] to-[#0b120e] border border-dashed border-sport-500/40 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-sport-500/10 border border-sport-500/30 text-sport-400 flex items-center justify-center mx-auto shadow-glow-sm">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-black text-white uppercase">Be the First Turf Listed in Kurnool!</h4>
              <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
                Are you a genuine cricket turf, badminton court, or sports club owner in Kurnool? Register your ground with photos, verification & your receiving UPI ID to start accepting online player bookings directly!
              </p>
            </div>
            <div>
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  onOpenOwner();
                }}
                className="px-6 py-3 rounded-2xl bg-sport-500 hover:bg-sport-400 text-black font-black text-xs shadow-glow transition active:scale-95 hover:shadow-glow-neon"
              >
                + Register & Verify Your Turf Now
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {trendingVenues.slice(0, 3).map((venue) => (
              <VenueCard key={venue.id} venue={venue} onSelect={onSelectVenue} />
            ))}
          </div>
        )}
      </div>

      {/* How it Works — Visual 3-Step Flow */}
      <div className="bg-gradient-to-b from-[#111b15] to-[#0a0f0d] border border-[#1e2923] rounded-3xl p-6 sm:p-10 shadow-xl">
        <div className="text-center max-w-md mx-auto mb-8">
          <span className="text-[10px] font-black uppercase tracking-wider text-sport-400 bg-sport-500/10 border border-sport-500/20 px-3 py-1 rounded-full">
            Fast & Transparent
          </span>
          <h3 className="text-xl font-black text-white uppercase tracking-tight mt-2">
            How Book My Game Works
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Zero advance payments. 100% direct-to-ground UPI transfers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-[#142018]/60 border border-[#1e2923] flex flex-col items-center text-center group hover:border-sport-500/30 transition">
            <div className="w-12 h-12 rounded-2xl bg-sport-500/10 border border-sport-500/30 flex items-center justify-center font-black text-sport-400 text-lg mb-3 shadow-glow-sm group-hover:scale-105 transition-transform">
              1
            </div>
            <h4 className="font-black text-sm text-white">Select Ground & Court</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Filter by sport and area in Kurnool. Check authentic ground photos and amenities.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#142018]/60 border border-[#1e2923] flex flex-col items-center text-center group hover:border-sport-500/30 transition">
            <div className="w-12 h-12 rounded-2xl bg-sport-500/10 border border-sport-500/30 flex items-center justify-center font-black text-sport-400 text-lg mb-3 shadow-glow-sm group-hover:scale-105 transition-transform">
              2
            </div>
            <h4 className="font-black text-sm text-white">Pick Your Live Slot</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Choose morning, afternoon, or floodlit night slots. Real-time availability blocks double-booking.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#142018]/60 border border-[#1e2923] flex flex-col items-center text-center group hover:border-sport-500/30 transition">
            <div className="w-12 h-12 rounded-2xl bg-sport-500/10 border border-sport-500/30 flex items-center justify-center font-black text-sport-400 text-lg mb-3 shadow-glow-sm group-hover:scale-105 transition-transform">
              3
            </div>
            <h4 className="font-black text-sm text-white">Get Pass & Play</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Receive your 6-digit match pass code & QR code instantly. Transfer UPI directly to the ground!
            </p>
          </div>
        </div>
      </div>

      {/* Turf Owner Callout Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sport-950/90 via-[#121c17] to-[#0a0f0d] border border-sport-500/40 rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <span className="text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-sport-500/20 text-sport-300 border border-sport-500/30">
            For Sports Venue Owners
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Own a turf or badminton hall in Kurnool?
          </h3>
          <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
            List your sports ground for free, accept direct player UPI payments to your account, manage operating slots, and avoid double bookings.
          </p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('heavy');
            onOpenOwner();
          }}
          className="whitespace-nowrap px-7 py-3.5 rounded-2xl bg-sport-500 hover:bg-sport-400 text-black font-black text-xs shadow-glow transition active:scale-95 hover:shadow-glow-neon flex-shrink-0"
        >
          Open Turf Owner Portal
        </button>
      </div>

    </div>
  );
};
