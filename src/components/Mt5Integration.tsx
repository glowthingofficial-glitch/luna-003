import React from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, Settings } from 'lucide-react';

interface Mt5IntegrationProps {
  mt5Connected: boolean;
  onToggleMt5: () => void;
  mt5Broker: string;
  setMt5Broker: (val: string) => void;
  mt5AccountNumber: string;
  setMt5AccountNumber: (val: string) => void;
  mt5Leverage: string;
  setMt5Leverage: (val: string) => void;
  showMt5Settings: boolean;
  setShowMt5Settings: (val: boolean) => void;
}

export default function Mt5Integration({
  mt5Connected,
  onToggleMt5,
  mt5Broker,
  setMt5Broker,
  mt5AccountNumber,
  setMt5AccountNumber,
  mt5Leverage,
  setMt5Leverage,
  showMt5Settings,
  setShowMt5Settings
}: Mt5IntegrationProps) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/60 p-5 rounded-xl shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div>
          <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">Broker Integration</h4>
          <p className="text-[10px] text-slate-500 font-sans mt-0.5">Link MetaTrader terminal metrics</p>
        </div>
        <button 
          onClick={() => setShowMt5Settings(!showMt5Settings)}
          className={`p-1.5 rounded border transition-all ${
            showMt5Settings 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
              : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-800'
          }`}
          title="MT5 Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-4 font-sans">
        <div className={`p-4 rounded-xl border text-center transition-all duration-300 ${
          mt5Connected 
            ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-400 shadow-[0_4px_15px_rgba(16,185,129,0.03)]' 
            : 'bg-amber-500/5 border-amber-500/25 text-amber-400 shadow-[0_4px_15px_rgba(245,158,11,0.03)]'
        }`}>
          <div className="flex items-center justify-center gap-2 mb-1.5">
            {mt5Connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
              {mt5Connected ? 'CLIENT TERMINAL CONNECTED' : 'OFFLINE SIMULATED CLIENT'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
            {mt5Connected 
              ? `${mt5Broker} • Account #${mt5AccountNumber} [Lev ${mt5Leverage}]` 
              : 'Configure broker parameters to mimic live institutional entry execution'}
          </p>
        </div>

        {showMt5Settings && (
          <div className="p-3.5 bg-slate-950/60 border border-slate-850/80 rounded-xl space-y-3 text-[10px] animate-fadeIn">
            <div>
              <label className="text-[8px] text-slate-500 font-mono font-bold block mb-1 uppercase tracking-wider">Broker Server</label>
              <input 
                type="text" 
                value={mt5Broker} 
                onChange={(e) => setMt5Broker(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-[10px] focus:outline-none focus:border-amber-500/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[8px] text-slate-500 font-mono font-bold block mb-1 uppercase tracking-wider">Account ID</label>
                <input 
                  type="text" 
                  value={mt5AccountNumber} 
                  onChange={(e) => setMt5AccountNumber(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-[10px] focus:outline-none focus:border-amber-500/40"
                />
              </div>
              <div>
                <label className="text-[8px] text-slate-500 font-mono font-bold block mb-1 uppercase tracking-wider">Max Leverage</label>
                <input 
                  type="text" 
                  value={mt5Leverage} 
                  onChange={(e) => setMt5Leverage(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-[10px] focus:outline-none focus:border-amber-500/40"
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onToggleMt5}
          className={`w-full py-2.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-widest border transition-all duration-300 cursor-pointer ${
            mt5Connected 
              ? 'bg-rose-950/20 hover:bg-rose-950/45 border-rose-500/30 hover:border-rose-400/40 text-rose-300' 
              : 'bg-gradient-to-r from-amber-500/10 to-amber-500/5 hover:from-amber-500 hover:to-amber-600 border border-amber-500/30 hover:border-amber-400 text-amber-400 hover:text-slate-950'
          }`}
        >
          {mt5Connected ? 'DISCONNECT FROM META-TRADER' : 'LINK DEMO MT5 COCKPIT'}
        </button>

        <div className="bg-slate-950/60 border border-slate-850/80 p-3 rounded-lg text-[10px] text-slate-400 leading-relaxed font-sans flex items-start gap-2.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500/80 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-amber-400/90 font-mono font-bold uppercase text-[9px] block tracking-wide">MT5 COPY DIRECTIVE</span>
            <p>
              Copy calculated smart-money indicators and lot sizes directly. Cap extreme volatility exposure by strict leverage limit of {mt5Leverage}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
