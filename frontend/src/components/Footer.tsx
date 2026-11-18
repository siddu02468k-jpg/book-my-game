import React from 'react';
import { Phone, Mail, MapPin, ShieldCheck, Heart, ArrowUp } from 'lucide-react';
import { triggerHaptic } from '../utils/device';
import { PolicyType } from './PolicyModal';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  onNavigate: (tab: any) => void;
  onOpenPolicy: (policy: PolicyType) => void;
  onSelectSport?: (sport: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenPolicy, onSelectSport }) => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    triggerHaptic('light');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-16 bg-[#070b09] border-t border-[#1e2923] text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Kurnool Info */}
          <div className="space-y-3">
            <button
              onClick={() => {
                triggerHaptic();
                onNavigate('home');
                scrollToTop();
              }}
              className="flex items-center text-left group"
            >
              <BrandLogo size="md" showSubtitle={false} />
            </button>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Hyperlocal sports venue & hourly slot reservation platform for athletes, teams, and ground operators in Kurnool, Andhra Pradesh.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-sport-400 flex-shrink-0" />
              <span>Kurnool, Andhra Pradesh 518001</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">Explore Venues</h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onNavigate('venues');
                    scrollToTop();
                  }}
                  className="hover:text-sport-400 transition"
                >
                  Browse All Grounds & Courts
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    if (onSelectSport) {
                      onSelectSport('cricket');
                    } else {
                      onNavigate('venues');
                    }
                    scrollToTop();
                  }}
                  className="hover:text-sport-400 transition"
                >
                  Box Cricket Nets & Turf
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    if (onSelectSport) {
                      onSelectSport('badminton');
                    } else {
                      onNavigate('venues');
                    }
                    scrollToTop();
                  }}
                  className="hover:text-sport-400 transition"
                >
                  Indoor Badminton Courts
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onNavigate('bookings');
                    scrollToTop();
                  }}
                  className="hover:text-sport-400 transition"
                >
                  My Match Passes & Bookings
                </button>
              </li>
            </ul>
          </div>

          {/* Turf Operators & Owners */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">Venue Operators</h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onNavigate('owner');
                    scrollToTop();
                  }}
                  className="hover:text-sport-400 transition text-sport-400 font-bold"
                >
                  + List & Verify Your Turf
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onOpenPolicy('verification');
                  }}
                  className="hover:text-sport-400 transition"
                >
                  Owner Verification Guidelines
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onOpenPolicy('refund');
                  }}
                  className="hover:text-sport-400 transition"
                >
                  Cancellation & Refund Terms
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onNavigate('owner');
                    scrollToTop();
                  }}
                  className="hover:text-sport-400 transition"
                >
                  Manager Console & UPI Setup
                </button>
              </li>
            </ul>
          </div>

          {/* Support & Contact (Clickable Phone & Email) */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">Kurnool Helpdesk</h4>
            <div className="space-y-2.5 text-[11px]">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Call Support:</span>
                <a
                  href="tel:+919876543210"
                  onClick={() => triggerHaptic('light')}
                  className="flex items-center space-x-1.5 text-sport-400 hover:text-sport-300 font-bold transition mt-0.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>+91 98765 43210</span>
                </a>
              </div>

              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Email Inquiries:</span>
                <a
                  href="mailto:support@bookmygame.kurnool.dev"
                  onClick={() => triggerHaptic('light')}
                  className="flex items-center space-x-1.5 text-slate-300 hover:text-sport-400 transition mt-0.5 break-all"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>support@bookmygame.kurnool.dev</span>
                </a>
              </div>

              <div className="pt-1 flex items-center space-x-2 text-[10px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-sport-400" />
                <span>100% Genuine Kurnool Venues</span>
              </div>
            </div>
          </div>

        </div>

        {/* Legal & Policy Links */}
        <div className="mt-10 pt-6 border-t border-[#1e2923] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-slate-400">
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenPolicy('about');
              }}
              className="hover:text-white transition"
            >
              About Us
            </button>
            <span>•</span>
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenPolicy('terms');
              }}
              className="hover:text-white transition"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenPolicy('privacy');
              }}
              className="hover:text-white transition"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenPolicy('refund');
              }}
              className="hover:text-white transition"
            >
              Refund Policy
            </button>
          </div>

          <div className="flex items-center space-x-3 text-slate-500 text-[10px]">
            <span>© {currentYear} Book My Game Kurnool. All rights reserved.</span>
            <button
              onClick={scrollToTop}
              title="Back to top"
              className="p-1 rounded-lg bg-[#16201b] hover:bg-sport-500/20 text-slate-400 hover:text-sport-400 transition"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
