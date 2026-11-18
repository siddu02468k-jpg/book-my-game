import React from 'react';
import { Home, Compass, CalendarCheck, ShieldAlert, UserCheck } from 'lucide-react';
import { triggerHaptic } from '../utils/device';

export type TabType = 'home' | 'venues' | 'bookings' | 'owner' | 'profile' | 'notfound';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  bookingsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  bookingsCount,
}) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'venues', label: 'Venues', icon: Compass },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck, badge: bookingsCount > 0 ? bookingsCount : null },
    { id: 'owner', label: 'Turf Owner', icon: ShieldAlert },
    { id: 'profile', label: 'Profile', icon: UserCheck },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0f0d]/90 backdrop-blur-2xl border-t border-[#1e2923] shadow-2xl safe-padding-bottom">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center px-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic();
                onTabChange(tab.id as TabType);
              }}
              className={`flex flex-col items-center justify-center py-1.5 transition-all relative rounded-xl active:scale-95 ${
                isActive ? 'text-sport-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 transition-transform ${isActive ? 'scale-110 text-sport-400' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 bg-sport-500 text-black text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-glow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-sport-400 shadow-glow animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
