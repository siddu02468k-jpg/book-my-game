import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { LandingView } from './components/LandingView';
import { VenuesCatalogView } from './components/VenuesCatalogView';
import { MyBookingsView } from './components/MyBookingsView';
import { OwnerPortal } from './components/OwnerPortal';
import { SlotBookingModal } from './components/SlotBookingModal';
import { AuthModal } from './components/AuthModal';
import { ProfileView } from './components/ProfileView';
import { User, Venue, Sport, Booking, BackendHealth } from './types';
import { api } from './services/api';
import { initMobileStatusBar, triggerHaptic } from './utils/device';
import { Smartphone } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [user, setUser] = useState<User | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [ownerVenues, setOwnerVenues] = useState<Venue[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<Booking[]>([]);
  const [health, setHealth] = useState<BackendHealth>({ status: 'checking' });

  // Filters
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & UI States
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isSimulatedMobile, setIsSimulatedMobile] = useState<boolean>(false);
  const [loadingVenues, setLoadingVenues] = useState<boolean>(false);
  const [newBookingId, setNewBookingId] = useState<string | null>(null);

  useEffect(() => {
    initMobileStatusBar();
    setUser(api.getStoredUser());
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    await Promise.all([
      fetchHealth(),
      fetchSportsAndAreas(),
      fetchVenues(),
      fetchMyBookings(),
      fetchOwnerData()
    ]);
  };

  const fetchHealth = async () => {
    const status = await api.checkHealth();
    setHealth(status);
  };

  const fetchSportsAndAreas = async () => {
    try {
      const [sportsData, areasData] = await Promise.all([
        api.getSports(),
        api.getAreas()
      ]);
      setSports(sportsData);
      setAreas(areasData);
    } catch (err) {
      console.error('Failed to load sports/areas', err);
    }
  };

  const fetchVenues = async (customSport?: string, customArea?: string, customSort?: string, customSearch?: string) => {
    try {
      setLoadingVenues(true);
      const data = await api.getVenues({
        sport: customSport !== undefined ? customSport : selectedSport,
        area: customArea !== undefined ? customArea : selectedArea,
        sort: customSort !== undefined ? customSort : sortBy,
        search: customSearch !== undefined ? customSearch : searchQuery
      });
      setVenues(data);
    } catch (err) {
      console.error('Failed to load venues', err);
    } finally {
      setLoadingVenues(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const data = await api.getMyBookings();
      setMyBookings(data);
    } catch {
      // Ignored for unauthenticated users
    }
  };

  const fetchOwnerData = async () => {
    try {
      const [vData, bData] = await Promise.all([
        api.getOwnerVenues(),
        api.getOwnerBookings()
      ]);
      setOwnerVenues(vData);
      setOwnerBookings(bData);
    } catch {
      // Ignored
    }
  };

  // Filter actions
  const handleSelectSport = (sportSlug: string) => {
    setSelectedSport(sportSlug);
    setCurrentTab('venues');
    fetchVenues(sportSlug, selectedArea, sortBy, searchQuery);
  };

  const handleSelectArea = (area: string) => {
    setSelectedArea(area);
    fetchVenues(selectedSport, area, sortBy, searchQuery);
  };

  const handleSelectSort = (sort: string) => {
    setSortBy(sort);
    fetchVenues(selectedSport, selectedArea, sort, searchQuery);
  };

  const handleSearchExecute = () => {
    setCurrentTab('venues');
    fetchVenues(selectedSport, selectedArea, sortBy, searchQuery);
  };

  const handleResetFilters = () => {
    setSelectedSport('all');
    setSelectedArea('all');
    setSortBy('rating');
    setSearchQuery('');
    fetchVenues('all', 'all', 'rating', '');
  };

  const handleBookingSuccess = (booking: Booking) => {
    setNewBookingId(booking.id);
    setMyBookings(prev => [booking, ...prev]);
    fetchOwnerData();
  };

  const handleCancelBooking = async (id: string) => {
    await api.cancelBooking(id);
    setMyBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    fetchOwnerData();
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <LandingView
            sports={sports}
            trendingVenues={venues}
            onSelectSport={handleSelectSport}
            onSelectVenue={setSelectedVenue}
            onExploreAll={() => setCurrentTab('venues')}
            onOpenOwner={() => setCurrentTab('owner')}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onExecuteSearch={handleSearchExecute}
          />
        );

      case 'venues':
        return (
          <VenuesCatalogView
            venues={venues}
            sports={sports}
            areas={areas}
            selectedSport={selectedSport}
            onSelectSport={(sp) => {
              setSelectedSport(sp);
              fetchVenues(sp, selectedArea, sortBy, searchQuery);
            }}
            selectedArea={selectedArea}
            onSelectArea={handleSelectArea}
            sortBy={sortBy}
            onSelectSort={handleSelectSort}
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              fetchVenues(selectedSport, selectedArea, sortBy, q);
            }}
            onSelectVenue={setSelectedVenue}
            loading={loadingVenues}
            onResetFilters={handleResetFilters}
          />
        );

      case 'bookings':
        return (
          <MyBookingsView
            bookings={myBookings}
            onCancelBooking={handleCancelBooking}
            onExploreVenues={() => setCurrentTab('venues')}
            newBookingId={newBookingId}
          />
        );

      case 'owner':
        return (
          <OwnerPortal
            user={user}
            venues={ownerVenues}
            bookings={ownerBookings}
            onRefreshData={fetchOwnerData}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        );

      case 'profile':
        return (
          <ProfileView
            user={user}
            health={health}
            onRefreshHealth={fetchHealth}
            onOpenAuth={() => setIsAuthOpen(true)}
            onLogout={() => {
              api.logout();
              setUser(null);
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans">
      
      {/* Desktop Simulation Mode Frame */}
      {isSimulatedMobile ? (
        <div className="py-6 px-4 flex flex-col items-center justify-center min-h-screen bg-black">
          <div className="mb-3 flex items-center space-x-2 text-xs text-slate-400">
            <Smartphone className="w-4 h-4 text-sport-400" />
            <span>Simulated Mobile Phone (iOS / Android)</span>
            <button
              onClick={() => setIsSimulatedMobile(false)}
              className="ml-2 text-sport-400 hover:underline font-bold"
            >
              Exit Simulator
            </button>
          </div>

          <div className="w-full max-w-[410px] h-[840px] bg-background rounded-[48px] border-[8px] border-[#1e2923] shadow-glow relative flex flex-col overflow-hidden">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-[#1e2923] rounded-full z-50"></div>

            <Navbar
              user={user}
              health={health}
              isSimulatedMobile={isSimulatedMobile}
              onToggleMobilePreview={() => setIsSimulatedMobile(!isSimulatedMobile)}
              onOpenAuth={() => setIsAuthOpen(true)}
              onLogout={() => {
                api.logout();
                setUser(null);
              }}
              onOpenOwner={() => setCurrentTab('owner')}
            />

            <main className="flex-1 overflow-y-auto px-4 py-4 smooth-scroll">
              {renderContent()}
            </main>

            <BottomNav
              currentTab={currentTab}
              onTabChange={setCurrentTab}
              bookingsCount={myBookings.filter(b => b.status === 'confirmed').length}
            />
          </div>
        </div>
      ) : (
        <>
          <Navbar
            user={user}
            health={health}
            isSimulatedMobile={isSimulatedMobile}
            onToggleMobilePreview={() => setIsSimulatedMobile(!isSimulatedMobile)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onLogout={() => {
              api.logout();
              setUser(null);
            }}
            onOpenOwner={() => setCurrentTab('owner')}
          />

          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-5">
            {renderContent()}
          </main>

          <BottomNav
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            bookingsCount={myBookings.filter(b => b.status === 'confirmed').length}
          />
        </>
      )}

      {/* Modals */}
      <SlotBookingModal
        venue={selectedVenue}
        onClose={() => setSelectedVenue(null)}
        onBookingSuccess={handleBookingSuccess}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          fetchMyBookings();
          fetchOwnerData();
        }}
      />
    </div>
  );
};
