import React from 'react';
import { Cpu, Sparkles, Monitor, Search, Calendar, FileText } from 'lucide-react';

interface HeaderProps {
  utcTime: Date;
  activeTab: string;
  setActiveTab: (tab: 'terminal' | 'scanner' | 'calendar' | 'journal') => void;
  onOpenChat: () => void;
}

export default function Header({ utcTime, activeTab, setActiveTab, onOpenChat }: HeaderProps) {
  const tabs = [
    { id: 'terminal', label: 'Terminal Desk', icon: Monitor },
    { id: 'scanner', label: 'SMC Algorithmic Scanner', icon: Search },
    { id: 'calendar', label: 'Macro Calendar', icon: Calendar },
    { id: 'journal', label: 'Journal & Risk Hub', icon: FileText }
  ] as const;

  return (
    <div className="flex flex-col shrink-0 bg-slate-950/80 border-b border-slate-800/60 backdrop-blur-md">
      {/* Primary Row */}
      <header className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Cpu className="w-4 h-4 animate-pulse" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-base tracking-tight text-white">JARVIS</h1>
              <span className="font-mono text-[9px] font-bold tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">QUANT DESK v6.0</span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">High-Fidelity Institutional Smart Money Concepts Companion</p>
          </div>
        </div>

        {/* Dynamic Telemetry / Indicators */}
        <div className="flex flex-wrap items-center justify-end gap-6 text-xs font-mono">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Telemetry Core</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-[10px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              REAL-TIME FEED LINKED
            </span>
          </div>

          <div className="flex flex-col items-end border-l border-slate-800 pl-5">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Universal Clock</span>
            <span className="text-slate-200 font-bold text-[11px] tracking-wide">
              {utcTime.getUTCHours().toString().padStart(2, '0')}:
              {utcTime.getUTCMinutes().toString().padStart(2, '0')}:
              {utcTime.getUTCSeconds().toString().padStart(2, '0')} <span className="text-amber-500">UTC</span>
            </span>
          </div>

          <div className="flex flex-col items-end border-l border-slate-800 pl-5">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Cognitive Engine</span>
            <span className="text-slate-300 text-[10px] font-semibold tracking-tight">GEMINI 2.5 + GROQ</span>
          </div>
        </div>
      </header>

      {/* Tabs Row */}
      <div className="px-6 py-1 bg-slate-950/40 border-t border-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex space-x-1.5 overflow-x-auto w-full sm:w-auto py-1 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-[11px] font-bold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all cursor-pointer rounded-t-md whitespace-nowrap ${
                  isSelected 
                    ? 'text-white border-amber-500 bg-amber-500/5' 
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${isSelected ? 'text-amber-500' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* AI Co-Pilot Toggle Button */}
        <button
          onClick={onOpenChat}
          className="w-full sm:w-auto px-4 py-1.5 bg-gradient-to-r from-slate-900 to-slate-900 hover:from-amber-500/10 hover:to-amber-500/5 border border-amber-500/30 hover:border-amber-400 text-amber-400 hover:text-white rounded-lg text-[10px] font-mono tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.05)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          Ask AI Companion
        </button>
      </div>
    </div>
  );
}
