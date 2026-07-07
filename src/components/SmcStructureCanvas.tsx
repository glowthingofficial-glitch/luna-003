import React, { useState } from 'react';
import { Sparkles, HelpCircle, Eye, Sliders, ChevronRight } from 'lucide-react';

interface SmcStructureCanvasProps {
  selectedPair: string;
  selectedTimeframe: string;
  onSetEntry: (level: number) => void;
  currentPrice?: number;
}

export default function SmcStructureCanvas({
  selectedPair,
  selectedTimeframe,
  onSetEntry,
  currentPrice
}: SmcStructureCanvasProps) {
  // Option Toggles
  const [showFvg, setShowFvg] = useState(true);
  const [showOb, setShowOb] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [animateFlow, setAnimateFlow] = useState(true);

  // Hardcode 10 styled institutional candlesticks matching the active pair's price scale roughly
  const getSMCData = (pair: string, livePrice?: number) => {
    switch (pair) {
      case 'XAUUSD': {
        const basePrice = (livePrice && livePrice > 200) ? livePrice : 2320;
        const scaleMultiplier = 1.0;
        return {
          basePrice,
          scaleMultiplier,
          obBullish: { min: basePrice - 8.5 * scaleMultiplier, max: basePrice - 4.8 * scaleMultiplier, label: 'BULLISH REJECTION BLOCK' },
          obBearish: { min: basePrice + 8.0 * scaleMultiplier, max: basePrice + 11.5 * scaleMultiplier, label: 'BEARISH MITIGATION BLOCK' },
          fvg: { min: basePrice - 1.5 * scaleMultiplier, max: basePrice + 1.2 * scaleMultiplier, label: 'FAIR VALUE GAP (FVG)' },
          bosLine: basePrice + 6.50 * scaleMultiplier,
          chochLine: basePrice - 6.00 * scaleMultiplier,
          liquiditySweep: basePrice - 9.50 * scaleMultiplier
        };
      }
      case 'BTCUSD': {
        const basePrice = (livePrice && livePrice > 1000) ? livePrice : 61500;
        const scaleMultiplier = 25;
        return {
          basePrice,
          scaleMultiplier,
          obBullish: { min: basePrice - 42 * scaleMultiplier, max: basePrice - 24 * scaleMultiplier, label: 'BULLISH REJECTION BLOCK' },
          obBearish: { min: basePrice + 36 * scaleMultiplier, max: basePrice + 52 * scaleMultiplier, label: 'BEARISH MITIGATION BLOCK' },
          fvg: { min: basePrice - 16 * scaleMultiplier, max: basePrice - 4 * scaleMultiplier, label: 'FAIR VALUE GAP (FVG)' },
          bosLine: basePrice + 26 * scaleMultiplier,
          chochLine: basePrice - 28 * scaleMultiplier,
          liquiditySweep: basePrice - 56 * scaleMultiplier
        };
      }
      default: {
        const basePrice = (livePrice && livePrice > 0) ? livePrice : 1.0850;
        const scaleMultiplier = 0.0005;
        return {
          basePrice,
          scaleMultiplier,
          obBullish: { min: basePrice - 8 * scaleMultiplier, max: basePrice - 5 * scaleMultiplier, label: 'BULLISH REJECTION BLOCK' },
          obBearish: { min: basePrice + 6 * scaleMultiplier, max: basePrice + 9 * scaleMultiplier, label: 'BEARISH MITIGATION BLOCK' },
          fvg: { min: basePrice - 1 * scaleMultiplier, max: basePrice + 1.6 * scaleMultiplier, label: 'FAIR VALUE GAP (FVG)' },
          bosLine: basePrice + 4.4 * scaleMultiplier,
          chochLine: basePrice - 6 * scaleMultiplier,
          liquiditySweep: basePrice - 11 * scaleMultiplier
        };
      }
    }
  };

  const smc = getSMCData(selectedPair, currentPrice);

  // Create mock points for SVG candles
  // Map prices to coordinate space (height 250, padding 30)
  // Max price = base + (scaleMultiplier * 4)
  // Min price = base - (scaleMultiplier * 4)
  const mapPriceToY = (price: number) => {
    const maxVal = smc.basePrice + (smc.scaleMultiplier * 5);
    const minVal = smc.basePrice - (smc.scaleMultiplier * 5);
    const range = maxVal - minVal;
    return 260 - ((price - minVal) / range) * 200;
  };

  // Mock Candles (Time sequence: left to right)
  const candles = [
    { x: 35, open: smc.basePrice + smc.scaleMultiplier * 2, close: smc.basePrice + smc.scaleMultiplier * 0.5, high: smc.basePrice + smc.scaleMultiplier * 3, low: smc.basePrice - smc.scaleMultiplier * 0.2, bull: false },
    { x: 75, open: smc.basePrice + smc.scaleMultiplier * 0.5, close: smc.basePrice - smc.scaleMultiplier * 1.5, high: smc.basePrice + smc.scaleMultiplier * 0.8, low: smc.basePrice - smc.scaleMultiplier * 2.5, bull: false },
    // Liquidity Grab / Sweep Candle (wick goes very low then pulls back)
    { x: 115, open: smc.basePrice - smc.scaleMultiplier * 1.5, close: smc.basePrice - smc.scaleMultiplier * 3, high: smc.basePrice - smc.scaleMultiplier * 1.0, low: smc.basePrice - smc.scaleMultiplier * 4.5, bull: false, isSweep: true },
    // Strong displacement upwards breaking structure
    { x: 155, open: smc.basePrice - smc.scaleMultiplier * 3.0, close: smc.basePrice - smc.scaleMultiplier * 0.5, high: smc.basePrice - smc.scaleMultiplier * 0.2, low: smc.basePrice - smc.scaleMultiplier * 3.2, bull: true },
    { x: 195, open: smc.basePrice - smc.scaleMultiplier * 0.5, close: smc.basePrice + smc.scaleMultiplier * 2.0, high: smc.basePrice + smc.scaleMultiplier * 2.2, low: smc.basePrice - smc.scaleMultiplier * 0.8, bull: true },
    // Break of structure candle
    { x: 235, open: smc.basePrice + smc.scaleMultiplier * 2.0, close: smc.basePrice + smc.scaleMultiplier * 3.5, high: smc.basePrice + smc.scaleMultiplier * 4.8, low: smc.basePrice + smc.scaleMultiplier * 1.5, bull: true, isBos: true },
    // Correction back to Discount zone / FVG
    { x: 275, open: smc.basePrice + smc.scaleMultiplier * 3.5, close: smc.basePrice + smc.scaleMultiplier * 1.2, high: smc.basePrice + smc.scaleMultiplier * 3.8, low: smc.basePrice + smc.scaleMultiplier * 1.0, bull: false },
    { x: 315, open: smc.basePrice + smc.scaleMultiplier * 1.2, close: smc.basePrice + smc.scaleMultiplier * 0.5, high: smc.basePrice + smc.scaleMultiplier * 1.5, low: smc.basePrice - smc.scaleMultiplier * 0.1, bull: false },
    // Order Block mitigation / Rebound candle
    { x: 355, open: smc.basePrice + smc.scaleMultiplier * 0.5, close: smc.basePrice + smc.scaleMultiplier * 1.8, high: smc.basePrice + smc.scaleMultiplier * 2.0, low: smc.basePrice + smc.scaleMultiplier * 0.2, bull: true },
    { x: 395, open: smc.basePrice + smc.scaleMultiplier * 1.8, close: smc.basePrice + smc.scaleMultiplier * 3.2, high: smc.basePrice + smc.scaleMultiplier * 3.5, low: smc.basePrice + smc.scaleMultiplier * 1.5, bull: true }
  ];

  const decimalAdjust = (val: number) => {
    return selectedPair.includes('USD') && !selectedPair.includes('XAU') ? val.toFixed(2) : val.toFixed(4);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 p-5 rounded-xl shadow-xl backdrop-blur-sm space-y-5">
      
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">SMC Institutional Liquidity Map</h4>
          </div>
          <p className="text-[10px] text-slate-500 font-sans mt-0.5">
            Algorithmic structure visualizer for {selectedPair} ({selectedTimeframe})
          </p>
        </div>

        {/* Dynamic Controls Row */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={() => setShowZones(!showZones)}
            className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition-colors border cursor-pointer ${
              showZones ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300'
            }`}
          >
            Zones
          </button>
          <button 
            onClick={() => setShowFvg(!showFvg)}
            className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition-colors border cursor-pointer ${
              showFvg ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300'
            }`}
          >
            FVG
          </button>
          <button 
            onClick={() => setShowOb(!showOb)}
            className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition-colors border cursor-pointer ${
              showOb ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300'
            }`}
          >
            Order Blocks
          </button>
          <button 
            onClick={() => setAnimateFlow(!animateFlow)}
            className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition-colors border cursor-pointer ${
              animateFlow ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-slate-950 border-slate-850 text-slate-500'
            }`}
          >
            Flow Anim
          </button>
        </div>
      </div>

      {/* SVG Canvas Board */}
      <div className="relative bg-[#02050b] rounded-xl border border-slate-950 overflow-hidden shadow-inner p-2 select-none">
        
        {/* Absolute indicators */}
        <div className="absolute top-3 left-3 flex flex-col space-y-1 z-10 pointer-events-none">
          <span className="text-[8px] font-mono font-bold text-rose-500 uppercase tracking-wide">Premium Zone (Shorts Only)</span>
          <span className="text-[8px] font-mono font-bold text-slate-600 uppercase tracking-wide">Equilibrium (0.50 Ratio)</span>
          <span className="text-[8px] font-mono font-bold text-emerald-500 uppercase tracking-wide">Discount Zone (OTE Longs)</span>
        </div>

        <svg viewBox="0 0 450 260" className="w-full h-auto">
          {/* Grid lines */}
          <line x1="0" y1="130" x2="450" y2="130" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.8" />
          
          {/* Fibonacci Zones Shading */}
          {showZones && (
            <>
              {/* Premium Zone (upper half) */}
              <rect x="0" y="0" width="450" height="130" fill="rgba(239, 68, 68, 0.015)" />
              {/* Discount Zone (lower half) */}
              <rect x="0" y="130" width="450" height="130" fill="rgba(16, 185, 129, 0.015)" />
            </>
          )}

          {/* Bearish Order Block (Red Top) */}
          {showOb && (
            <g className="cursor-pointer group" onClick={() => onSetEntry(smc.obBearish.min)}>
              <rect 
                x="200" 
                y={mapPriceToY(smc.obBearish.max)} 
                width="140" 
                height={mapPriceToY(smc.obBearish.min) - mapPriceToY(smc.obBearish.max)} 
                fill="rgba(239, 68, 68, 0.08)" 
                stroke="rgba(239, 68, 68, 0.25)" 
                strokeWidth="1" 
              />
              <line 
                x1="200" 
                y1={mapPriceToY((smc.obBearish.max + smc.obBearish.min)/2)} 
                x2="340" 
                y2={mapPriceToY((smc.obBearish.max + smc.obBearish.min)/2)} 
                stroke="rgba(239, 68, 68, 0.4)" 
                strokeDasharray="2,2" 
              />
              <text x="210" y={mapPriceToY(smc.obBearish.max) + 12} fill="#ef4444" fontSize="6" fontFamily="monospace" fontWeight="bold">
                {smc.obBearish.label}
              </text>
            </g>
          )}

          {/* Bullish Order Block (Green Bottom) */}
          {showOb && (
            <g className="cursor-pointer group" onClick={() => onSetEntry(smc.obBullish.max)}>
              <rect 
                x="110" 
                y={mapPriceToY(smc.obBullish.max)} 
                width="280" 
                height={mapPriceToY(smc.obBullish.min) - mapPriceToY(smc.obBullish.max)} 
                fill="rgba(16, 185, 129, 0.06)" 
                stroke="rgba(16, 185, 129, 0.25)" 
                strokeWidth="1" 
              />
              <line 
                x1="110" 
                y1={mapPriceToY((smc.obBullish.max + smc.obBullish.min)/2)} 
                x2="390" 
                y2={mapPriceToY((smc.obBullish.max + smc.obBullish.min)/2)} 
                stroke="rgba(16, 185, 129, 0.4)" 
                strokeDasharray="2,2" 
              />
              <text x="120" y={mapPriceToY(smc.obBullish.min) - 6} fill="#10b981" fontSize="6" fontFamily="monospace" fontWeight="bold">
                {smc.obBullish.label}
              </text>
            </g>
          )}

          {/* Fair Value Gap (Amber Middle) */}
          {showFvg && (
            <g>
              <rect 
                x="155" 
                y={mapPriceToY(smc.fvg.min)} 
                width="120" 
                height={mapPriceToY(smc.fvg.max) - mapPriceToY(smc.fvg.min)} 
                fill="rgba(245, 158, 11, 0.04)" 
                stroke="rgba(245, 158, 11, 0.2)" 
                strokeWidth="0.8" 
                strokeDasharray="4,2"
              />
              <text x="165" y={mapPriceToY(smc.fvg.min) - 5} fill="#f59e0b" fontSize="6" fontFamily="monospace" fontWeight="bold">
                {smc.fvg.label}
              </text>
            </g>
          )}

          {/* BOS and CHoCH Structure Lines */}
          <line x1="115" y1={mapPriceToY(smc.bosLine)} x2="255" y2={mapPriceToY(smc.bosLine)} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />
          <text x="140" y={mapPriceToY(smc.bosLine) - 4} fill="#f59e0b" fontSize="6" fontFamily="monospace" fontWeight="bold">BOS (Break of Structure)</text>

          <line x1="35" y1={mapPriceToY(smc.chochLine)} x2="155" y2={mapPriceToY(smc.chochLine)} stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
          <text x="45" y={mapPriceToY(smc.chochLine) - 4} fill="#ef4444" fontSize="6" fontFamily="monospace" fontWeight="bold">CHoCH (Change of Character)</text>

          {/* Liquidity Sweep horizontal line */}
          <line x1="0" y1={mapPriceToY(smc.liquiditySweep)} x2="450" y2={mapPriceToY(smc.liquiditySweep)} stroke="#3b82f6" strokeWidth="0.8" strokeDasharray="5,5" />
          <text x="320" y={mapPriceToY(smc.liquiditySweep) + 9} fill="#3b82f6" fontSize="6" fontFamily="monospace" fontWeight="bold">LIQUIDITY SWEEP POOL</text>

          {/* Draw Candlesticks */}
          {candles.map((candle, idx) => {
            const bodyY = candle.bull ? mapPriceToY(candle.close) : mapPriceToY(candle.open);
            const bodyHeight = Math.max(1.5, Math.abs(mapPriceToY(candle.close) - mapPriceToY(candle.open)));
            const wickTop = mapPriceToY(candle.high);
            const wickBottom = mapPriceToY(candle.low);
            const color = candle.bull ? '#10b981' : '#ef4444';

            return (
              <g key={idx} className="hover:opacity-80 transition-opacity">
                {/* Wick */}
                <line x1={candle.x} y1={wickTop} x2={candle.x} y2={wickBottom} stroke={color} strokeWidth="1.2" />
                {/* Body */}
                <rect 
                  x={candle.x - 7} 
                  y={bodyY} 
                  width="14" 
                  height={bodyHeight} 
                  fill={candle.bull ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)'} 
                  stroke={color} 
                  strokeWidth="0.5" 
                />

                {/* Sweep specific annotation */}
                {candle.isSweep && (
                  <g>
                    <circle cx={candle.x} cy={wickBottom} r="3" fill="#3b82f6" className="animate-pulse" />
                    <text x={candle.x - 15} y={wickBottom + 10} fill="#3b82f6" fontSize="5" fontFamily="monospace" fontWeight="bold">SWEEP</text>
                  </g>
                )}

                {/* BOS specific annotation */}
                {candle.isBos && (
                  <g>
                    <path d={`M ${candle.x} ${wickTop - 4} l -2 -3 l 4 0 z`} fill="#f59e0b" />
                  </g>
                )}
              </g>
            );
          })}

          {/* Real-time Order flow scan animation ripple */}
          {animateFlow && (
            <line 
              x1="395" 
              y1="0" 
              x2="395" 
              y2="260" 
              stroke="rgba(245,158,11,0.2)" 
              strokeWidth="2" 
              className="animate-pulse"
            />
          )}
        </svg>
      </div>

      {/* Helper Footer */}
      <div className="flex items-start gap-2.5 bg-slate-950/60 p-3.5 border border-slate-850/80 rounded-xl text-[10px] text-slate-400 font-sans leading-relaxed">
        <Sliders className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-amber-400 font-mono font-bold uppercase text-[9.5px] block tracking-wide">HOW TO MITIGATE ENTIRES</span>
          <p>
            The canvas automatically maps the structural block metrics of <strong className="text-white">{selectedPair}</strong>. Hover and click on any marked green/red <strong>Order Block</strong> boundaries to inject the entry level directly into your risk matrix.
          </p>
        </div>
      </div>
    </div>
  );
}
