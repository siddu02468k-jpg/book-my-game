import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { triggerHaptic } from '../utils/device';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0f1512] border border-[#1e2923] w-full max-w-sm rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2923]">
          <h2 className="text-base font-black text-white uppercase tracking-tight">
            {isLogin ? 'Sign In to Book My Game' : 'Join as Player or Owner'}
          </h2>
          <button
            onClick={() => {
              triggerHaptic();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Login Buttons */}
        <div className="mt-3 p-3 rounded-xl bg-[#16201b] border border-[#1e2923] text-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">⚡ 1-Click Quick Fill Demo:</span>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => fillDemo('player@kurnool.dev')}
              className="flex-1 py-1 px-2 rounded-lg bg-[#0a0f0d] text-sport-400 hover:bg-sport-500/20 font-semibold border border-[#1e2923]"
            >
              Player Account
            </button>
            <button
              type="button"
              onClick={() => fillDemo('owner@kurnoolturf.com')}
              className="flex-1 py-1 px-2 rounded-lg bg-[#0a0f0d] text-amber-400 hover:bg-amber-500/20 font-semibold border border-[#1e2923]"
            >
              Turf Owner
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
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

              <div>
                <label className="block text-slate-300 font-bold mb-1">I want to:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('player')}
                    className={`py-1.5 rounded-lg border font-bold ${
                      role === 'player'
                        ? 'bg-sport-500 text-black border-sport-400'
                        : 'bg-[#16201b] text-slate-400 border-[#1e2923]'
                    }`}
                  >
                    Book Slots
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('owner')}
                    className={`py-1.5 rounded-lg border font-bold ${
                      role === 'owner'
                        ? 'bg-sport-500 text-black border-sport-400'
                        : 'bg-[#16201b] text-slate-400 border-[#1e2923]'
                    }`}
                  >
                    List My Turf
                  </button>
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
            className="w-full mt-3 py-2.5 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow transition active:scale-98 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-[#1e2923] text-center">
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
      </div>
    </div>
  );
};
