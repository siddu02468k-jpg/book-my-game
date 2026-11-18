import React, { useState } from 'react';
import { Search, MapPin, Navigation, X, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Venue, Sport } from '../types';
import { VenueCard } from './VenueCard';
import { triggerHaptic } from '../utils/device';

interface VenuesCatalogViewProps {
  venues: Venue[];
  sports: Sport[];
  areas: string[];
  selectedSport: string;
  onSelectSport: (sport: string) => void;
  selectedArea: string;
  onSelectArea: (area: string) => void;
  sortBy: string;
  onSelectSort: (sort: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectVenue: (venue: Venue) => void;
  loading: boolean;
  onResetFilters: () => void;
}

// Haversine formula to compute distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// High-fidelity shimmer skeleton card
const VenueCardSkeleton: React.FC = () => (
  <div className="bg-[#111815] border border-[#1e2923] rounded-3xl overflow-hidden shadow-card animate-pulse">
    <div className="h-44 bg-gradient-to-r from-[#16201b] via-[#22332a] to-[#16201b] animate-shimmer relative" />
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-5 w-2/3 bg-[#1e2923] rounded-lg" />
        <div className="h-5 w-12 bg-[#1e2923] rounded-lg" />
      </div>
      <div className="h-3.5 w-1/2 bg-[#1a231e] rounded" />
      <div className="flex gap-1.5 pt-1">
        <div className="h-5 w-16 bg-[#1e2923] rounded-full" />
        <div className="h-5 w-16 bg-[#1e2923] rounded-full" />
      </div>
      <div className="pt-3 border-t border-[#1e2923] flex items-center justify-between">
        <div className="h-6 w-24 bg-[#1e2923] rounded-md" />
        <div className="h-8 w-28 bg-[#1e2923] rounded-xl" />
      </div>
    </div>
  </div>
);

export const VenuesCatalogView: React.FC<VenuesCatalogViewProps> = ({
  venues,
  sports,
  areas,
  selectedSport,
  onSelectSport,
  selectedArea,
  onSelectArea,
  sortBy,
  onSelectSort,
  searchQuery,
  onSearchChange,
  onSelectVenue,
  loading,
  onResetFilters,
}) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState<boolean>(false);

  const handleGetNearest = () => {
    triggerHaptic();
    setLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
          onSelectSort('nearest');
        },
        () => {
          // Fallback to Kurnool city center coordinates
          setUserLocation({ lat: 15.8281, lng: 78.0373 });
          setLocating(false);
          onSelectSort('nearest');
        },
        { timeout: 5000 }
      );
    } else {
      setUserLocation({ lat: 15.8281, lng: 78.0373 });
      setLocating(false);
      onSelectSort('nearest');
    }
  };

  // Compute sorted venues including distance if location is available
  let displayVenues = [...venues];
  if (sortBy === 'nearest' && userLocation) {
    displayVenues.sort((a, b) => {
      const distA = a.lat && a.lng ? calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng) : 999;
      const distB = b.lat && b.lng ? calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng) : 999;
      return distA - distB;
    });
  } else if (sortBy === 'price_asc') {
    displayVenues.sort((a, b) => a.pricePerHour - b.pricePerHour);
  } else if (sortBy === 'price_desc') {
    displayVenues.sort((a, b) => b.pricePerHour - a.pricePerHour);
  } else if (sortBy === 'rating') {
    displayVenues.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  const sortOptions = [
    { id: 'rating', label: '⭐ Highest Rated' },
    { id: 'nearest', label: '📍 Nearest' },
    { id: 'price_asc', label: '💰 Budget First' },
    { id: 'price_desc', label: '💎 Premium' },
  ];

  const hasActiveFilters = selectedSport !== 'all' || selectedArea !== 'all' || searchQuery.trim().length > 0 || sortBy !== 'rating';

  return (
    <div className="space-y-5 pb-20">
      
      {/* Page Title & Atmosphere */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-sport-500/10 border border-sport-500/20 text-sport-400 text-[10px] font-black uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3" />
            <span>Kurnool Ground Directory</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Sports Grounds &amp; Turfs in Kurnool
          </h1>
          <p className="text-xs text-slate-400">Verified turf owners with genuine slot availability and 100% direct court fees</p>
        </div>
      </div>

      {/* Search & Sticky Filter Header */}
      <div className="bg-[#111815]/95 backdrop-blur-xl border border-[#1e2923] p-4 rounded-3xl space-y-3 shadow-card">
        
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search venue name, area (e.g. Nandyal Checkpost, Joharapuram), or sport..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#0a0f0d] border border-[#1e2923] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sport-500 focus:ring-1 focus:ring-sport-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-[#1e2923]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          
          {/* Area Selector */}
          <div className="flex items-center space-x-1 bg-[#0a0f0d] border border-[#1e2923] rounded-xl px-2.5 py-1">
            <MapPin className="w-3.5 h-3.5 text-sport-400 flex-shrink-0" />
            <select
              value={selectedArea}
              onChange={(e) => {
                triggerHaptic();
                onSelectArea(e.target.value);
              }}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer py-1"
            >
              <option value="all" className="bg-[#0f1512] text-white">All Kurnool Areas</option>
              {areas.map((area) => (
                <option key={area} value={area} className="bg-[#0f1512] text-white">
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Sort Chips */}
          <div className="hidden sm:flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            {sortOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  triggerHaptic();
                  if (opt.id === 'nearest') {
                    handleGetNearest();
                  } else {
                    onSelectSort(opt.id);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition active:scale-95 ${
                  sortBy === opt.id
                    ? 'bg-sport-500 text-black border-sport-400 shadow-glow-sm'
                    : 'bg-[#16201b] text-slate-300 border-[#1e2923] hover:border-sport-500/40'
                }`}
              >
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile Sort Dropdown */}
          <div className="sm:hidden flex items-center space-x-1 bg-[#0a0f0d] border border-[#1e2923] rounded-xl px-2.5 py-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-sport-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => {
                triggerHaptic();
                if (e.target.value === 'nearest') {
                  handleGetNearest();
                } else {
                  onSelectSort(e.target.value);
                }
              }}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer py-1"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-[#0f1512] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* GPS Nearest Button (Mobile & Desktop) */}
          <button
            onClick={handleGetNearest}
            disabled={locating}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center space-x-1.5 transition active:scale-95 ${
              sortBy === 'nearest'
                ? 'bg-sport-500 text-black border-sport-400 shadow-glow-sm'
                : 'bg-[#16201b] text-slate-300 border-[#1e2923] hover:border-sport-500/40'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Locating...' : 'Near Me'}</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={() => {
                triggerHaptic();
                setUserLocation(null);
                onResetFilters();
              }}
              className="text-xs text-sport-400 hover:text-sport-300 px-2 py-1 font-bold ml-auto transition"
            >
              Reset Filters
            </button>
          )}

        </div>

        {/* Horizontal Sticky Sports Rail */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            onClick={() => {
              triggerHaptic();
              onSelectSport('all');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap border transition active:scale-95 ${
              selectedSport === 'all'
                ? 'bg-sport-500 text-black border-sport-400 shadow-glow-sm'
                : 'bg-[#16201b] text-slate-400 border-[#1e2923] hover:text-white'
            }`}
          >
            All Sports ({venues.length})
          </button>
          {sports.map((sp) => {
            const count = venues.filter((v) => v.sports.includes(sp.slug)).length;
            const isSelected = selectedSport === sp.slug;
            return (
              <button
                key={sp.slug}
                onClick={() => {
                  triggerHaptic();
                  onSelectSport(sp.slug);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border flex items-center space-x-1.5 transition active:scale-95 ${
                  isSelected
                    ? 'bg-sport-500 text-black border-sport-400 shadow-glow-sm'
                    : 'bg-[#16201b] text-slate-400 border-[#1e2923] hover:text-white hover:border-slate-700'
                }`}
              >
                <span>{sp.emoji}</span>
                <span>{sp.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/20 text-black' : 'bg-[#0f1512] text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Catalog Results Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
          <span>Showing {displayVenues.length} sports facilities</span>
          {userLocation && sortBy === 'nearest' && (
            <span className="text-sport-400 font-semibold flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>Sorted by GPS distance in Kurnool</span>
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <VenueCardSkeleton />
            <VenueCardSkeleton />
            <VenueCardSkeleton />
          </div>
        ) : displayVenues.length === 0 ? (
          <div className="text-center py-16 bg-[#111815] border border-dashed border-[#1e2923] rounded-3xl p-6 shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-[#16201b] border border-[#1e2923] flex items-center justify-center mx-auto text-2xl mb-3">
              🏟️
            </div>
            <p className="text-base font-black text-white uppercase tracking-tight">
              {venues.length === 0 ? 'No Turfs Registered in Kurnool Yet' : 'No Grounds Match Your Search'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              {venues.length === 0
                ? 'Only verified turf owners who register with court photos and receiving UPI appear here. Are you a venue owner? Register your turf in the Owner Portal!'
                : 'No matching sports venues in Kurnool for your current filters. Try resetting your area or sport selection.'}
            </p>
            {venues.length === 0 ? (
              <button
                onClick={() => {
                  triggerHaptic();
                  window.location.hash = 'owner';
                }}
                className="mt-5 px-6 py-3 rounded-2xl bg-sport-500 hover:bg-sport-400 text-black text-xs font-black shadow-glow transition active:scale-95 inline-flex items-center space-x-2"
              >
                <span>+ Register Your Turf Now</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  triggerHaptic();
                  onResetFilters();
                }}
                className="mt-5 px-5 py-2.5 rounded-2xl bg-sport-500 hover:bg-sport-400 text-black text-xs font-black shadow-glow-sm transition active:scale-95"
              >
                Show All Kurnool Venues
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} onSelect={onSelectVenue} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
