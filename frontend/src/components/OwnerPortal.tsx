import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Building2, 
  Calendar, 
  IndianRupee, 
  Check, 
  Power, 
  AlertCircle, 
  Sparkles, 
  QrCode, 
  Search, 
  CheckCircle2,
  ShieldAlert,
  Wallet,
  ExternalLink,
  ArrowUpRight,
  Edit2,
  X,
  Download,
  Upload,
  Database,
  ShieldCheck,
  Clock,
  Camera,
  Image,
  Trash2,
  MapPin,
  BadgeCheck,
  FileText,
  UploadCloud
} from 'lucide-react';
import { Venue, Booking, User } from '../types';
import { api } from '../services/api';
import { triggerHaptic } from '../utils/device';
import { snapshotAge, snapshotAgeDays, loadLocalSnapshot } from '../utils/disasterRecovery';

interface OwnerPortalProps {
  user: User | null;
  venues: Venue[];
  bookings: Booking[];
  onRefreshData: () => void;
  onOpenAuth: () => void;
}

export const OwnerPortal: React.FC<OwnerPortalProps> = ({
  user,
  venues,
  bookings,
  onRefreshData,
  onOpenAuth,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // QR Pass check-in state
  const [scanRef, setScanRef] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  // New venue form fields
  const [name, setName] = useState('');
  const [area, setArea] = useState('Budhawarpet');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [pitchType, setPitchType] = useState('FIFA Standard AstroTurf');
  const [pricePerHour, setPricePerHour] = useState(600);
  const [weekendPrice, setWeekendPrice] = useState(750);
  const [openHour, setOpenHour] = useState(6);
  const [closeHour, setCloseHour] = useState(23);
  const [sports, setSports] = useState<string[]>(['cricket']);
  const [amenitiesList, setAmenitiesList] = useState<string[]>([
    'Floodlights', 'Parking', 'Drinking Water', 'Changing Rooms', 'Washrooms'
  ]);
  const [description, setDescription] = useState('');

  // Turf Photos state (User rule: "ask them to upload the photos of turf")
  const [images, setImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');

  // Real Owner Verification state (User rule: "make sure they are the real owners of the turf")
  const [ownerFullName, setOwnerFullName] = useState(user?.name || '');
  const [ownerPhone, setOwnerPhone] = useState(user?.phone || '');
  const [ownerAltPhone, setOwnerAltPhone] = useState('');
  const [governmentIdType, setGovernmentIdType] = useState('Electricity Bill of Turf Facility');
  const [governmentIdNumber, setGovernmentIdNumber] = useState('');
  const [ownershipDocProof, setOwnershipDocProof] = useState<string>('');
  const [ownerDeclaration, setOwnerDeclaration] = useState(false);

  // Receiving UPI & Bank state (User rule: "ask other importent details like upi id and etc.")
  const [ownerUpiId, setOwnerUpiId] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setOwnershipDocProof(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    if (!urlInput.trim()) return;
    setImages((prev) => [...prev, urlInput.trim()]);
    setUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleSport = (sportSlug: string) => {
    setSports((prev) =>
      prev.includes(sportSlug)
        ? prev.length > 1
          ? prev.filter((s) => s !== sportSlug)
          : prev
        : [...prev, sportSlug]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setAmenitiesList((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const isOwner = user?.role === 'owner';

  // Method 1: Platform Commission Settlement & Turf UPI Management
  const [settleVenue, setSettleVenue] = useState<Venue | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleRef, setSettleRef] = useState<string>('');
  const [settling, setSettling] = useState<boolean>(false);
  const [settleSuccessMsg, setSettleSuccessMsg] = useState<string | null>(null);

  const [editingUpiVenueId, setEditingUpiVenueId] = useState<string | null>(null);
  const [editUpiValue, setEditUpiValue] = useState<string>('');
  const [savingUpi, setSavingUpi] = useState<boolean>(false);

  const handleStartEditUpi = (v: Venue) => {
    setEditingUpiVenueId(v.id);
    setEditUpiValue(v.ownerUpiId || '');
  };

  const handleSaveUpi = async (venueId: string) => {
    if (!editUpiValue.trim() || !editUpiValue.includes('@')) {
      alert('Please enter a valid UPI address (e.g. name@bank)');
      return;
    }
    try {
      setSavingUpi(true);
      await api.updateVenueUpi(venueId, editUpiValue.trim());
      triggerHaptic();
      setEditingUpiVenueId(null);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update UPI');
    } finally {
      setSavingUpi(false);
    }
  };

  const handleOpenSettle = (v: Venue) => {
    setSettleVenue(v);
    setSettleAmount(v.unpaidCommission || 0);
    setSettleRef('');
    setSettleSuccessMsg(null);
  };

  const handleConfirmSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleVenue) return;
    try {
      setSettling(true);
      const res = await api.settleCommission(settleVenue.id, settleAmount, settleRef || 'UPI_TRANSFER');
      triggerHaptic();
      setSettleSuccessMsg(res.message);
      onRefreshData();
      setTimeout(() => {
        setSettleVenue(null);
        setSettleSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Settlement failed');
    } finally {
      setSettling(false);
    }
  };

  // Data Backup & Restore
  const [exportingBackup, setExportingBackup] = useState<boolean>(false);
  const [restoringBackup, setRestoringBackup] = useState<boolean>(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  // Local DR snapshot info (read from localStorage on mount)
  const [localSnapAge, setLocalSnapAge] = useState<string>('—');
  const [localSnapDays, setLocalSnapDays] = useState<number>(0);
  const [localSnapCount, setLocalSnapCount] = useState<number>(0);

  useEffect(() => {
    const snap = loadLocalSnapshot();
    if (snap) {
      setLocalSnapAge(snapshotAge());
      setLocalSnapDays(snapshotAgeDays());
      setLocalSnapCount(snap.venuesCount);
    }
  }, []);

  // System Health Monitor
  const [healthData, setHealthData] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(false);

  const handleLoadHealth = async () => {
    try {
      setLoadingHealth(true);
      const data = await api.getSystemHealth();
      setHealthData(data);
    } catch (err: any) {
      alert(err.message || 'Failed to load system health');
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      setExportingBackup(true);
      triggerHaptic();
      const backupData = await api.exportBackup();
      const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", jsonStr);
      downloadAnchor.setAttribute("download", `bookmygame-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setBackupMessage('Database backup downloaded successfully to your device!');
      setTimeout(() => setBackupMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to download backup');
    } finally {
      setExportingBackup(false);
    }
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setRestoringBackup(true);
        const parsed = JSON.parse(event.target?.result as string);
        const res = await api.restoreBackup(parsed);
        triggerHaptic();
        setBackupMessage(res.message);
        onRefreshData();
        setTimeout(() => setBackupMessage(null), 5000);
      } catch (err: any) {
        alert(err.message || 'Invalid backup JSON file');
      } finally {
        setRestoringBackup(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleVerifyPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanRef.trim()) return;

    try {
      setVerifying(true);
      setVerifyMessage(null);
      setError(null);
      const res = await api.verifyPass(scanRef.trim());
      triggerHaptic();
      setVerifyMessage(res.message);
      setScanRef('');
      onRefreshData();
      setTimeout(() => setVerifyMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleBecomeOwner = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    try {
      triggerHaptic();
      await api.becomeOwner();
      onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to become owner');
    }
  };

  const handleToggleActive = async (venueId: string) => {
    try {
      triggerHaptic();
      await api.toggleVenueActive(venueId);
      onRefreshData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: 'completed' | 'cancelled', payment?: 'paid') => {
    try {
      triggerHaptic();
      await api.updateBookingStatus(bookingId, status, payment);
      onRefreshData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAddVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      // Validate Turf Photos rule
      if (images.length === 0) {
        throw new Error('Please upload at least 1 clear photo of your turf or sports facility.');
      }

      // Validate Real Owner Verification rules
      if (!ownerFullName.trim()) {
        throw new Error('Owner real legal name is required for verification.');
      }
      if (!ownerPhone.trim()) {
        throw new Error('Owner mobile number is required.');
      }
      if (!governmentIdNumber.trim()) {
        throw new Error(`Please provide the ${governmentIdType} document number to prove genuine ownership.`);
      }
      if (!ownerDeclaration) {
        throw new Error('Please agree to the Owner Declaration confirming genuine legal ownership.');
      }

      // Validate Receiving UPI ID
      const upi = ownerUpiId.trim();
      if (!upi || !upi.includes('@')) {
        throw new Error('Please enter a valid receiving UPI ID (e.g. yourname@okhdfcbank or 9876543210@ybl).');
      }

      await api.addOwnerVenue({
        name: name.trim(),
        area: area.trim(),
        address: address.trim(),
        googleMapsUrl: googleMapsUrl.trim(),
        pitchType: pitchType.trim(),
        pricePerHour,
        weekendPricePerHour: weekendPrice,
        openHour,
        closeHour,
        sports,
        amenities: amenitiesList,
        description: description.trim(),
        images,
        ownerFullName: ownerFullName.trim(),
        ownerPhone: ownerPhone.trim(),
        ownerAltPhone: ownerAltPhone.trim(),
        governmentIdType,
        governmentIdNumber: governmentIdNumber.trim(),
        ownershipDocProof,
        ownerUpiId: upi,
        bankAccountNumber: bankAccountNumber.trim(),
        bankIfsc: bankIfsc.trim()
      });

      triggerHaptic();
      setShowAddModal(false);
      setName('');
      setAddress('');
      setGoogleMapsUrl('');
      setImages([]);
      setGovernmentIdNumber('');
      setOwnershipDocProof('');
      setOwnerDeclaration(false);
      onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Error listing venue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRevenue = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.amount, 0);

  const totalTurfEarnings = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.turfEarnings || b.baseAmount || Math.round(b.amount / 1.09)), 0);

  const totalCommissionAccrued = venues.reduce((acc, v) => acc + (v.unpaidCommission || 0), 0);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-sport-500/10 text-sport-400 border border-sport-500/20">
            Manager Console
          </span>
          <h2 className="text-xl font-black text-white uppercase tracking-tight mt-1">
            Turf Owner Dashboard
          </h2>
          <p className="text-xs text-slate-400">Manage courts, monitor booking schedules & track revenue</p>
        </div>

        {isOwner && (
          <button
            onClick={() => {
              triggerHaptic();
              setShowAddModal(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow transition self-start active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>List New Venue</span>
          </button>
        )}
      </div>

      {/* Onboarding State if not owner */}
      {!isOwner && (
        <div className="bg-[#111815] border border-sport-500/40 rounded-3xl p-6 sm:p-8 text-center max-w-xl mx-auto space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-sport-500/10 border border-sport-500/30 text-sport-400 flex items-center justify-center mx-auto shadow-glow-sm">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase">List your venue in Kurnool</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Accept live online bookings for your badminton court, cricket turf, or sports complex without paying any commission fees.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleBecomeOwner}
              className="px-6 py-3 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow transition active:scale-95"
            >
              {user ? 'Activate Venue Owner Role (Instant)' : 'Sign In to List Venue'}
            </button>
          </div>
        </div>
      )}

      {/* Management Content */}
      {isOwner && (
        <div className="space-y-6">
          
          {/* QR Pass Check-in Box */}
          <div className="bg-[#111815] border border-sport-500/40 rounded-2xl p-5 shadow-glow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <QrCode className="w-5 h-5 text-sport-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                Quick Player Check-in / Scan Pass
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Scan or enter the player's 6-digit booking reference code (e.g. <code>BMG-492018</code>) to mark them as checked in and paid.
            </p>

            {verifyMessage && (
              <div className="mb-3 p-3 rounded-xl bg-sport-500/10 border border-sport-500/40 text-sport-400 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{verifyMessage}</span>
              </div>
            )}

            {error && (
              <div className="mb-3 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPass} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={scanRef}
                  onChange={(e) => setScanRef(e.target.value.toUpperCase())}
                  placeholder="Enter Ref Code (e.g. BMG-492018)..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-xs text-white font-mono uppercase focus:outline-none focus:border-sport-500"
                />
              </div>
              <button
                type="submit"
                disabled={verifying || !scanRef.trim()}
                className="px-5 py-2.5 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow-sm transition disabled:opacity-40"
              >
                {verifying ? 'Checking...' : 'Verify & Check-In'}
              </button>
            </form>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#111815] border border-[#1e2923] p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Owned Venues</span>
                <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{venues.length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#16201b] text-sport-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#111815] border border-[#1e2923] p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Bookings</span>
                <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{bookings.length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#16201b] text-blue-400">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#111815] border border-[#1e2923] p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Customer Paid</span>
                <p className="text-xl sm:text-2xl font-black text-sport-400 mt-0.5">₹{totalRevenue}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#16201b] text-sport-400">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#111815] border border-[#1e2923] p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Your Turf Share</span>
                <p className="text-xl sm:text-2xl font-black text-white mt-0.5">₹{totalTurfEarnings}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#16201b] text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Method 1: Platform Commission & Auto-Lock Security Banner */}
          {venues.some(v => (v.unpaidCommission || 0) > 0 || v.isCommissionBlocked) && (
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg ${
              venues.some(v => v.isCommissionBlocked)
                ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                : 'bg-[#16201b] border-sport-500/40 text-slate-200'
            }`}>
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-xl mt-0.5 flex-shrink-0 ${
                  venues.some(v => v.isCommissionBlocked) ? 'bg-rose-900/50 text-rose-300' : 'bg-sport-500/20 text-sport-400'
                }`}>
                  {venues.some(v => v.isCommissionBlocked) ? <ShieldAlert className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Platform 9% Commission Accrued: ₹{totalCommissionAccrued}</span>
                    {venues.some(v => v.isCommissionBlocked) && (
                      <span className="text-[9px] bg-rose-900 text-rose-200 px-2 py-0.5 rounded font-extrabold uppercase">
                        SLOTS AUTO-PAUSED (THRESHOLD EXCEEDED)
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Customers pay ₹1,090 directly to your UPI. You keep your full ₹1,000 court fee. Please forward the ₹90 platform fee to Book My Game before your security threshold (₹{venues[0]?.commissionThreshold || 300}) to keep slots live!
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const target = venues.find(v => (v.unpaidCommission || 0) > 0) || venues[0];
                  if (target) handleOpenSettle(target);
                }}
                className="px-4 py-2 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow transition self-start sm:self-center whitespace-nowrap active:scale-95"
              >
                Settle 9% Commission
              </button>
            </div>
          )}

          {/* Your Venues List with Receiving UPI Management */}
          <div className="bg-[#111815] border border-[#1e2923] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">Your Listed Venues</h3>
                <p className="text-[11px] text-slate-400">Players scan your venue UPI directly to deposit 100% into your bank</p>
              </div>
              <button
                onClick={() => {
                  triggerHaptic();
                  setShowAddModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow-sm transition flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Turf</span>
              </button>
            </div>
            
            {venues.length === 0 ? (
              <div className="py-8 text-center space-y-3 bg-[#0a0f0d] border border-dashed border-[#1e2923] rounded-2xl p-6">
                <div className="w-12 h-12 rounded-2xl bg-sport-500/10 border border-sport-500/30 text-sport-400 flex items-center justify-center mx-auto">
                  <Building2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white uppercase">No Turfs Registered Under Your Account Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  All pre-loaded dummy venues have been removed. Register your authentic sports turf with photos, verified ownership proof & receiving UPI to start accepting player reservations!
                </p>
                <button
                  onClick={() => {
                    triggerHaptic();
                    setShowAddModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow transition active:scale-95"
                >
                  + Register Your First Turf Now
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#1e2923]">
                {venues.map((venue) => (
                  <div key={venue.id} className="py-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-white">{venue.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            venue.isCommissionBlocked
                              ? 'bg-rose-950 border border-rose-800 text-rose-400'
                              : venue.isActive
                              ? 'bg-sport-500/10 text-sport-400'
                              : 'bg-slate-800 text-slate-500'
                          }`}>
                            {venue.isCommissionBlocked ? 'Locked (Unpaid Commission)' : venue.isActive ? 'Live' : 'Paused'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          {venue.area}, Kurnool • ₹{venue.pricePerHour}/hr
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 self-start sm:self-auto">
                        <button
                          onClick={() => handleOpenSettle(venue)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#16201b] text-sport-400 border border-sport-500/30 hover:border-sport-500/60 transition"
                        >
                          Settle ₹{venue.unpaidCommission || 0}
                        </button>
                        <button
                          onClick={() => handleToggleActive(venue.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                            venue.isActive
                              ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/50'
                              : 'bg-sport-500 text-black border-sport-400'
                          }`}
                        >
                          {venue.isActive ? 'Pause' : 'Activate'}
                        </button>
                      </div>
                    </div>

                    {/* Turf Owner UPI Address Config */}
                    <div className="p-2.5 rounded-xl bg-[#0a0f0d] border border-[#1e2923] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 font-mono text-[11px]">Direct Payment UPI:</span>
                        {editingUpiVenueId === venue.id ? (
                          <input
                            type="text"
                            value={editUpiValue}
                            onChange={(e) => setEditUpiValue(e.target.value)}
                            placeholder="e.g. yourname@okaxis"
                            className="px-2 py-1 rounded-lg bg-[#16201b] border border-sport-500 text-white font-mono text-xs focus:outline-none"
                          />
                        ) : (
                          <span className="font-mono font-bold text-sport-400 bg-sport-500/10 px-2 py-0.5 rounded border border-sport-500/20">
                            {venue.ownerUpiId || 'bookmygame@upi'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {editingUpiVenueId === venue.id ? (
                          <>
                            <button
                              onClick={() => handleSaveUpi(venue.id)}
                              disabled={savingUpi}
                              className="px-2.5 py-1 rounded-lg bg-sport-500 text-black font-bold text-[11px]"
                            >
                              {savingUpi ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingUpiVenueId(null)}
                              className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px]"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleStartEditUpi(venue)}
                            className="flex items-center space-x-1 text-slate-400 hover:text-white text-[11px]"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Change UPI</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data Backup & System Monitor Card */}
          <div className="bg-[#111815] border border-[#1e2923] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Data Backup & System Health</h3>
                  <p className="text-[11px] text-slate-400">Export your venue & booking data before any redeployment</p>
                </div>
              </div>
              <button
                onClick={handleLoadHealth}
                disabled={loadingHealth}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#16201b] text-blue-400 border border-blue-500/30 hover:border-blue-500/60 transition disabled:opacity-40"
              >
                {loadingHealth ? 'Loading...' : 'Check Server Status'}
              </button>
            </div>

            {/* Success / restore message */}
            {backupMessage && (
              <div className="p-3 rounded-xl bg-sport-500/10 border border-sport-500/40 text-sport-400 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{backupMessage}</span>
              </div>
            )}

            {/* Auto-snapshot status row */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-[11px] border ${
              localSnapDays > 3
                ? 'bg-amber-950/30 border-amber-800/50 text-amber-300'
                : localSnapCount > 0
                ? 'bg-[#16201b] border-sport-500/20 text-sport-400'
                : 'bg-[#0a0f0d] border-[#1e2923] text-slate-500'
            }`}>
              <div className="flex items-center space-x-2">
                {localSnapDays > 3
                  ? <Clock className="w-3.5 h-3.5 text-amber-400" />
                  : localSnapCount > 0
                  ? <ShieldCheck className="w-3.5 h-3.5 text-sport-400" />
                  : <Database className="w-3.5 h-3.5" />
                }
                <span>
                  {localSnapCount > 0
                    ? `Auto-snapshot: ${localSnapCount} venues saved ${localSnapAge} in browser cache`
                    : 'No local snapshot yet — open Manager Console to trigger one'}
                </span>
              </div>
              {localSnapDays > 3 && (
                <span className="font-bold text-amber-400 ml-2 whitespace-nowrap">⚠ Stale — download fresh backup</span>
              )}
            </div>

            {/* Backup actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Download Backup */}
              <div className="p-3 rounded-xl bg-[#0a0f0d] border border-[#1e2923] space-y-2">
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4 text-sport-400" />
                  <span className="text-xs font-bold text-white">Export Backup</span>
                </div>
                <p className="text-[11px] text-slate-400">Download a JSON snapshot of all venues, bookings & reviews to your device.</p>
                <button
                  onClick={handleDownloadBackup}
                  disabled={exportingBackup}
                  className="w-full py-2 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow-sm transition disabled:opacity-40 active:scale-95"
                >
                  {exportingBackup ? 'Exporting...' : '⬇ Download Backup JSON'}
                </button>
              </div>

              {/* Restore Backup */}
              <div className="p-3 rounded-xl bg-[#0a0f0d] border border-[#1e2923] space-y-2">
                <div className="flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Restore Backup</span>
                </div>
                <p className="text-[11px] text-slate-400">Upload a previously exported JSON file to restore data after a Render redeploy.</p>
                <label className={`w-full py-2 rounded-xl font-extrabold text-xs text-center border transition cursor-pointer block ${
                  restoringBackup
                    ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                    : 'bg-amber-950/40 text-amber-300 border-amber-800/50 hover:bg-amber-900/50'
                }`}>
                  {restoringBackup ? 'Restoring...' : '⬆ Upload & Restore JSON'}
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    disabled={restoringBackup}
                    onChange={handleFileRestore}
                  />
                </label>
              </div>
            </div>

            {/* System Health Panel (shown after clicking Check Server Status) */}
            {healthData && (
              <div className="mt-2 p-3 rounded-xl bg-[#0a0f0d] border border-[#1e2923] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Server Status</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    healthData.status === 'healthy'
                      ? 'bg-sport-500/10 text-sport-400 border border-sport-500/30'
                      : healthData.status === 'warning'
                      ? 'bg-amber-950/50 text-amber-400 border border-amber-700'
                      : 'bg-rose-950/50 text-rose-400 border border-rose-800'
                  }`}>
                    {healthData.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-[#111815] p-2 rounded-lg">
                    <span className="text-slate-500 block">Uptime</span>
                    <span className="text-white font-bold">{healthData.uptimeFormatted}</span>
                  </div>
                  <div className="bg-[#111815] p-2 rounded-lg">
                    <span className="text-slate-500 block">Total Requests</span>
                    <span className="text-white font-bold">{healthData.totalRequests?.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#111815] p-2 rounded-lg">
                    <span className="text-slate-500 block">Memory Used</span>
                    <span className="text-white font-bold">{healthData.memory?.heapUsedMB} MB</span>
                  </div>
                  <div className="bg-[#111815] p-2 rounded-lg">
                    <span className="text-slate-500 block">Errors Logged</span>
                    <span className={`font-bold ${healthData.errorCount > 0 ? 'text-rose-400' : 'text-sport-400'}`}>
                      {healthData.errorCount}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-[#111815] p-2 rounded-lg">
                    <span className="text-slate-500 block">Venues</span>
                    <span className="text-white font-bold">{healthData.database?.venues}</span>
                  </div>
                  <div className="bg-[#111815] p-2 rounded-lg">
                    <span className="text-slate-500 block">Bookings</span>
                    <span className="text-white font-bold">{healthData.database?.bookings}</span>
                  </div>
                  <div className="bg-[#111815] p-2 rounded-lg">
                    <span className="text-slate-500 block">Last Auto-Backup</span>
                    <span className="text-white font-bold">{healthData.lastBackup ? new Date(healthData.lastBackup).toLocaleTimeString() : '—'}</span>
                  </div>
                </div>
                {healthData.recentErrors && healthData.recentErrors.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-rose-400 font-bold uppercase">Recent Errors</span>
                    {healthData.recentErrors.slice(0, 3).map((e: any) => (
                      <div key={e.id} className="text-[10px] text-rose-300 bg-rose-950/30 px-2 py-1 rounded font-mono truncate">
                        [{e.status}] {e.method} {e.url} — {e.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Customer Reservations Table */}
          <div className="bg-[#111815] border border-[#1e2923] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Customer Reservations</h3>

            {bookings.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No customer bookings received yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1e2923] text-slate-500 uppercase text-[10px]">
                      <th className="py-2.5">When & Slot</th>
                      <th className="py-2.5">Venue</th>
                      <th className="py-2.5">Player Info</th>
                      <th className="py-2.5">Customer Paid</th>
                      <th className="py-2.5">Turf Fee (100%)</th>
                      <th className="py-2.5">Platform Fee (9%)</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2923]">
                    {bookings.map((b) => {
                      const turfCut = b.turfEarnings || b.baseAmount || Math.round(b.amount / 1.09);
                      const platformCut = b.platformCommission || (b.amount - turfCut);

                      return (
                        <tr key={b.id} className="hover:bg-[#16201b]/50">
                          <td className="py-3">
                            <span className="font-bold text-white block">{b.date}</span>
                            <span className="text-[11px] text-sport-400">{b.startHour}:00 - {b.endHour}:00</span>
                          </td>
                          <td className="py-3 font-medium text-slate-300">{b.venueName}</td>
                          <td className="py-3">
                            <span className="text-white block font-medium">{b.playerName}</span>
                            <span className="text-[11px] text-slate-400">{b.playerPhone}</span>
                          </td>
                          <td className="py-3 font-black text-white">₹{b.amount}</td>
                          <td className="py-3 font-bold text-emerald-400">₹{turfCut}</td>
                          <td className="py-3 font-bold text-sport-400">₹{platformCut}</td>
                          <td className="py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              b.status === 'completed'
                                ? 'bg-blue-500/10 text-blue-400'
                                : b.status === 'cancelled'
                                ? 'bg-rose-500/10 text-rose-400'
                                : 'bg-sport-500/10 text-sport-400'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 text-right space-x-1 whitespace-nowrap">
                            {b.status === 'confirmed' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(b.id, 'completed', 'paid')}
                                  className="px-2.5 py-1 rounded-lg bg-sport-500/20 text-sport-400 hover:bg-sport-500 hover:text-black font-bold text-[11px] transition"
                                >
                                  Mark Played
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                                  className="px-2 py-1 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 font-bold text-[11px] transition"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Add Venue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0f1512] border border-[#1e2923] w-full max-w-2xl rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[92vh] space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2923]">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-sport-500/10 border border-sport-500/30 text-sport-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">Register & Verify Sports Turf</h3>
                  <p className="text-[11px] text-slate-400">Kurnool Official Venue Onboarding • Direct Player UPI Payments</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#16201b] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddVenue} className="space-y-6 text-xs">
              
              {/* SECTION 1: TURF & FACILITY DETAILS */}
              <div className="bg-[#111815] border border-[#1e2923] rounded-2xl p-4 space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-[#1e2923]">
                  <span className="text-base">🏟️</span>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">1. Turf & Ground Information</h4>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Turf / Facility Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Strike Force Cricket Arena or Smashers Club"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Area in Kurnool *</label>
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                    >
                      <option value="Budhawarpet">Budhawarpet</option>
                      <option value="Joharapuram">Joharapuram</option>
                      <option value="B-Camp">B-Camp</option>
                      <option value="Gayatri Estate">Gayatri Estate</option>
                      <option value="Venkayapalli">Venkayapalli</option>
                      <option value="Collectorate Road">Collectorate Road</option>
                      <option value="Nandyal Road">Nandyal Road</option>
                      <option value="Santosh Nagar">Santosh Nagar</option>
                      <option value="Other">Other Area in Kurnool</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Pitch / Surface Type *</label>
                    <input
                      type="text"
                      value={pitchType}
                      onChange={(e) => setPitchType(e.target.value)}
                      placeholder="e.g. FIFA AstroTurf, Wooden Badminton, Clay Court"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Full Physical Address & Landmark *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Opp. Indoor Stadium, Near Reliance Smart, Joharapuram Main Road, Kurnool"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Google Maps Location Link (Optional)</label>
                  <input
                    type="url"
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Enables 1-click navigation for players travelling to your turf.</span>
                </div>

                {/* Sports Multi-Select */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1.5">Sports Offered (Select all that apply) *</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { slug: 'cricket', name: 'Cricket Nets', emoji: '🏏' },
                      { slug: 'badminton', name: 'Badminton', emoji: '🏸' },
                      { slug: 'football', name: 'Football Turf', emoji: '⚽' },
                      { slug: 'swimming', name: 'Swimming Pool', emoji: '🏊' },
                      { slug: 'tennis', name: 'Tennis Court', emoji: '🎾' },
                      { slug: 'basketball', name: 'Basketball', emoji: '🏀' },
                    ].map((sp) => (
                      <button
                        type="button"
                        key={sp.slug}
                        onClick={() => toggleSport(sp.slug)}
                        className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1 border transition ${
                          sports.includes(sp.slug)
                            ? 'bg-sport-500 text-black border-sport-400 shadow-glow-sm'
                            : 'bg-[#0a0f0d] text-slate-400 border-[#1e2923] hover:text-white'
                        }`}
                      >
                        <span>{sp.emoji}</span>
                        <span>{sp.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pricing & Hours */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Weekday ₹/hr *</label>
                    <input
                      type="number"
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Weekend ₹/hr</label>
                    <input
                      type="number"
                      value={weekendPrice}
                      onChange={(e) => setWeekendPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Opens at</label>
                    <select
                      value={openHour}
                      onChange={(e) => setOpenHour(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                    >
                      {[5, 6, 7, 8, 9].map((h) => (
                        <option key={h} value={h}>{h}:00 AM</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Closes at</label>
                    <select
                      value={closeHour}
                      onChange={(e) => setCloseHour(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                    >
                      {[21, 22, 23, 24].map((h) => (
                        <option key={h} value={h}>{h === 24 ? '12:00 AM (Midnight)' : `${h - 12}:00 PM`}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Amenities Badges */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1.5">Amenities Available</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Floodlights', 'Parking', 'Drinking Water', 'Changing Rooms',
                      'Washrooms', 'Equipment Rental', 'Showers', 'Dugouts', 'Cafeteria'
                    ].map((amenity) => (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                          amenitiesList.includes(amenity)
                            ? 'bg-sport-500/20 text-sport-400 border-sport-500/40'
                            : 'bg-[#0a0f0d] text-slate-500 border-[#1e2923]'
                        }`}
                      >
                        {amenitiesList.includes(amenity) ? '✓ ' : '+ '}{amenity}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Facility Description / Ground Rules</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Non-marking shoes mandatory for badminton. Professional floodlights for night cricket..."
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                  />
                </div>
              </div>

              {/* SECTION 2: TURF PHOTOS UPLOAD */}
              <div className="bg-[#111815] border border-[#1e2923] rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#1e2923]">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">📸</span>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">2. Upload Photos of Turf *</h4>
                      <p className="text-[10px] text-slate-400">At least 1 photo is required. Players want to see the real playing turf.</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    images.length > 0 ? 'bg-sport-500/10 text-sport-400' : 'bg-rose-950 text-rose-300'
                  }`}>
                    {images.length} photo(s) added
                  </span>
                </div>

                {/* Upload action buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-sport-500/10 hover:bg-sport-500/20 border border-sport-500/40 text-sport-400 font-bold text-xs cursor-pointer transition active:scale-95 text-center">
                    <Camera className="w-4 h-4" />
                    <span>Upload from Phone / Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="Or paste photo URL..."
                      className="flex-1 px-3 py-2 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white text-xs focus:outline-none focus:border-sport-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-2 rounded-xl bg-[#16201b] hover:bg-[#1e2923] text-white font-bold text-xs border border-[#1e2923]"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Thumbnails Gallery */}
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#1e2923] bg-black aspect-video">
                        <img src={img} alt={`Turf photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 rounded-lg bg-black/70 text-rose-400 hover:bg-rose-950 transition"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 text-[9px] bg-sport-500 text-black font-extrabold px-1.5 py-0.5 rounded">
                            Cover Photo
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-400 text-center py-2 bg-amber-950/20 border border-amber-800/40 rounded-xl">
                    ⚠️ No photos added yet. Click &quot;Upload from Phone / Device&quot; to attach turf photos.
                  </p>
                )}
              </div>

              {/* SECTION 3: REAL OWNER VERIFICATION */}
              <div className="bg-[#111815] border border-[#1e2923] rounded-2xl p-4 space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-[#1e2923]">
                  <span className="text-base">🛡️</span>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">3. Real Owner Verification *</h4>
                    <p className="text-[10px] text-slate-400">Verifying that only genuine legal owners list their sports turfs.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Owner Legal Full Name *</label>
                    <input
                      type="text"
                      value={ownerFullName}
                      onChange={(e) => setOwnerFullName(e.target.value)}
                      placeholder="e.g. Suresh Reddy"
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Primary Mobile Phone (+91) *</label>
                    <input
                      type="tel"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="e.g. 9988776655"
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Ownership Proof Document *</label>
                    <select
                      value={governmentIdType}
                      onChange={(e) => setGovernmentIdType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                    >
                      <option value="Electricity Bill of Turf Facility">Electricity Bill of Turf Facility</option>
                      <option value="GST Registration Certificate">GST Registration Certificate</option>
                      <option value="Municipal Trade License">Municipal Trade License / Registration</option>
                      <option value="Aadhaar Card of Owner">Aadhaar Card of Owner</option>
                      <option value="PAN Card of Owner / Firm">PAN Card of Owner / Business</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Document / Consumer Number *</label>
                    <input
                      type="text"
                      value={governmentIdNumber}
                      onChange={(e) => setGovernmentIdNumber(e.target.value)}
                      placeholder="e.g. 10-digit Consumer No. or GSTIN"
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500 font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Upload proof document photo */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Attach Photo of Electricity Bill or Certificate (Optional)</label>
                  <label className="flex items-center space-x-2 py-2 px-3 rounded-xl bg-[#0a0f0d] border border-dashed border-[#1e2923] hover:border-sport-500/40 text-slate-400 font-medium text-xs cursor-pointer transition">
                    <FileText className="w-4 h-4 text-sport-400" />
                    <span>{ownershipDocProof ? '✓ Document Attached (Change file)' : 'Click to select bill or document photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleDocUpload}
                    />
                  </label>
                </div>

                {/* Legal Ownership Declaration */}
                <div className="pt-2">
                  <label className="flex items-start space-x-2.5 cursor-pointer bg-[#0a0f0d] p-3 rounded-xl border border-[#1e2923]">
                    <input
                      type="checkbox"
                      checked={ownerDeclaration}
                      onChange={(e) => setOwnerDeclaration(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-sport-500 focus:ring-0 focus:outline-none accent-sport-500"
                      required
                    />
                    <span className="text-[11px] text-slate-300 leading-snug">
                      I solemnly declare that I am the <strong>legal owner or authorized operator</strong> of this sports venue in Kurnool. I verify that all photos, ownership numbers, and UPI details are 100% genuine. Submitting fake details will lead to immediate delisting.
                    </span>
                  </label>
                </div>
              </div>

              {/* SECTION 4: RECEIVING UPI ID & PAYMENT SETUP */}
              <div className="bg-[#111815] border border-[#1e2923] rounded-2xl p-4 space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-[#1e2923]">
                  <span className="text-base">💳</span>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">4. Receiving UPI ID (Direct Player Payments) *</h4>
                    <p className="text-[10px] text-slate-400">100% of player payments will be credited directly to your bank account.</p>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Your Receiving UPI ID (PhonePe / GPay / Paytm / BHIM) *
                  </label>
                  <input
                    type="text"
                    value={ownerUpiId}
                    onChange={(e) => setOwnerUpiId(e.target.value)}
                    placeholder="e.g. sureshreddy@okhdfcbank or 9988776655@ybl"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white font-mono focus:outline-none focus:border-sport-500 text-xs"
                    required
                  />
                  <span className="text-[10px] text-sport-400 mt-1 block">
                    ⚡ At booking time, Book My Game generates an automated NPCI UPI QR code carrying this address. The customer scans it and funds transfer directly into your account!
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Backup Bank Account No. (Optional)</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="e.g. 50100492817291"
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Bank IFSC Code (Optional)</label>
                    <input
                      type="text"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white font-mono text-xs uppercase focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0a0f0d] border border-sport-500/20 text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-white">
                    <ShieldCheck className="w-4 h-4 text-sport-400" />
                    <span>Transparent Pricing & Auto-Lock Protection:</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Customer pays Court Fee + 9% platform fee. You keep 100% of your court fee. The platform fee accumulates until reaching the ₹1,000 threshold, at which point you settle with Book My Game to keep your slots live.
                  </p>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex justify-end space-x-3 border-t border-[#1e2923]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#16201b] hover:bg-[#1e2923] text-slate-300 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow transition active:scale-95 disabled:opacity-40"
                >
                  {isSubmitting ? 'Verifying & Registering...' : 'Publish Verified Turf'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Settle Commission Modal */}
      {settleVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f1512] border border-[#1e2923] w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2923]">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-sport-400" />
                <h3 className="text-base font-black text-white uppercase">Settle 9% Commission</h3>
              </div>
              <button 
                onClick={() => setSettleVenue(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#16201b]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-2 space-y-3">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-sport-500/10 text-sport-400 border border-sport-500/20">
                Book My Game Partner Settlement
              </span>
              <p className="text-xs text-slate-300">
                Scan with PhonePe, GPay, or Paytm to pay <strong>₹{settleAmount}</strong> (9% platform fee for {settleVenue.name}).
              </p>

              {/* Platform UPI QR Code */}
              <div className="bg-white p-3.5 rounded-2xl max-w-[200px] mx-auto shadow-glow">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=bookmygame@upi&pn=BookMyGame%20Platform&am=${settleAmount}.00&cu=INR&tn=Commission%20${encodeURIComponent(settleVenue.name)}`)}`}
                  alt="Platform UPI QR"
                  className="w-40 h-40 mx-auto object-contain rounded-lg"
                />
                <span className="text-[11px] font-mono font-bold text-black block mt-2">
                  bookmygame@upi
                </span>
                <span className="text-[9px] text-slate-500 block">
                  Book My Game Official Account
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmSettle} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Amount to Settle (₹)</label>
                <input
                  type="number"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#16201b] border border-[#1e2923] text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">UPI UTR / Reference ID (Optional)</label>
                <input
                  type="text"
                  value={settleRef}
                  onChange={(e) => setSettleRef(e.target.value)}
                  placeholder="e.g. 439201948291"
                  className="w-full px-3 py-2 rounded-xl bg-[#16201b] border border-[#1e2923] text-white font-mono"
                />
              </div>

              {settleSuccessMsg && (
                <div className="p-3 rounded-xl bg-sport-500/10 border border-sport-500/40 text-sport-400 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{settleSuccessMsg}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleVenue(null)}
                  className="px-4 py-2 rounded-xl bg-[#16201b] text-slate-300 font-bold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={settling || settleAmount <= 0}
                  className="px-5 py-2 rounded-xl bg-sport-500 text-black font-extrabold shadow-glow-sm transition active:scale-95 disabled:opacity-40"
                >
                  {settling ? 'Updating...' : 'Confirm Paid (Clear Balance)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
