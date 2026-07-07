import React from 'react';
import { PriceData } from '../types';
import { Activity, ShieldAlert, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface CurrencyStrengthProps {
  prices: Record<string, PriceData>;
}

export default function CurrencyStrength({ prices }: CurrencyStrengthProps) {
  // Let's compute relative strength based on live daily changes
  const getStrengthMetric = (symbol: string): { val: number; bias: string; color: string } => {
    const data = prices[symbol];
    if (!data) return { val: 50, bias: 'NEUTRAL', color: 'from-slate-500 to-slate-400' };

    const rawChg = data.changePercent;
    // Normalize -2% to +2% range to 0 to 100 strength
    let normalized = 50 + (rawChg * 25);
    normalized = Math.max(5, Math.min(95, normalized));

    if (normalized > 65) {
      return { val: Math.round(normalized), bias: 'STRONG EXPANSION', color: 'from-emerald-500 to-teal-400' };
    } else if (normalized < 35) {
      return { val: Math.round(normalized), bias: 'HEAVY DISCOUNT', color: 'from-rose-500 to-pink-500' };
    } else {
      return { val: Math.round(normalized), bias: 'STABLE RANGE', color: 'from-amber-500 to-orange-400' };
    }
  };

  const currencies = [
    { name: 'USD (US Dollar)', sym: 'USDJPY', isInverse: true }, // USDJPY up = USD stronger
    { name: 'EUR (Euro Currency)', sym: 'EURUSD', isInverse: false },
    { name: 'GBP (British Pound)', sym: 'GBPUSD', isInverse: false },
    { name: 'JPY (Japanese Yen)', sym: 'USDJPY', isInverse: false }, // USDJPY up = JPY weaker
    { name: 'BTC (Bitcoin Alpha)', sym: 'BTCUSD', isInverse: false },
    { name: 'GLD (Spot Gold)', sym: 'XAUUSD', isInverse: false },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 p-5 rounded-xl shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div>
          <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">Macro Strength Matrix</h3>
          <p className="text-[10px] text-slate-500 font-sans mt-0.5">Live relative momentum index & bias index</p>
        </div>
        <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
      </div>

      <div className="space-y-4 font-sans">
        {currencies.map(curr => {
          const rawData = prices[curr.sym];
          let strength = 50;
          let bias = 'NEUTRAL';
          let gradient = 'from-slate-500 to-slate-400';

          if (rawData) {
            let changePercent = rawData.changePercent;
            if (curr.isInverse) changePercent = -changePercent;
            // Normalize
            let norm = 50 + (changePercent * 20);
            strength = Math.max(5, Math.min(95, Math.round(norm)));

            if (strength > 60) {
              bias = 'EXPANDING';
              gradient = 'from-emerald-500 to-teal-400';
            } else if (strength < 40) {
              bias = 'DISCOUNTING';
              gradient = 'from-rose-500 to-pink-500';
            } else {
              bias = 'CONSOLIDATING';
              gradient = 'from-amber-500 to-orange-400';
            }
          }

          return (
            <div key={curr.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="font-bold text-slate-300">{curr.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    bias === 'EXPANDING' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : bias === 'DISCOUNTING' 
                        ? 'bg-rose-500/10 text-rose-400' 
                        : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {bias}
                  </span>
                  <span className="text-white font-bold">{strength}%</span>
                </div>
              </div>

              {/* Glowing Progress bar */}
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850/60 relative">
                <div 
                  className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(245,158,11,0.2)]`}
                  style={{ width: `${strength}%` }}
                ></div>
              </div>
            </div>
          );
        })}

        {/* Dynamic correlation advisory panel */}
        <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-lg text-[9px] text-slate-400 leading-relaxed font-sans flex items-start gap-2 mt-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-amber-400/90 font-mono font-bold uppercase text-[9px] block tracking-wide mb-0.5">SMC DXY INVERSE BIAS</span>
            <p>
              When USD (DXY Proxy) strength spikes, Bitcoin and Spot Gold typically experience rapid Liquidity Sweep sell-offs. Trade with cautious leverage allocations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
