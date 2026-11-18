import React from 'react';
import { Smartphone, Monitor, MapPin, Wifi, WifiOff, LogIn, User as UserIcon, LogOut, ShieldCheck } from 'lucide-react';
import { User, BackendHealth } from '../types';
import { triggerHaptic } from '../utils/device';

interface NavbarProps {
  user: User | null;
  health: BackendHealth;
  isSimulatedMobile: boolean;
  onToggleMobilePreview: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenOwner: () => void;
  onOpenProfile?: () => void;
  onNavigateHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  health,
  isSimulatedMobile,
  onToggleMobilePreview,
  onOpenAuth,
  onLogout,
  onOpenOwner,
  onOpenProfile,
  onNavigateHome,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0f0d]/90 backdrop-blur-md border-b border-[#1e2923] px-4 py-3 safe-padding-top transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Clickable Brand & City Tag */}
        <button
          onClick={() => {
            triggerHaptic();
            if (onNavigateHome) onNavigateHome();
          }}
          className="flex items-center space-x-3 text-left group focus:outline-none cursor-pointer"
          title="Return to Home Pitch"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sport-600 to-sport-400 flex items-center justify-center shadow-glow-sm font-black text-lg text-black group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base md:text-lg tracking-tight text-white uppercase group-hover:text-sport-400 transition-colors">
                Book My Game
              </span>
              <span className="flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sport-500/10 text-sport-400 border border-sport-500/20">
                <MapPin className="w-3 h-3 text-sport-400" />
                <span>Kurnool</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Turf &amp; Court Hourly Slot Booking</p>
          </div>
        </button>

        {/* Controls & User State */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* Backend Status */}
          <div 
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              health.status === 'online'
                ? 'bg-sport-950/60 text-sport-400 border-sport-800/60'
                : 'bg-rose-950/60 text-rose-400 border-rose-800/60'
            }`}
            title={health.status === 'online' ? 'Live Kurnool API connected' : 'API offline'}
          >
            {health.status === 'online' ? (
              <Wifi className="w-3.5 h-3.5 animate-pulse text-sport-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className="hidden md:inline">API</span>
            <span className="capitalize">{health.status}</span>
          </div>

          {/* Desktop Mobile Simulator Toggle */}
          <button
            onClick={() => {
              triggerHaptic();
              onToggleMobilePreview();
            }}
            className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isSimulatedMobile
                ? 'bg-sport-600 text-black font-bold shadow-glow-sm'
                : 'bg-[#16201b] text-slate-300 hover:bg-[#1e2923] border border-[#1e2923]'
            }`}
          >
            {isSimulatedMobile ? (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-sport-400" />
                <span>Mobile Preview</span>
              </>
            )}
          </button>

          {/* User Profile / Auth */}
          {user ? (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  if (user.role === 'owner') {
                    onOpenOwner();
                  } else if (onOpenProfile) {
                    onOpenProfile();
                  } else {
                    window.location.hash = 'profile';
                  }
                }}
                className="flex items-center space-x-2 bg-[#16201b] hover:bg-[#1e2923] px-2.5 py-1 rounded-lg border border-[#1e2923] transition active:scale-95 text-left"
                title={user.role === 'owner' ? 'Open Turf Owner Portal' : 'Open Player Profile'}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full" />
                ) : (
                  <UserIcon className="w-4 h-4 text-sport-400" />
                )}
                <span className="text-xs font-medium text-slate-200 max-w-[90px] sm:max-w-[120px] truncate">
                  {user.name}
                </span>
                {user.emailVerified && (
                  <span title="Verified Account">
                    <ShieldCheck className="w-3 h-3 text-sport-400 flex-shrink-0" />
                  </span>
                )}
                {user.role === 'owner' && (
                  <span className="text-[9px] bg-sport-500/20 text-sport-400 px-1.5 py-0.5 rounded font-bold uppercase">
                    Owner
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  triggerHaptic();
                  onLogout();
                }}
                className="p-1.5 rounded-lg bg-[#16201b] hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-[#1e2923] transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                triggerHaptic();
                onOpenAuth();
              }}
              className="flex items-center space-x-1.5 bg-sport-500 hover:bg-sport-400 text-black font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-glow-sm transition active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
