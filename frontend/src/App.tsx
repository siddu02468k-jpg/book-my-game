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
import { saveLocalSnapshot, loadLocalSnapshot, needsRecovery, snapshotAge, snapshotAgeDays } from './utils/disasterRecovery';
import { Smartphone, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';

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

  // Disaster Recovery
  const [drBannerVisible, setDrBannerVisible] = useState<boolean>(false);
  const [drSnapshot, setDrSnapshot] = useState<any>(null);
  const [drRestoring, setDrRestoring] = useState<boolean>(false);
  const [drRestoredMsg, setDrRestoredMsg] = useState<string | null>(null);
  const [snapshotInfo, setSnapshotInfo] = useState<{ age: string; days: number; count: number } | null>(null);

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

      // === DISASTER RECOVERY: Auto-snapshot to localStorage ===
      // Every time we successfully fetch owner data, save a full backup to browser storage
      try {
        const backupData = await api.exportBackup();
        saveLocalSnapshot(backupData);
        // Check if the server is empty but we have a snapshot (indicates fresh Render wipe)
        const venueCount = Array.isArray(vData) ? vData.length : 0;
        if (needsRecovery(venueCount)) {
          const snap = loadLocalSnapshot();
          if (snap) {
            setDrSnapshot(snap.backupData);
            setSnapshotInfo({
              age: snapshotAge(),
              days: snapshotAgeDays(),
              count: snap.venuesCount
            });
            setDrBannerVisible(true);
          }
        }
      } catch (snapErr) {
        console.warn('[DR] Snapshot failed (non-critical):', snapErr);
      }
    } catch {
      // Ignored
    }
  };

  const handleDrRestore = async () => {
    if (!drSnapshot) return;
    try {
      setDrRestoring(true);
      await api.restoreBackup(drSnapshot);
      setDrRestoredMsg('✅ All your venues and bookings have been restored successfully!');
      setDrBannerVisible(false);
      setTimeout(() => setDrRestoredMsg(null), 6000);
      await fetchOwnerData();
    } catch (err: any) {
      alert(err.message || 'Restore failed — try using the manual restore in Manager Console.');
    } finally {
      setDrRestoring(false);
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

      {/* ============================================================
          DISASTER RECOVERY BANNER
          Shown automatically when Render wipes data.json and we have
          a fresh localStorage snapshot to restore from.
      ============================================================ */}
      {drBannerVisible && drSnapshot && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#0f1512] border border-rose-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-950/60 text-rose-400 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">Server Data Wiped!</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Render redeployment detected — the server database has been reset.
                </p>
              </div>
            </div>

            <div className="bg-[#16201b] border border-sport-500/30 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Recovery Source</span>
                <span className="text-sport-400 font-bold">Your Browser Cache</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Snapshot saved</span>
                <span className="text-white font-bold">{snapshotInfo?.age || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Venues in snapshot</span>
                <span className="text-white font-bold">{snapshotInfo?.count || 0} venue(s)</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              A complete backup was automatically saved in your browser's local storage.
              Click <strong className="text-sport-400">Restore Now</strong> to recover all your venues, bookings, and reviews instantly — no file upload needed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDrRestore}
                disabled={drRestoring}
                className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-sm shadow-glow transition disabled:opacity-50 active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${drRestoring ? 'animate-spin' : ''}`} />
                <span>{drRestoring ? 'Restoring...' : 'Restore Now (Auto)'}</span>
              </button>
              <button
                onClick={() => setDrBannerVisible(false)}
                className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success banner after DR restore */}
      {drRestoredMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[199] bg-[#111815] border border-sport-500/60 text-sport-400 text-sm font-bold px-5 py-3 rounded-2xl shadow-glow flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5" />
          <span>{drRestoredMsg}</span>
        </div>
      )}
      
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
