import React, { useState, useEffect } from 'react';
import { Percent, Ruler, ShieldCheck, Sparkles } from 'lucide-react';

interface FibSizerProps {
  selectedPair: string;
  onSetCalculatedSl: (slPips: number) => void;
  currentPrice?: number;
}

export default function FibSizer({ selectedPair, onSetCalculatedSl, currentPrice }: FibSizerProps) {
  const [swingHigh, setSwingHigh] = useState('62500');
  const [swingLow, setSwingLow] = useState('60500');
  const [selectedFibRatio, setSelectedFibRatio] = useState<number>(0.705); // Sweet Spot

  // Sync inputs when pair or live price shifts to realistic values
  useEffect(() => {
    if (selectedPair === 'BTCUSD') {
      const base = currentPrice || 60300;
      setSwingHigh((base * 1.015).toFixed(0));
      setSwingLow((base * 0.985).toFixed(0));
    } else if (selectedPair === 'XAUUSD') {
      const base = currentPrice || 2320;
      setSwingHigh((base * 1.01).toFixed(1));
      setSwingLow((base * 0.99).toFixed(1));
    } else {
      const base = currentPrice || 1.0850;
      setSwingHigh((base * 1.005).toFixed(5));
      setSwingLow((base * 0.995).toFixed(5));
    }
  }, [selectedPair, currentPrice]);

  const high = parseFloat(swingHigh) || 0;
  const low = parseFloat(swingLow) || 0;
  const range = Math.max(0, high - low);

  // Fibonacci Levels
  const getFibPrice = (ratio: number) => {
    // Retracement from high to low for buys (Discount search)
    return high - (range * ratio);
  };

  const levels = [
    { ratio: 0.0, name: 'Swing High', label: '0.0%' },
    { ratio: 0.236, name: 'Minor Pullback', label: '23.6%' },
    { ratio: 0.382, name: 'shallow Block', label: '38.2%' },
    { ratio: 0.500, name: 'Equilibrium Threshold', label: '50.0%' },
    { ratio: 0.618, name: 'Golden Pocket Start', label: '61.8%' },
    { ratio: 0.705, name: 'Optimal Trade Entry Sweet Spot', label: '70.5%' },
    { ratio: 0.790, name: 'Discount Mitigation Bottom', label: '79.0%' },
    { ratio: 1.0, name: 'Swing Low Limit', label: '100.0%' }
  ];

  const calculatedEntry = getFibPrice(selectedFibRatio);
  // Calculate stop loss at the 100% invalidation level (Swing Low)
  const calculatedSl = low;
  const priceDiff = Math.abs(calculatedEntry - calculatedSl);

  // Convert price difference to pips depending on the asset class
  const getPips = () => {
    if (selectedPair === 'BTCUSD') return Math.round(priceDiff);
    if (selectedPair === 'XAUUSD') return Math.round(priceDiff * 10);
    return Math.round(priceDiff * 10000); // Standard Forex Pip convertor
  };

  const pips = getPips();

  const handleApplyToCalculator = () => {
    onSetCalculatedSl(pips);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 p-5 rounded-xl shadow-xl backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div>
          <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">OTE Fibonacci & Range Analyzer</h4>
          <p className="text-[10px] text-slate-500 font-sans mt-0.5">Determine Premium vs. Discount zone trade entries</p>
        </div>
        <Percent className="w-4 h-4 text-amber-500" />
      </div>

      <div className="space-y-4 text-xs font-sans">
        {/* Dynamic swing high/low setup inputs */}
        <div className="grid grid-cols-2 gap-3 font-mono">
          <div>
            <label className="text-[8px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Swing High Anchor</label>
            <input 
              type="number" 
              value={swingHigh} 
              step="any"
              onChange={(e) => setSwingHigh(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-slate-200 text-[10px] focus:outline-none focus:border-amber-500/40"
            />
          </div>
          <div>
            <label className="text-[8px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Swing Low Anchor</label>
            <input 
              type="number" 
              value={swingLow} 
              step="any"
              onChange={(e) => setSwingLow(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-slate-200 text-[10px] focus:outline-none focus:border-amber-500/40"
            />
          </div>
        </div>

        {/* List of calculated Fibonacci retracement prices */}
        <div className="space-y-1.5 border border-slate-850/60 bg-slate-950/40 rounded-xl p-3">
          <span className="text-[8px] text-slate-500 font-mono font-bold block mb-1 uppercase tracking-wider">Fib Retracement Levels (Discount Search)</span>
          <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
            {levels.map(lvl => {
              const price = getFibPrice(lvl.ratio);
              const isOte = lvl.ratio === 0.618 || lvl.ratio === 0.705 || lvl.ratio === 0.790;
              const isPremium = lvl.ratio < 0.500;

              return (
                <button
                  key={lvl.ratio}
                  type="button"
                  onClick={() => setSelectedFibRatio(lvl.ratio)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                    selectedFibRatio === lvl.ratio 
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' 
                      : 'bg-slate-950/40 border-transparent text-slate-400 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold w-10">{lvl.label}</span>
                    <span className="text-[9px] truncate max-w-[140px] font-sans font-medium">{lvl.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[9px] font-bold">
                    {isOte && (
                      <span className="text-[7.5px] bg-emerald-500/10 text-emerald-400 px-1 py-0.5 rounded uppercase tracking-wider">OTE</span>
                    )}
                    <span className={isPremium ? 'text-rose-400/80' : 'text-emerald-400/80'}>
                      {isPremium ? 'PREMIUM' : 'DISCOUNT'}
                    </span>
                    <span className="text-white">{selectedPair.includes('USD') && !selectedPair.includes('XAU') ? price.toFixed(2) : price.toFixed(4)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected zone parameters & quick port to Calculator action */}
        <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3 font-mono text-[10px]">
          <div className="flex justify-between items-center text-[8.5px] text-slate-500 border-b border-slate-900 pb-1.5 font-bold uppercase tracking-wider">
            <span>Selected Fib Entry Metric</span>
            <span>Swing Invalidation SL</span>
          </div>

          <div className="flex justify-between items-center text-xs text-white">
            <span className="font-bold text-amber-400">
              {selectedPair.includes('USD') && !selectedPair.includes('XAU') ? calculatedEntry.toFixed(2) : calculatedEntry.toFixed(4)}
            </span>
            <span className="text-rose-400 font-bold">
              {selectedPair.includes('USD') && !selectedPair.includes('XAU') ? calculatedSl.toFixed(2) : calculatedSl.toFixed(4)}
            </span>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-900 pt-1.5">
            <span>Stop Loss Distance:</span>
            <span className="font-bold text-slate-200">{pips} Pips</span>
          </div>

          <button
            onClick={handleApplyToCalculator}
            className="w-full py-2 bg-gradient-to-r from-amber-500/10 to-amber-500/5 hover:from-amber-500 hover:to-amber-600 border border-amber-500/20 hover:border-amber-400 text-amber-400 hover:text-slate-950 font-mono font-bold text-[9.5px] uppercase tracking-wider rounded-lg transition-all duration-300 cursor-pointer text-center flex items-center justify-center gap-1.5"
          >
            <Ruler className="w-3.5 h-3.5" />
            Inject calculated SL pips to Risk calculator
          </button>
        </div>

        <div className="text-[9px] text-slate-500 leading-normal flex items-start gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Optimal Trade Entry sweet spots maximize risk-to-reward parameters, allowing tighter Stop Loss ranges.</span>
        </div>
      </div>
    </div>
  );
}
