import React from 'react';
import { Home, Compass, ShieldAlert, ArrowLeft } from 'lucide-react';
import { triggerHaptic } from '../utils/device';

interface NotFoundViewProps {
  onGoHome: () => void;
  onExploreVenues: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onGoHome, onExploreVenues }) => {
  return (
    <div className="py-12 sm:py-20 flex flex-col items-center justify-center text-center px-4 animate-in fade-in">
      <div className="w-20 h-20 rounded-3xl bg-rose-950/40 border border-rose-800/60 text-rose-400 flex items-center justify-center mb-6 shadow-glow-sm">
        <ShieldAlert className="w-10 h-10 animate-bounce" />
      </div>

      <span className="text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
        Error 404
      </span>

      <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
        Match Pitch Not Found
      </h1>

      <p className="mt-3 text-sm text-slate-300 max-w-md leading-relaxed">
        The slot, ground, or page you are trying to visit was moved, cleared, or does not exist on Book My Game Kurnool.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-md">
        <button
          onClick={() => {
            triggerHaptic();
            onGoHome();
          }}
          className="flex-1 flex items-center justify-center space-x-2 py-3 px-5 rounded-2xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow transition active:scale-95"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home Pitch</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic();
            onExploreVenues();
          }}
          className="flex-1 flex items-center justify-center space-x-2 py-3 px-5 rounded-2xl bg-[#16201b] hover:bg-[#1e2923] text-white font-bold text-xs border border-[#1e2923] transition active:scale-95"
        >
          <Compass className="w-4 h-4 text-sport-400" />
          <span>Browse Active Turfs</span>
        </button>
      </div>

      <div className="mt-12 p-4 rounded-2xl bg-[#111815] border border-[#1e2923] text-xs text-slate-400 max-w-sm">
        <p>
          Need urgent help with a booking? Contact our Kurnool support desk directly at{' '}
          <a href="tel:+919876543210" className="text-sport-400 font-bold hover:underline">
            +91 98765 43210
          </a>
        </p>
      </div>
    </div>
  );
};
