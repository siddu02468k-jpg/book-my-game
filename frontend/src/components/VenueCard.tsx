import React from 'react';
import { Star, MapPin, ChevronRight, Zap } from 'lucide-react';
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
    <div className="bg-[#111815] border border-[#1e2923] hover:border-sport-500/40 rounded-2xl overflow-hidden transition-all duration-200 group flex flex-col justify-between shadow-lg">
      <div>
        {/* Cover Image & Badges */}
        <div className="relative h-44 w-full overflow-hidden bg-slate-900">
          <img
            src={venue.images[0] || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800'}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111815] via-transparent to-black/40"></div>

          {/* Rating Pill */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center space-x-1 border border-white/10 text-xs font-bold text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{venue.rating}</span>
            <span className="text-[10px] text-slate-400 font-normal">({venue.reviewCount})</span>
          </div>

          {/* Featured or Indoor Badge */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {venue.isFeatured && (
              <span className="bg-sport-500 text-black text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-glow-sm">
                Featured
              </span>
            )}
            {venue.isIndoor && (
              <span className="bg-black/60 text-slate-200 text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                Indoor AC
              </span>
            )}
          </div>

          {/* Sports Pills */}
          <div className="absolute bottom-2 left-3 flex flex-wrap gap-1.5">
            {venue.sports.map((sport) => (
              <span
                key={sport}
                className="text-[11px] font-semibold bg-[#0a0f0d]/80 backdrop-blur-md text-sport-400 border border-sport-500/20 px-2 py-0.5 rounded-md flex items-center space-x-1"
              >
                <span>{getSportEmoji(sport)}</span>
                <span className="capitalize">{sport}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4">
          <div className="flex items-center space-x-1 text-slate-400 text-xs mb-1">
            <MapPin className="w-3.5 h-3.5 text-sport-400 flex-shrink-0" />
            <span className="font-medium text-slate-300">{venue.area}, Kurnool</span>
          </div>

          <h3 className="font-bold text-base text-white group-hover:text-sport-400 transition-colors">
            {venue.name}
          </h3>

          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {venue.description}
          </p>

          {/* Amenities snippets */}
          <div className="mt-3 flex flex-wrap gap-1">
            {venue.amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-[#16201b] text-slate-400 px-2 py-0.5 rounded border border-[#1e2923]"
              >
                ✓ {amenity}
              </span>
            ))}
            {venue.amenities.length > 3 && (
              <span className="text-[10px] text-slate-500 px-1 py-0.5">
                +{venue.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer / Price & Action */}
      <div className="p-4 pt-0">
        <div className="pt-3 border-t border-[#1e2923] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Starts from</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-lg font-black text-white">₹{venue.pricePerHour}</span>
              <span className="text-xs text-slate-400">/ hour</span>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic();
              onSelect(venue);
            }}
            className="flex items-center space-x-1 bg-sport-500 hover:bg-sport-400 text-black font-extrabold px-3.5 py-2 rounded-xl text-xs transition shadow-glow-sm active:scale-95"
          >
            <span>Book Slot</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
