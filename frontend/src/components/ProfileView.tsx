import React, { useState } from 'react';
import { User, BackendHealth } from '../types';
import { api, getDefaultApiUrl } from '../services/api';
import { getPlatformName, isNativePlatform, triggerHaptic } from '../utils/device';
import { Server, Smartphone, Vibrate, CheckCircle2, RefreshCw, User as UserIcon, ShieldCheck, Users } from 'lucide-react';

interface ProfileViewProps {
  user: User | null;
  health: BackendHealth;
  onRefreshHealth: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  health,
  onRefreshHealth,
  onOpenAuth,
  onLogout,
}) => {
  const [apiUrl, setApiUrl] = useState(api.getBaseUrl());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const platform = getPlatformName();
  const isNative = isNativePlatform();

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    api.setBaseUrl(apiUrl);
    setSaveSuccess(true);
    triggerHaptic();
    onRefreshHealth();
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const testHaptic = (style: 'light' | 'medium' | 'heavy') => {
    triggerHaptic(style);
  };

  return (
    <div className="space-y-5 pb-20">
      
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
          Account &amp; Player Settings
        </h1>
        <p className="text-xs text-slate-400">Manage verified profile, security, and device connectivity</p>
      </div>

      {/* Account Card */}
      <div className="bg-[#111815] border border-[#1e2923] rounded-2xl p-5">
        <h3 className="text-sm font-black text-white uppercase tracking-tight mb-3">Player Account</h3>
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full border border-sport-500/40" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-sport-500/20 text-sport-400 flex items-center justify-center font-bold text-base">
                  {user.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-bold text-sm text-white">{user.name}</h4>
                  {user.emailVerified && (
                    <span className="flex items-center space-x-1 text-[9px] bg-sport-500/20 text-sport-400 border border-sport-500/30 px-1.5 py-0.2 rounded font-bold">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>{user.authProvider === 'google' ? 'Google Verified' : 'Verified'}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{user.email}</p>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="text-[10px] text-sport-400 font-bold uppercase">Role: {user.role}</span>
                  {user.phone && <span className="text-[10px] text-slate-500">• {user.phone}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  triggerHaptic();
                  onOpenAuth();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#16201b] hover:bg-sport-950/60 hover:text-sport-400 text-xs font-bold text-slate-300 border border-[#1e2923] transition flex items-center space-x-1"
                title="Switch Account"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Switch</span>
              </button>
              <button
                onClick={() => {
                  triggerHaptic();
                  onLogout();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#16201b] hover:bg-rose-950/60 hover:text-rose-400 text-xs font-bold text-slate-300 border border-[#1e2923] transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-slate-400 mb-3">You are browsing as a guest.</p>
            <button
              onClick={() => {
                triggerHaptic();
                onOpenAuth();
              }}
              className="px-5 py-2.5 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow transition"
            >
              Sign In or Register
            </button>
          </div>
        )}
      </div>

      {/* Backend API Configuration */}
      <div className="bg-[#111815] border border-[#1e2923] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-sport-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Backend API Endpoint</h3>
          </div>
          <button
            onClick={() => {
              triggerHaptic();
              onRefreshHealth();
            }}
            className="p-1 rounded text-slate-400 hover:text-white"
            title="Recheck connection"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-3">
          When testing on a physical phone over Wi-Fi, change this to your PC's local IP (e.g., <code>http://192.168.1.15:5000</code>).
        </p>

        <form onSubmit={handleSaveApiUrl} className="space-y-3">
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-xs text-white font-mono focus:outline-none focus:border-sport-500"
          />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setApiUrl(getDefaultApiUrl());
                api.setBaseUrl(getDefaultApiUrl());
                onRefreshHealth();
              }}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline"
            >
              Reset to default
            </button>

            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-sport-500 text-black font-extrabold text-xs shadow-glow-sm flex items-center space-x-1"
            >
              {saveSuccess && <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? 'Saved!' : 'Save URL'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Device & Hardware Capabilities */}
      <div className="bg-[#111815] border border-[#1e2923] rounded-2xl p-5">
        <div className="flex items-center space-x-2 mb-3">
          <Smartphone className="w-4 h-4 text-sport-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-tight">Device & Mobile Bridge</h3>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-[#1e2923]">
            <span className="text-slate-400">Current Runtime</span>
            <span className="text-sport-400 font-mono capitalize">{platform} ({isNative ? 'Native Container' : 'Web Browser'})</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#1e2923]">
            <span className="text-slate-400">PWA Ready</span>
            <span className="text-sport-400 font-bold">Yes (manifest.json active)</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#1e2923]">
            <span className="text-slate-400">Mobile Safe-Areas</span>
            <span className="text-sport-400 font-bold">Active (Notch & Island Insets)</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#1e2923]">
          <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center space-x-1">
            <Vibrate className="w-3.5 h-3.5 text-sport-400" />
            <span>Test Native Vibration / Haptics</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => testHaptic('light')}
              className="py-2 rounded-xl bg-[#16201b] hover:bg-[#1f2c25] text-xs text-slate-200 font-bold border border-[#1e2923]"
            >
              Light
            </button>
            <button
              onClick={() => testHaptic('medium')}
              className="py-2 rounded-xl bg-[#16201b] hover:bg-[#1f2c25] text-xs text-slate-200 font-bold border border-[#1e2923]"
            >
              Medium
            </button>
            <button
              onClick={() => testHaptic('heavy')}
              className="py-2 rounded-xl bg-[#16201b] hover:bg-[#1f2c25] text-xs text-slate-200 font-bold border border-[#1e2923]"
            >
              Heavy
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
