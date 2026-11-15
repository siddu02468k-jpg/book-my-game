import React from 'react';
import { Layers, Terminal, CheckCircle2, ArrowRight, ShieldCheck, Cpu, Smartphone, Globe } from 'lucide-react';
import { triggerHaptic } from '../utils/device';

export const ArchitectureView: React.FC = () => {
  const steps = [
    {
      phase: 'Step 1: Universal Web Interface',
      status: 'Implemented',
      desc: 'Mobile-first responsive React frontend with touch interactions, safe-area padding for notches, and Tailwind styling.',
      icon: Globe,
      color: 'text-indigo-400',
    },
    {
      phase: 'Step 2: Decoupled REST API',
      status: 'Implemented',
      desc: 'Standalone Node.js / Express backend with JWT auth and dynamic CORS supporting both browser origins and capacitor:// native schemes.',
      icon: Cpu,
      color: 'text-emerald-400',
    },
    {
      phase: 'Step 3: Capacitor Native Bridge',
      status: 'Configured',
      desc: 'Capacitor translates web code into native Android (Java/Kotlin) and iOS (Swift) containers with native plugin hooks.',
      icon: Smartphone,
      color: 'text-violet-400',
    },
    {
      phase: 'Step 4: App Store / Play Store Build',
      status: 'Ready to Run',
      desc: 'Run `npm run mobile:add:android` to generate the complete Android Studio project and compile your `.apk` or `.aab`.',
      icon: ShieldCheck,
      color: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/50 via-purple-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Web-to-Mobile Blueprint
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-3">
            Build Once, Deploy to Web, iOS & Android
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
            Your codebase is constructed so you don't rewrite code when moving to mobile. The web app uses standard mobile-native conventions and interfaces directly with device hardware.
          </p>
        </div>
      </div>

      {/* Progression Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-xl bg-slate-800 ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-200">{s.phase}</h3>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {s.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Conversion CLI Command Cheat Sheet */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center space-x-2 mb-3">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">How to Generate Native Mobile Builds</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Whenever you want to test on an Android device or generate an APK, run these commands from the project root:
        </p>

        <div className="space-y-2 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-slate-300 flex items-center justify-between">
            <span>npm run build:frontend</span>
            <span className="text-[10px] text-slate-500 font-sans">Compiles production web assets</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-slate-300 flex items-center justify-between">
            <span>npm run mobile:add:android</span>
            <span className="text-[10px] text-slate-500 font-sans">Creates native Android Studio project</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-slate-300 flex items-center justify-between">
            <span>npm run mobile:sync</span>
            <span className="text-[10px] text-slate-500 font-sans">Syncs code updates into mobile folder</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-slate-300 flex items-center justify-between">
            <span>npm run mobile:open:android</span>
            <span className="text-[10px] text-slate-500 font-sans">Opens Android Studio to run or build APK</span>
          </div>
        </div>
      </div>
    </div>
  );
};
