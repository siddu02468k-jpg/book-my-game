import React from 'react';
import { Search, ChevronRight, Zap, CheckCircle2, ShieldCheck, Trophy, ArrowRight } from 'lucide-react';
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
  return (
    <div className="space-y-8 pb-20">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#14231b] via-[#0f1814] to-[#0a0f0d] border border-[#1e2923] p-6 md:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sport-500/10 border border-sport-500/20 text-sport-400 text-xs font-bold mb-4 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-sport-400 animate-pulse"></span>
            <span>Now Live across Kurnool</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none">
            Your Game. <br />
            <span className="text-sport-400 underline decoration-sport-500/40">Your Slot.</span>
          </h2>

          <p className="mt-3 text-sm text-slate-300 max-w-lg leading-relaxed">
            Book cricket nets, football turfs, badminton courts, and swimming pools in Kurnool in seconds. Zero advance payment — pay directly at the venue!
          </p>

          {/* Quick Search Form */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onExecuteSearch()}
                placeholder="Search venue or area (e.g. Budhawarpet, Joharapuram)..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#0a0f0d] border border-[#1e2923] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sport-500 transition shadow-inner"
              />
            </div>

            <button
              onClick={() => {
                triggerHaptic();
                onExecuteSearch();
              }}
              className="px-6 py-3 rounded-2xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs transition shadow-glow active:scale-95 flex items-center justify-center space-x-1"
            >
              <span>Find Slots</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Athletic Accent Backdrop */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-sport-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Pick Your Sport Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Pick Your Sport</h3>
            <p className="text-xs text-slate-400">Discover dedicated courts & arenas</p>
          </div>
          <button
            onClick={() => {
              triggerHaptic();
              onExploreAll();
            }}
            className="text-xs font-bold text-sport-400 hover:underline flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {sports.map((sport) => (
            <button
              key={sport.slug}
              onClick={() => {
                triggerHaptic();
                onSelectSport(sport.slug);
              }}
              className="bg-[#111815] hover:bg-[#16221c] border border-[#1e2923] hover:border-sport-500/40 p-4 rounded-2xl flex flex-col items-center justify-center transition-all group active:scale-95 shadow-md"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{sport.emoji}</span>
              <span className="text-xs font-bold text-white group-hover:text-sport-400 transition-colors">
                {sport.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Trending in Kurnool */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Trending in Kurnool</h3>
            <p className="text-xs text-slate-400">Top-rated turfs and courts with instant slots</p>
          </div>
          <button
            onClick={() => {
              triggerHaptic();
              onExploreAll();
            }}
            className="text-xs font-bold text-sport-400 hover:underline flex items-center space-x-1"
          >
            <span>See Catalog</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {trendingVenues.length === 0 ? (
          <div className="bg-[#111815] border border-dashed border-sport-500/30 rounded-3xl p-8 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-sport-500/10 border border-sport-500/30 text-sport-400 flex items-center justify-center mx-auto shadow-glow-sm">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-black text-white uppercase">Be the First Sports Venue Listed in Kurnool!</h4>
              <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
                All pre-populated dummy venues have been removed. Are you a genuine turf or sports club owner in Kurnool? Register your ground with photos, verification & your receiving UPI ID to start accepting online player bookings directly!
              </p>
            </div>
            <div>
              <button
                onClick={() => {
                  triggerHaptic();
                  onOpenOwner();
                }}
                className="px-6 py-3 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow transition active:scale-95"
              >
                + Register & Verify Your Turf Now
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trendingVenues.slice(0, 3).map((venue) => (
              <VenueCard key={venue.id} venue={venue} onSelect={onSelectVenue} />
            ))}
          </div>
        )}
      </div>

      {/* How it Works */}
      <div className="bg-[#111815] border border-[#1e2923] rounded-3xl p-6 sm:p-8">
        <h3 className="text-base font-black text-white uppercase tracking-tight text-center mb-6">
          How Book My Game Works
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-3">
            <div className="w-12 h-12 rounded-2xl bg-sport-500/10 border border-sport-500/30 flex items-center justify-center font-black text-sport-400 text-lg mb-3">
              1
            </div>
            <h4 className="font-bold text-sm text-white">Find Your Turf</h4>
            <p className="text-xs text-slate-400 mt-1">
              Filter by sport, area in Kurnool, and price. Check photos, amenities, and user ratings.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-3">
            <div className="w-12 h-12 rounded-2xl bg-sport-500/10 border border-sport-500/30 flex items-center justify-center font-black text-sport-400 text-lg mb-3">
              2
            </div>
            <h4 className="font-bold text-sm text-white">Pick a Live Slot</h4>
            <p className="text-xs text-slate-400 mt-1">
              Select date & duration. Live slot grid ensures zero double-booking errors.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-3">
            <div className="w-12 h-12 rounded-2xl bg-sport-500/10 border border-sport-500/30 flex items-center justify-center font-black text-sport-400 text-lg mb-3">
              3
            </div>
            <h4 className="font-bold text-sm text-white">Pay at Venue & Play</h4>
            <p className="text-xs text-slate-400 mt-1">
              Get an instant booking reference code. Pay cash or UPI directly when you arrive!
            </p>
          </div>
        </div>
      </div>

      {/* Own a Sports Venue Banner */}
      <div className="bg-gradient-to-r from-sport-950/80 via-[#111815] to-[#0a0f0d] border border-sport-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-sport-500/20 text-sport-300 border border-sport-500/30">
            Venue Operators
          </span>
          <h3 className="text-xl font-black text-white uppercase mt-2">
            Own a turf or sports arena in Kurnool?
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            List your facility for free, manage operating schedules, prevent double-bookings, and track your revenue online.
          </p>
        </div>

        <button
          onClick={() => {
            triggerHaptic();
            onOpenOwner();
          }}
          className="whitespace-nowrap px-6 py-3 rounded-2xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow transition active:scale-95"
        >
          Open Turf Owner Portal
        </button>
      </div>

    </div>
  );
};
