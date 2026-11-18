import React from 'react';
import { Star, MapPin, ChevronRight, ShieldCheck, Clock, Zap, Sparkles } from 'lucide-react';
import { Venue } from '../types';
import { triggerHaptic } from '../utils/device';

interface VenueCardProps {
  venue: Venue;
  onSelect: (venue: Venue) => void;
}

export const VenueCard: React.FC<VenueCardProps> = ({ venue, onSelect }) => {
  const getSportEmoji = (slug: string) => {
    switch (slug) {
      case 'badminton': return '🏸';
      case 'cricket': return '🏏';
      case 'football': return '⚽';
      case 'swimming': return '🏊';
      case 'tennis': return '🎾';
      case 'basketball': return '🏀';
      default: return '🏅';
    }
  };

  return (
    <div 
      onClick={() => {
        triggerHaptic('medium');
        onSelect(venue);
      }}
      className="bg-gradient-to-b from-[#121a15] to-[#0c120e] border border-[#1e2923] hover:border-sport-500/50 rounded-3xl overflow-hidden transition-all duration-300 group flex flex-col justify-between shadow-xl hover:shadow-glow-card cursor-pointer transform hover:-translate-y-1"
    >
      <div>
        {/* Cover Image & Badges */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-950">
          <img
            src={venue.images[0] || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800'}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c120e] via-black/20 to-black/50"></div>

          {/* Rating Pill */}
          <div className="absolute top-3.5 right-3.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center space-x-1 border border-white/10 text-xs font-bold text-amber-400 shadow-md">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{venue.rating}</span>
            <span className="text-[10px] text-slate-400 font-normal">({venue.reviewCount})</span>
          </div>

          {/* Verified Owner, Live Slots & Features */}
          <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5">
            {venue.isVerified && (
              <span className="bg-gradient-to-r from-emerald-500 to-sport-400 text-black text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-glow-sm flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
                <span>Verified Turf</span>
              </span>
            )}
            {venue.isFeatured && (
              <span className="bg-sport-500 text-black text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-glow-sm flex items-center space-x-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Featured</span>
              </span>
            )}
            {venue.isIndoor && (
              <span className="bg-black/60 text-slate-200 text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10">
                Indoor AC
              </span>
            )}
          </div>

          {/* Live Open Slots Tag & Sports Rail */}
          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between gap-1.5">
            <div className="flex flex-wrap gap-1">
              {venue.sports.map((sport) => (
                <span
                  key={sport}
                  className="text-[10px] font-bold bg-[#0a0f0d]/90 backdrop-blur-md text-sport-400 border border-sport-500/30 px-2 py-0.5 rounded-lg flex items-center space-x-1 shadow-sm"
                >
                  <span>{getSportEmoji(sport)}</span>
                  <span className="capitalize">{sport}</span>
                </span>
              ))}
            </div>

            <div className="bg-sport-500/20 backdrop-blur-md border border-sport-500/40 text-sport-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sport-400 animate-pulse"></span>
              <span>Slots Open</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-sport-400 flex-shrink-0" />
            <span className="font-semibold text-slate-300">{venue.area}, Kurnool</span>
          </div>

          <h3 className="font-black text-base sm:text-lg text-white group-hover:text-sport-400 transition-colors tracking-tight line-clamp-1">
            {venue.name}
          </h3>

          {venue.pitchType && (
            <div className="mt-1 flex items-center space-x-2 text-[11px]">
              <span className="font-mono text-sport-400 bg-sport-500/10 border border-sport-500/20 px-2 py-0.5 rounded-md">
                🏟️ {venue.pitchType}
              </span>
              <span className="text-slate-400 flex items-center space-x-1 text-[10px]">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{venue.openHour}:00 - {venue.closeHour}:00</span>
              </span>
            </div>
          )}

          <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {venue.description}
          </p>

          {/* Amenities snippets */}
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {venue.amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium bg-[#16221b] text-slate-300 px-2.5 py-1 rounded-lg border border-[#1e2923]"
              >
                ✓ {amenity}
              </span>
            ))}
            {venue.amenities.length > 3 && (
              <span className="text-[10px] text-slate-500 px-1 py-1 font-semibold">
                +{venue.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer / Price & Action */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="pt-3.5 border-t border-[#1e2923] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Starts from</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-black text-white">₹{venue.pricePerHour}</span>
              <span className="text-xs text-slate-400 font-medium">/ hr</span>
            </div>
            {venue.weekendPricePerHour && venue.weekendPricePerHour !== venue.pricePerHour && (
              <span className="text-[9px] text-amber-400/90 block">
                ₹{venue.weekendPricePerHour}/hr on weekends
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('heavy');
              onSelect(venue);
            }}
            className="flex items-center space-x-1.5 bg-sport-500 hover:bg-sport-400 text-black font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all shadow-glow active:scale-95 group-hover:shadow-glow-neon"
          >
            <span>Book Slot</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
