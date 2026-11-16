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
import { NotFoundView } from './components/NotFoundView';
import { Breadcrumbs, BreadcrumbItem } from './components/Breadcrumbs';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { Footer } from './components/Footer';
import { PolicyModal, PolicyType } from './components/PolicyModal';
import { User, Venue, Sport, Booking, BackendHealth } from './types';
import { api } from './services/api';
import { initMobileStatusBar, triggerHaptic } from './utils/device';
import { updateSeoMeta } from './utils/seo';
import { saveLocalSnapshot, loadLocalSnapshot, needsRecovery, snapshotAge, snapshotAgeDays, dismissRecovery } from './utils/disasterRecovery';
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

  // Feedback Toasts & Policy Modals
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

  // Disaster Recovery
  const [drBannerVisible, setDrBannerVisible] = useState<boolean>(false);
  const [drSnapshot, setDrSnapshot] = useState<any>(null);
  const [drRestoring, setDrRestoring] = useState<boolean>(false);
  const [drRestoredMsg, setDrRestoredMsg] = useState<string | null>(null);
  const [snapshotInfo, setSnapshotInfo] = useState<{ age: string; days: number; count: number } | null>(null);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const newToast: ToastMessage = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      message
    };
    setToasts(prev => [...prev.slice(-3), newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // 1. Initial Launch
  useEffect(() => {
    // Purge any legacy dummy snapshot stored in the user's browser localStorage
    try {
      const snap = localStorage.getItem('bmg_dr_snapshot');
      if (snap && (snap.includes('ven_1') || snap.includes('Spartan Sports Arena'))) {
        localStorage.removeItem('bmg_dr_snapshot');
        localStorage.removeItem('bmg_dr_saved_at');
        localStorage.removeItem('bmg_dr_venues_count');
      }
    } catch {}

    initMobileStatusBar();
    // Immediate local state restore
    const localUser = api.getStoredUser();
    setUser(localUser);

    // Validate session with backend in background & fetch data
    initSessionAndData();
  }, []);

  // 2. Hash Change & Direct Anchor Navigation
  useEffect(() => {
    const handleHashChange = () => {
      const raw = window.location.hash.replace('#', '').trim().toLowerCase();
      if (raw === 'venues' || raw === 'bookings' || raw === 'owner' || raw === 'profile' || raw === 'home') {
        setCurrentTab(raw as TabType);
      } else if (raw === '404' || raw === 'notfound') {
        setCurrentTab('notfound');
      } else if (raw && !['top', ''].includes(raw)) {
        setCurrentTab('notfound');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 3. Dynamic Unique SEO Metadata, Titles & Canonical Tags
  useEffect(() => {
    switch (currentTab) {
      case 'home':
        updateSeoMeta(
          'Book My Game — Kurnool Turf & Court Hourly Slot Reservations',
          'Reserve cricket nets, football turfs, badminton courts, and swimming pools in Kurnool. Live slots, zero advance payment, pay directly at venue.',
          'https://bookmygame.kurnool.dev/'
        );
        break;
      case 'venues':
        updateSeoMeta(
          'Browse Sports Venues & Turfs in Kurnool | Book My Game',
          'Discover verified sports grounds, box cricket nets, and indoor badminton courts in Kurnool with live slots and real ground photos.',
          'https://bookmygame.kurnool.dev/#venues'
        );
        break;
      case 'bookings':
        updateSeoMeta(
          'My Match Passes & Bookings | Book My Game',
          'View your confirmed game slots and match pass QR code for turf check-in across Kurnool.',
          'https://bookmygame.kurnool.dev/#bookings'
        );
        break;
      case 'owner':
        updateSeoMeta(
          'Turf Owner Dashboard & Verification Portal | Book My Game',
          'Register and verify your Kurnool sports facility, upload original turf photos, set hourly rates, and receive direct player UPI payments.',
          'https://bookmygame.kurnool.dev/#owner'
        );
        break;
      case 'profile':
        updateSeoMeta(
          'Account & Player Settings | Book My Game',
          'Manage your verified player profile, Google credentials, and device login sessions.',
          'https://bookmygame.kurnool.dev/#profile'
        );
        break;
      case 'notfound':
        updateSeoMeta(
          '404 — Match Pitch Not Found | Book My Game',
          'The requested sports ground, slot, or page was not found on Book My Game Kurnool.',
          'https://bookmygame.kurnool.dev/#404'
        );
        break;
    }
  }, [currentTab]);

  const initSessionAndData = async () => {
    try {
      const freshUser = await api.verifySession();
      if (freshUser) {
        setUser(freshUser);
      }
    } catch (err) {
      console.warn('Session verification check:', err);
    }
    await fetchInitialData();
  };

  const handleLogout = () => {
    triggerHaptic();
    api.logout();
    setUser(null);
    setMyBookings([]);
    setOwnerVenues([]);
    setOwnerBookings([]);
    addToast('info', 'Signed Out', 'You have been safely signed out.');
  };

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
    } catch (err: any) {
      console.error('Failed to load venues', err);
      addToast('error', 'Error loading venues', err.message || 'Please check your connection');
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

      // Disaster recovery check
      try {
        const backupData = await api.exportBackup();
        saveLocalSnapshot(backupData);
        if (needsRecovery(venues.length)) {
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
      addToast('success', 'Restored Successfully', 'Venues and reservations restored from browser cache.');
      setTimeout(() => setDrRestoredMsg(null), 6000);
      await fetchOwnerData();
    } catch (err: any) {
      addToast('error', 'Restore Failed', err.message || 'Could not restore backup.');
    } finally {
      setDrRestoring(false);
    }
  };

  const handleDrSkip = () => {
    dismissRecovery();
    setDrBannerVisible(false);
    setDrSnapshot(null);
  };

  // Filter actions
  const handleSelectSport = (sportSlug: string) => {
    setSelectedSport(sportSlug);
    setCurrentTab('venues');
    window.location.hash = 'venues';
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
    window.location.hash = 'venues';
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
    addToast(
      'success',
      'Match Slot Confirmed!',
      `Pass #${booking.bookingRef} issued. Pay ₹${booking.amount} directly at the venue.`
    );
  };

  const handleCancelBooking = async (id: string) => {
    try {
      await api.cancelBooking(id);
      setMyBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      fetchOwnerData();
      addToast('info', 'Booking Cancelled', 'Your reservation was successfully cancelled.');
    } catch (err: any) {
      addToast('error', 'Cancellation Failed', err.message || 'Could not cancel booking.');
    }
  };

  // Dynamic Breadcrumb Trail
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    switch (currentTab) {
      case 'venues':
        return [{ label: 'Venues Catalog', active: true }];
      case 'bookings':
        return [{ label: 'My Bookings', active: true }];
      case 'owner':
        return [{ label: 'Turf Owner Console', active: true }];
      case 'profile':
        return [{ label: 'Profile & Settings', active: true }];
      case 'notfound':
        return [{ label: '404 Not Found', active: true }];
      default:
        return [];
    }
  };

  const handleTabNavigate = (tab: TabType) => {
    triggerHaptic();
    setCurrentTab(tab);
    window.location.hash = tab === 'home' ? '' : tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            onExploreAll={() => handleTabNavigate('venues')}
            onOpenOwner={() => handleTabNavigate('owner')}
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
            onExploreVenues={() => handleTabNavigate('venues')}
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
            onLogout={handleLogout}
          />
        );

      case 'notfound':
      default:
        return (
          <NotFoundView
            onGoHome={() => handleTabNavigate('home')}
            onExploreVenues={() => handleTabNavigate('venues')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans overflow-x-hidden">

      {/* Floating Action Feedback Toasts */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} />

      {/* Legal & Policy Modals */}
      <PolicyModal policy={activePolicy} onClose={() => setActivePolicy(null)} />

      {/* Disaster Recovery Banner */}
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
              Click <strong className="text-sport-400">Restore Now</strong> to recover all your venues, bookings, and reviews instantly.
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
                onClick={handleDrSkip}
                className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Banner After DR Restore */}
      {drRestoredMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[199] bg-[#111815] border border-sport-500/60 text-sport-400 text-sm font-bold px-5 py-3 rounded-2xl shadow-glow flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5" />
          <span>{drRestoredMsg}</span>
        </div>
      )}

      {/* Simulated Mobile Mode Frame */}
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
              onLogout={handleLogout}
              onOpenOwner={() => handleTabNavigate('owner')}
              onNavigateHome={() => handleTabNavigate('home')}
            />

            <main className="flex-1 overflow-y-auto px-4 py-4 smooth-scroll">
              {currentTab !== 'home' && (
                <Breadcrumbs items={getBreadcrumbs()} onNavigate={handleTabNavigate} />
              )}
              {renderContent()}
              <Footer onNavigate={handleTabNavigate} onOpenPolicy={setActivePolicy} />
            </main>

            <BottomNav
              currentTab={currentTab}
              onTabChange={handleTabNavigate}
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
            onLogout={handleLogout}
            onOpenOwner={() => handleTabNavigate('owner')}
            onNavigateHome={() => handleTabNavigate('home')}
          />

          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-5">
            {currentTab !== 'home' && (
              <Breadcrumbs items={getBreadcrumbs()} onNavigate={handleTabNavigate} />
            )}
            {renderContent()}
          </main>

          <Footer onNavigate={handleTabNavigate} onOpenPolicy={setActivePolicy} />

          <BottomNav
            currentTab={currentTab}
            onTabChange={handleTabNavigate}
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
          addToast(
            'success',
            'Signed In Successfully',
            `Welcome, ${loggedUser.name}! (${loggedUser.role === 'owner' ? 'Turf Owner' : 'Player'})`
          );
        }}
      />
    </div>
  );
};
