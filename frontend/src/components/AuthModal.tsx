import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  Trash2, 
  ArrowRight, 
  KeyRound, 
  RefreshCw, 
  AlertCircle,
  Sparkles,
  Send
} from 'lucide-react';
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

type AuthMode = 'login' | 'register' | 'forgot_password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [role, setRole] = useState<'player' | 'owner'>('player');

  // OTP Verification State
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);
  const [otpTimer, setOtpTimer] = useState<number>(0);

  // General State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Countdown timer for resending OTP
  useEffect(() => {
    let interval: any = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  useEffect(() => {
    if (isOpen) {
      loadSavedAccounts();
      setError(null);
      setSuccessInfo(null);
      setOtpSent(false);
      setOtpCode('');
      setPreviewOtp(null);

      // Attempt initializing Google One Tap if GIS is available
      initGoogleGis();
    }
  }, [isOpen]);

  const loadSavedAccounts = () => {
    const list = api.getSavedAccounts();
    setSavedAccounts(list);
  };

  const initGoogleGis = () => {
    try {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (googleClientId && window.google?.accounts?.id) {
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
                triggerHaptic('heavy');
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

        // Render official button if container exists
        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with'
          });
        }
      }
    } catch (e) {
      console.warn('Google GIS initialization:', e);
    }
  };

  const handleGoogleClick = () => {
    triggerHaptic();
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (googleClientId && window.google?.accounts?.id) {
      try {
        initGoogleGis();
        window.google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn('GIS prompt error:', err);
      }
    }

    // Inform user how to configure their official Google Client ID in deployment
    setError('To enable 1-Click Google Sign-In in production, add VITE_GOOGLE_CLIENT_ID in your environment variables. You can also sign up below using your verified email & password.');
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
        setError(err.message || 'Failed to authenticate with saved account');
      } finally {
        setLoading(false);
      }
    } else {
      setAuthMode('login');
      setEmail(account.email);
      setPassword('');
      setTimeout(() => {
        const pwdInput = document.getElementById('bmg-pwd-input');
        if (pwdInput) pwdInput.focus();
      }, 100);
    }
  };

  // SEND 6-DIGIT OTP TO EMAIL
  const handleSendOtp = async (purpose: 'register' | 'reset_password') => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address first.');
      return;
    }

    try {
      setOtpSending(true);
      setError(null);
      setSuccessInfo(null);
      triggerHaptic();

      const res = await api.sendOtp(email.trim(), purpose);
      setOtpSent(true);
      setOtpTimer(45); // 45 seconds cooldown
      setOtpMessage(res.message);

      if (res.previewCode) {
        setPreviewOtp(res.previewCode);
      }

      triggerHaptic('medium');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch verification code');
    } finally {
      setOtpSending(false);
    }
  };

  // SUBMIT HANDLER
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);
    setLoading(true);

    try {
      if (authMode === 'login') {
        // Strict Login with Existing Credentials
        if (!email.trim() || !password) {
          throw new Error('Please enter both your registered email and password.');
        }

        const user = await api.login(email.trim(), password);
        triggerHaptic('heavy');
        onSuccess(user);
        onClose();
      } else if (authMode === 'register') {
        // Registration with Email OTP Verification
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (!email.trim() || !email.includes('@')) throw new Error('Please enter a valid email address.');
        if (!otpCode.trim() || otpCode.trim().length !== 6) {
          throw new Error('Please enter the 6-digit verification code sent to your email.');
        }
        if (password.length < 6) {
          throw new Error('Please create a password of at least 6 characters.');
        }

        const user = await api.register(name.trim(), email.trim(), password, phone.trim(), role, otpCode.trim());
        triggerHaptic('heavy');
        onSuccess(user);
        onClose();
      } else if (authMode === 'forgot_password') {
        // Password Reset with Email OTP
        if (!email.trim()) throw new Error('Please enter your registered email address.');
        if (!otpCode.trim() || otpCode.trim().length !== 6) {
          throw new Error('Please enter the 6-digit verification code sent to your email.');
        }
        if (newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters.');
        }

        const res = await api.resetPassword(email.trim(), otpCode.trim(), newPassword);
        triggerHaptic('medium');
        setSuccessInfo(res.message);
        setAuthMode('login');
        setPassword(newPassword);
        setOtpSent(false);
        setOtpCode('');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please check your credentials.');
      triggerHaptic();
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    triggerHaptic('light');
    setAuthMode('login');
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f1512] border border-[#1e2923] w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2923]">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-sport-400" />
              <span>
                {authMode === 'login'
                  ? 'Sign In to Account'
                  : authMode === 'register'
                  ? 'Create & Verify Account'
                  : 'Reset Account Password'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {authMode === 'login'
                ? 'Enter your existing registered email and password.'
                : authMode === 'register'
                ? 'Verify your genuine email with a 6-digit OTP.'
                : 'Receive an OTP code to verify ownership and reset password.'}
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

        {/* Feedback Alerts */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="flex-1 leading-snug">{error}</span>
          </div>
        )}

        {successInfo && (
          <div className="mt-3 p-3 rounded-xl bg-sport-500/10 border border-sport-500/40 text-sport-400 text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successInfo}</span>
          </div>
        )}

        {/* ============================================================
            SECTION 1: GOOGLE 1-CLICK VERIFIED SIGN-IN
        ============================================================ */}
        {authMode === 'login' && (
          <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-b from-[#141d18] to-[#0d1410] border border-sport-500/30">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] text-sport-400 font-black uppercase tracking-wider flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sport-400" />
                <span>Verified Google Sign-In</span>
              </span>
              <span className="text-[9px] bg-sport-500/10 text-sport-400 border border-sport-500/20 px-1.5 py-0.5 rounded font-bold">
                OAuth 2.0
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition active:scale-98 border border-slate-200"
            >
              {/* Official Google 'G' Logo SVG */}
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
        )}

        {/* ============================================================
            SECTION 2: SAVED LOGINS ON THIS DEVICE
        ============================================================ */}
        {authMode === 'login' && savedAccounts.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#1e2923]">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
              Previous Logins on this Device:
            </span>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {savedAccounts.map((acct) => (
                <div
                  key={acct.email}
                  onClick={() => handleSelectSavedAccount(acct)}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#16201b] hover:bg-[#1f2c25] border border-[#1e2923] cursor-pointer transition active:scale-98 group"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    {acct.avatarUrl ? (
                      <img src={acct.avatarUrl} alt={acct.name} className="w-7 h-7 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-sport-500/20 text-sport-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {acct.name[0] || 'U'}
                      </div>
                    )}
                    <div className="truncate">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-bold text-white truncate">{acct.name}</span>
                        {acct.role === 'owner' && (
                          <span className="text-[8px] bg-amber-400/20 text-amber-400 px-1 rounded font-bold uppercase">
                            Owner
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">{acct.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-sport-400 font-semibold group-hover:underline">
                      Use
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveSavedAccount(e, acct.email)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                      title="Remove from this device"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        {authMode === 'login' && (
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1e2923]"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-[#0f1512] px-2 text-slate-400 font-bold">Or enter your email & password</span>
            </div>
          </div>
        )}

        {/* ============================================================
            MAIN AUTH FORM: LOGIN / REGISTER (OTP) / FORGOT PASSWORD
        ============================================================ */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs mt-2">
          
          {/* REGISTER MODE: Role Selector */}
          {authMode === 'register' && (
            <div className="p-2.5 rounded-xl bg-[#16201b] border border-[#1e2923] space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Select Your Role in Kurnool
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('player')}
                  className={`py-2 px-3 rounded-lg font-bold text-xs transition text-center ${
                    role === 'player' ? 'bg-sport-500 text-black shadow-glow-sm' : 'bg-[#0a0f0d] text-slate-400 hover:text-white border border-[#1e2923]'
                  }`}
                >
                  Player (Book Turfs)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`py-2 px-3 rounded-lg font-bold text-xs transition text-center ${
                    role === 'owner' ? 'bg-amber-400 text-black shadow-glow-sm' : 'bg-[#0a0f0d] text-slate-400 hover:text-white border border-[#1e2923]'
                  }`}
                >
                  Turf Owner (List Ground)
                </button>
              </div>
            </div>
          )}

          {/* REGISTER MODE: Full Name & Phone */}
          {authMode === 'register' && (
            <>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Your Real Legal Name *</label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Suresh Reddy or Anil Kumar"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#16201b] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Mobile Phone (WhatsApp Active)</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#16201b] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* EMAIL ADDRESS FIELD */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-bold">
                {authMode === 'login' ? 'Your Existing Email Address *' : 'Your Genuine Email Address *'}
              </label>
              {(authMode === 'register' || authMode === 'forgot_password') && (
                <button
                  type="button"
                  disabled={otpSending || otpTimer > 0}
                  onClick={() => handleSendOtp(authMode === 'register' ? 'register' : 'reset_password')}
                  className="text-[11px] text-sport-400 hover:underline font-bold flex items-center space-x-1 disabled:opacity-40"
                >
                  <Send className="w-3 h-3" />
                  <span>
                    {otpSending
                      ? 'Sending...'
                      : otpTimer > 0
                      ? `Resend in ${otpTimer}s`
                      : otpSent
                      ? 'Resend OTP Code'
                      : 'Send 6-Digit OTP'}
                  </span>
                </button>
              )}
            </div>

            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#16201b] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                required
              />
            </div>
          </div>

          {/* OTP PREVIEW BANNER (Local/Dev Verification Helper) */}
          {otpSent && previewOtp && (
            <div className="p-3 rounded-xl bg-sport-500/10 border border-sport-500/40 text-xs text-slate-200 animate-in fade-in space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-sport-400 uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Email Verification Code Sent</span>
                </span>
                <span className="text-[11px] font-mono font-black text-white bg-sport-500/20 px-2 py-0.5 rounded border border-sport-500/30">
                  {previewOtp}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                A verification code was dispatched to <strong>{email}</strong>. Enter the 6-digit code below to confirm email ownership.
              </p>
            </div>
          )}

          {/* OTP CODE INPUT (FOR REGISTER & FORGOT PASSWORD) */}
          {(authMode === 'register' || authMode === 'forgot_password') && (
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                6-Digit Email Verification Code (OTP) *
              </label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit code (e.g. 593812)"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#16201b] border border-sport-500/40 text-white font-mono text-sm tracking-widest focus:outline-none focus:border-sport-500"
                  required
                />
              </div>
            </div>
          )}

          {/* PASSWORD FIELD (FOR LOGIN & REGISTER) */}
          {authMode !== 'forgot_password' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-bold">
                  {authMode === 'login' ? 'Your Existing Password *' : 'Create Account Password (min 6 chars) *'}
                </label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setAuthMode('forgot_password');
                      setError(null);
                    }}
                    className="text-[11px] text-sport-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>

              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  id="bmg-pwd-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#16201b] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                  required
                />
              </div>
            </div>
          )}

          {/* NEW PASSWORD FIELD (FOR FORGOT PASSWORD) */}
          {authMode === 'forgot_password' && (
            <div>
              <label className="block text-slate-300 font-bold mb-1">New Password (min 6 chars) *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#16201b] border border-[#1e2923] text-white focus:outline-none focus:border-sport-500"
                  required
                />
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow transition active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>
              {loading
                ? 'Processing...'
                : authMode === 'login'
                ? 'Sign In with Password'
                : authMode === 'register'
                ? 'Verify Email & Create Account'
                : 'Verify Code & Set New Password'}
            </span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* MODE SWITCHER LINKS */}
        <div className="mt-4 pt-3 border-t border-[#1e2923] text-center space-y-1">
          {authMode === 'login' ? (
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setAuthMode('register');
                  setError(null);
                }}
                className="text-sport-400 hover:underline font-bold"
              >
                Sign Up with Real Email Verification
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setAuthMode('login');
                  setError(null);
                }}
                className="text-sport-400 hover:underline font-bold"
              >
                Back to Sign In
              </button>
            </p>
          )}
        </div>

        {/* Demo Fast Fill Accordion */}
        <div className="mt-3 pt-2.5 border-t border-[#1e2923] text-[10px]">
          <span className="text-slate-500 font-bold uppercase block mb-1">⚡ Quick Demo Test Accounts:</span>
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
