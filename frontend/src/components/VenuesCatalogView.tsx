import React, { useState } from 'react';
import { Search, MapPin, Navigation, RefreshCw, X } from 'lucide-react';
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
  }

  return (
    <div className="space-y-5 pb-20">
      
      {/* Search & Filters Header */}
      <div className="bg-[#111815] border border-[#1e2923] p-4 rounded-2xl space-y-3">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search venue name, area, or facility..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sport-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Sport Pills */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Area Selector */}
          <select
            value={selectedArea}
            onChange={(e) => {
              triggerHaptic();
              onSelectArea(e.target.value);
            }}
            className="px-3 py-2 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-xs text-slate-300 focus:outline-none focus:border-sport-500"
          >
            <option value="all">📍 All Areas in Kurnool</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => {
              triggerHaptic();
              onSelectSort(e.target.value);
            }}
            className="px-3 py-2 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-xs text-slate-300 focus:outline-none focus:border-sport-500"
          >
            <option value="rating">★ Highest Rated</option>
            <option value="nearest">📍 Nearest to Me</option>
            <option value="price_asc">₹ Price: Low to High</option>
            <option value="price_desc">₹ Price: High to Low</option>
          </select>

          {/* GPS Nearest Trigger Button */}
          <button
            onClick={handleGetNearest}
            disabled={locating}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center space-x-1 transition ${
              sortBy === 'nearest'
                ? 'bg-sport-500 text-black border-sport-400 shadow-glow-sm'
                : 'bg-[#16201b] text-slate-300 border-[#1e2923] hover:border-sport-500/40'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Locating...' : 'Nearest Turfs'}</span>
          </button>

          {(selectedSport !== 'all' || selectedArea !== 'all' || searchQuery || sortBy !== 'rating') && (
            <button
              onClick={() => {
                triggerHaptic();
                setUserLocation(null);
                onResetFilters();
              }}
              className="text-xs text-sport-400 hover:underline px-2 py-1 font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}

        </div>

        {/* Horizontal Sport Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 smooth-scroll">
          <button
            onClick={() => {
              triggerHaptic();
              onSelectSport('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition ${
              selectedSport === 'all'
                ? 'bg-sport-500 text-black border-sport-400 shadow-glow-sm'
                : 'bg-[#16201b] text-slate-400 border-[#1e2923] hover:text-white'
            }`}
          >
            All Sports
          </button>
          {sports.map((sp) => (
            <button
              key={sp.slug}
              onClick={() => {
                triggerHaptic();
                onSelectSport(sp.slug);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border flex items-center space-x-1 transition ${
                selectedSport === sp.slug
                  ? 'bg-sport-500 text-black border-sport-400 shadow-glow-sm'
                  : 'bg-[#16201b] text-slate-400 border-[#1e2923] hover:text-white'
              }`}
            >
              <span>{sp.emoji}</span>
              <span>{sp.name}</span>
            </button>
          ))}
        </div>

      </div>

      {/* Catalog Results Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
          <span>Showing {displayVenues.length} sports facilities</span>
          {userLocation && sortBy === 'nearest' && (
            <span className="text-sport-400 font-semibold flex items-center space-x-1">
              <MapPin className="w-3 h-3" />
              <span>Sorted by distance from your location</span>
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-sport-400" />
            <span>Finding verified courts...</span>
          </div>
        ) : displayVenues.length === 0 ? (
          <div className="text-center py-16 bg-[#111815] border border-dashed border-[#1e2923] rounded-3xl p-6">
            <p className="text-base font-bold text-white uppercase">
              {venues.length === 0 ? 'No Turfs Registered in Kurnool Yet' : 'No venues found'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {venues.length === 0
                ? 'Only verified turf owners who register their grounds with photos and receiving UPI appear here. Are you a venue owner? Register your turf in the Owner Portal!'
                : 'No matching sports venues in Kurnool for your current filters. Try resetting your search.'}
            </p>
            {venues.length > 0 && (
              <button
                onClick={onResetFilters}
                className="mt-4 px-4 py-2 rounded-xl bg-sport-500 text-black text-xs font-bold shadow-glow-sm"
              >
                Show All Venues
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
