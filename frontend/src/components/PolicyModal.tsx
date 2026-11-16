import React from 'react';
import { X, ShieldCheck, FileText, Lock, RefreshCw, HelpCircle } from 'lucide-react';
import { triggerHaptic } from '../utils/device';

export type PolicyType = 'about' | 'terms' | 'privacy' | 'refund' | 'verification' | null;

interface PolicyModalProps {
  policy: PolicyType;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ policy, onClose }) => {
  if (!policy) return null;

  const renderContent = () => {
    switch (policy) {
      case 'about':
        return (
          <>
            <div className="flex items-center space-x-2 text-sport-400 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">About Book My Game Kurnool</span>
            </div>
            <h3 className="text-lg font-black text-white uppercase">Hyperlocal Sports Infrastructure for Kurnool</h3>
            <p className="text-xs text-slate-300 leading-relaxed mt-2">
              Book My Game is built exclusively for sports enthusiasts and facility operators in Kurnool, Andhra Pradesh. We connect athletes, box cricket players, football teams, and badminton players with certified, verified local venues in areas like Budhawarpet, Joharapuram, B-Camp, and Nandyal Road.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-[#16201b] border border-[#1e2923] space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-slate-200">
                <span className="text-sport-400 font-bold">✓</span>
                <span>Zero Advance Deposit — Players pay directly at the venue</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-200">
                <span className="text-sport-400 font-bold">✓</span>
                <span>Real Turf Verification — Owner Aadhaar / Trade License checked</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-200">
                <span className="text-sport-400 font-bold">✓</span>
                <span>Direct UPI Settlements — Direct payments to turf owner VPA</span>
              </div>
            </div>
          </>
        );

      case 'terms':
        return (
          <>
            <div className="flex items-center space-x-2 text-sport-400 mb-2">
              <FileText className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">Terms of Service</span>
            </div>
            <h3 className="text-lg font-black text-white uppercase">Platform Rules & Booking Terms</h3>
            <div className="text-xs text-slate-300 space-y-3 mt-3 leading-relaxed">
              <p>
                <strong>1. Hourly Slot Reservations:</strong> Each reservation holds the designated court or turf exclusively for the booked timeframe. Players must arrive 10 minutes prior to scheduled start time.
              </p>
              <p>
                <strong>2. Venue Payment Policy:</strong> The slot rate is paid directly to the venue operator upon arrival via cash or the turf's registered UPI ID.
              </p>
              <p>
                <strong>3. Ground Conduct:</strong> Players must adhere to venue guidelines, wear appropriate athletic footwear (non-marking shoes for badminton, rubber studs for AstroTurf), and respect equipment.
              </p>
              <p>
                <strong>4. Owner Verification:</strong> Venue owners warrant that they legally control the facilities listed and maintain accurate slot calendars.
              </p>
            </div>
          </>
        );

      case 'privacy':
        return (
          <>
            <div className="flex items-center space-x-2 text-sport-400 mb-2">
              <Lock className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">Privacy & Security Policy</span>
            </div>
            <h3 className="text-lg font-black text-white uppercase">Data Protection & User Privacy</h3>
            <div className="text-xs text-slate-300 space-y-3 mt-3 leading-relaxed">
              <p>
                <strong>1. Information Collection:</strong> We only collect information essential for booking: player name, phone number, and verified Google or email identity.
              </p>
              <p>
                <strong>2. No Data Selling:</strong> Book My Game never sells, monetizes, or shares personal player data with third-party advertising brokers.
              </p>
              <p>
                <strong>3. Encryption & Passwords:</strong> All passwords are cryptographically hashed using salted bcrypt. All web sessions run under strict HTTPS and JWT validation.
              </p>
            </div>
          </>
        );

      case 'refund':
        return (
          <>
            <div className="flex items-center space-x-2 text-sport-400 mb-2">
              <RefreshCw className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">Cancellation & Refund Policy</span>
            </div>
            <h3 className="text-lg font-black text-white uppercase">Fair Cancellation Guidelines</h3>
            <div className="text-xs text-slate-300 space-y-3 mt-3 leading-relaxed">
              <p>
                <strong>1. Free Cancellation:</strong> Players can cancel their slot booking up to 2 hours before the match time directly through the "My Bookings" screen with zero cancellation fee.
              </p>
              <p>
                <strong>2. Weather & Ground Maintenance:</strong> In the event of unplayable weather or technical outages at the facility, venue operators provide full slot rescheduling or waiver.
              </p>
              <p>
                <strong>3. Convenience Fee Protection:</strong> Any platform reservation fee associated with cancelled bookings is automatically refunded to the user's account credit.
              </p>
            </div>
          </>
        );

      case 'verification':
        return (
          <>
            <div className="flex items-center space-x-2 text-amber-400 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">Turf Owner Verification Rules</span>
            </div>
            <h3 className="text-lg font-black text-white uppercase">Mandatory Real Owner Verification</h3>
            <div className="text-xs text-slate-300 space-y-3 mt-3 leading-relaxed">
              <p>
                To eliminate fraudulent listings and protect Kurnool sports players:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>Ground photos must be genuine, original photographs of the physical turf in Kurnool.</li>
                <li>Operators must provide verifiable legal proof (Electricity Bill of Facility, Trade License, or GST).</li>
                <li>Receiving UPI ID must be authenticated to guarantee direct player payments reach the legitimate owner.</li>
              </ul>
            </div>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0f1512] border border-[#1e2923] w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2923]">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Book My Game Legal Desk
          </span>
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

        <div className="mt-4">
          {renderContent()}
        </div>

        <div className="mt-6 pt-4 border-t border-[#1e2923] flex justify-end">
          <button
            onClick={() => {
              triggerHaptic();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-sport-500 hover:bg-sport-400 text-black font-extrabold text-xs shadow-glow transition active:scale-95"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
