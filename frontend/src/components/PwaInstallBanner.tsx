import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { triggerHaptic } from '../utils/device';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user previously dismissed in this session
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    triggerHaptic();
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    triggerHaptic();
    setShowBanner(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <aside
      aria-label="Install Book My Game App"
      className="fixed top-16 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 bg-[#111815]/95 backdrop-blur-xl border border-sport-500/40 p-3.5 rounded-2xl shadow-2xl animate-in slide-in-from-top duration-300"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sport-600 to-sport-400 flex items-center justify-center text-black font-black text-sm shadow-glow-sm flex-shrink-0">
            ⚡
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-tight">Install Book My Game</h4>
            <p className="text-[10px] text-slate-300">Fast 1-tap court bookings from your home screen</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-[11px] shadow-glow-sm transition active:scale-95 flex items-center space-x-1"
          >
            <Download className="w-3 h-3" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
