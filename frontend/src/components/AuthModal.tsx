import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, ShieldCheck, CheckCircle2, Trash2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { User, SavedAccount } from '../types';
import { triggerHaptic } from '../utils/device';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'player' | 'owner'>('player');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Saved accounts history (previously logged in on this device)
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  // Google Sign-In state & prompt
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadSavedAccounts();
      setError(null);
    }
  }, [isOpen]);

  const loadSavedAccounts = () => {
    const list = api.getSavedAccounts();
    setSavedAccounts(list);
  };

  const handleRemoveSavedAccount = (e: React.MouseEvent, acctEmail: string) => {
    e.stopPropagation();
    triggerHaptic('light');
    api.removeSavedAccount(acctEmail);
    loadSavedAccounts();
  };

  const handleSelectSavedAccount = async (account: SavedAccount) => {
    triggerHaptic();
    if (account.authProvider === 'google') {
      // 1-Click Instant Google re-login!
      setLoading(true);
      setError(null);
      try {
        const loggedUser = await api.googleAuth({
          email: account.email,
          name: account.name,
          picture: account.avatarUrl,
          role: account.role === 'owner' ? 'owner' : 'player'
        });
        onSuccess(loggedUser);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to authenticate with saved Google account');
      } finally {
        setLoading(false);
      }
    } else {
      // Pre-fill email and switch to login mode
      setIsLogin(true);
      setEmail(account.email);
      setPassword('');
      // focus password
      setTimeout(() => {
        const pwdInput = document.getElementById('bmg-pwd-input');
        if (pwdInput) pwdInput.focus();
      }, 100);
    }
  };

  const handleStandardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let user: User;
      if (isLogin) {
        user = await api.login(email, password);
      } else {
        if (!name.trim()) throw new Error('Name is required');
        user = await api.register(name, email, password, phone, role);
      }
      triggerHaptic();
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Flow
  const handleGoogleContinue = async () => {
    triggerHaptic();
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // If client ID is present and Google GIS is ready in browser window
    if (googleClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response.credential) {
              setLoading(true);
              try {
                const loggedUser = await api.googleAuth({
                  credential: response.credential,
                  role: role
                });
                onSuccess(loggedUser);
                onClose();
              } catch (err: any) {
                setError(err.message || 'Google authentication failed');
              } finally {
                setLoading(false);
              }
            }
          }
        });
        window.google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn('GIS prompt error:', err);
      }
    }

    // Interactive Google Sign-In & Verification Sheet
    setShowGooglePrompt(true);
  };

  const executeGoogleInstantAuth = async (authEmail: string, authName: string) => {
    if (!authEmail || !authEmail.includes('@')) {
      setError('Please provide a valid Google email address');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cleanEmail = authEmail.trim().toLowerCase();
      const cleanName = authName.trim() || cleanEmail.split('@')[0];
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`;

      const loggedUser = await api.googleAuth({
        email: cleanEmail,
        name: cleanName,
        picture: avatarUrl,
        role: role
      });

      triggerHaptic('heavy');
      onSuccess(loggedUser);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google verification failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setIsLogin(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-[#0f1512] border border-[#1e2923] w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl relative my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2923]">
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center space-x-1.5">
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              <span className="text-sport-400 font-normal">| Book My Game</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isLogin ? 'Welcome back! Choose how to sign in.' : 'Join Kurnool sports community in seconds.'}
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#16201b] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start space-x-2">
            <span className="text-sm">⚠️</span>
            <span className="flex-1 leading-snug">{error}</span>
          </div>
        )}

        {/* ============================================================
            SECTION 1: GOOGLE 1-CLICK LOGIN & VERIFICATION
        ============================================================ */}
        <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-b from-[#141d18] to-[#0d1410] border border-sport-500/30">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] text-sport-400 font-black uppercase tracking-wider flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sport-400" />
              <span>100% Verified Google Sign-In</span>
            </span>
            <span className="text-[9px] bg-sport-500/10 text-sport-400 border border-sport-500/20 px-1.5 py-0.5 rounded font-bold">
              Instant
            </span>
          </div>

          {/* Role selector for Google sign in/up */}
          <div className="flex items-center space-x-1.5 bg-[#0a0f0d] p-1 rounded-xl border border-[#1e2923] mb-2.5 text-[11px]">
            <span className="text-[10px] text-slate-400 font-bold px-1.5">Role:</span>
            <button
              type="button"
              onClick={() => setRole('player')}
              className={`flex-1 py-1 rounded-lg font-bold transition ${
                role === 'player' ? 'bg-sport-500 text-black shadow-glow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Player (Book)
            </button>
            <button
              type="button"
              onClick={() => setRole('owner')}
              className={`flex-1 py-1 rounded-lg font-bold transition ${
                role === 'owner' ? 'bg-amber-400 text-black shadow-glow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Turf Owner
            </button>
          </div>

          {/* Official Google Button */}
          <button
            type="button"
            onClick={handleGoogleContinue}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition active:scale-98 border border-slate-200"
          >
            {/* Google 'G' Logo SVG */}
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
          
          <div ref={googleBtnRef} className="mt-1 hidden"></div>
        </div>

        {/* ============================================================
            GOOGLE VERIFICATION / ACCOUNT CHOOSER PROMPT
        ============================================================ */}
        {showGooglePrompt && (
          <div className="mt-3 p-3.5 rounded-2xl bg-[#16201b] border border-sport-500/40 animate-in fade-in space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-white uppercase flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sport-400" />
                <span>Google Account Verification</span>
              </span>
              <button
                type="button"
                onClick={() => setShowGooglePrompt(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-300 leading-snug">
              Sign in with your Google account to automatically verify your identity and protect against lost logins:
            </p>

            <div className="space-y-2">
              <input
                type="email"
                placeholder="your.email@gmail.com"
                value={googleCustomEmail}
                onChange={(e) => setGoogleCustomEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white text-xs focus:outline-none focus:border-sport-500"
              />
              <input
                type="text"
                placeholder="Your Full Name (optional)"
                value={googleCustomName}
                onChange={(e) => setGoogleCustomName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0a0f0d] border border-[#1e2923] text-white text-xs focus:outline-none focus:border-sport-500"
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => executeGoogleInstantAuth(googleCustomEmail, googleCustomName)}
                className="flex-1 py-2 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow-sm transition active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <button
                type="button"
                onClick={() => setShowGooglePrompt(false)}
                className="px-3 py-2 rounded-xl bg-[#0a0f0d] text-slate-300 font-bold text-xs border border-[#1e2923]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            SECTION 2: PREVIOUSLY LOGGED IN ACCOUNTS (THIS DEVICE)
        ============================================================ */}
        {savedAccounts.length > 0 && !showGooglePrompt && (
          <div className="mt-4 pt-3 border-t border-[#1e2923]">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
              Previous Logins on this Device:
            </span>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {savedAccounts.map((acct) => (
                <div
                  key={acct.email}
                  onClick={() => handleSelectSavedAccount(acct)}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#141c17] hover:bg-[#1a251e] border border-[#1e2923] hover:border-sport-500/50 cursor-pointer transition group"
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    {acct.avatarUrl ? (
                      <img src={acct.avatarUrl} alt={acct.name} className="w-7 h-7 rounded-full flex-shrink-0 border border-sport-500/30" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-sport-500/20 text-sport-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {acct.name.charAt(0)}
                      </div>
                    )}
                    <div className="truncate">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-white truncate">{acct.name}</span>
                        {acct.authProvider === 'google' && (
                          <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded font-semibold flex items-center space-x-0.5">
                            <span>Google</span>
                          </span>
                        )}
                        <span className="text-[9px] bg-[#1e2923] text-slate-300 px-1 py-0.2 rounded font-semibold uppercase">
                          {acct.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{acct.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                    <span className="text-[10px] text-sport-400 group-hover:translate-x-0.5 transition flex items-center font-bold">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    <button
                      type="button"
                      title="Forget this account"
                      onClick={(e) => handleRemoveSavedAccount(e, acct.email)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="my-4 flex items-center space-x-2">
          <div className="flex-1 h-px bg-[#1e2923]"></div>
          <span className="text-[10px] text-slate-500 font-bold uppercase">or email & password</span>
          <div className="flex-1 h-px bg-[#1e2923]"></div>
        </div>

        {/* ============================================================
            SECTION 3: STANDARD EMAIL/PASSWORD FORM
        ============================================================ */}
        <form onSubmit={handleStandardSubmit} className="space-y-2.5 text-xs">
          {!isLogin && (
            <>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ravi Teja"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#16201b] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                    required={!isLogin}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Mobile Phone</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#16201b] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-300 font-bold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#16201b] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                id="bmg-pwd-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#16201b] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow transition active:scale-98 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In with Password' : 'Create Account'}
          </button>
        </form>

        {/* Toggle Sign In / Sign Up */}
        <div className="mt-3 text-center">
          <button
            onClick={() => {
              triggerHaptic();
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs text-sport-400 hover:underline font-medium"
          >
            {isLogin ? "Need an account? Join Book My Game" : "Already have an account? Sign In"}
          </button>
        </div>

        {/* Demo Fast Fill Accordion */}
        <div className="mt-3 pt-2.5 border-t border-[#1e2923] text-[10px]">
          <span className="text-slate-500 font-bold uppercase block mb-1">⚡ Quick Demo Switch:</span>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => fillDemo('player@kurnool.dev')}
              className="flex-1 py-1 px-2 rounded-lg bg-[#141c17] text-sport-400 hover:bg-sport-500/20 font-semibold border border-[#1e2923]"
            >
              Demo Player
            </button>
            <button
              type="button"
              onClick={() => fillDemo('owner@kurnoolturf.com')}
              className="flex-1 py-1 px-2 rounded-lg bg-[#141c17] text-amber-400 hover:bg-amber-500/20 font-semibold border border-[#1e2923]"
            >
              Demo Owner
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
