import React, { useState } from 'react';
import { ScanResult, SignalItem } from '../types';
import { Search, RefreshCw, Cpu, Brain, Check, Copy, TrendingUp, TrendingDown, Sparkles, Layout, HelpCircle } from 'lucide-react';

interface SmcScannerProps {
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  selectedTimeframe: string;
  setSelectedTimeframe: (tf: string) => void;
  isScanning: boolean;
  onTriggerScan: () => void;
  scanResult: ScanResult | null;
  onUseSignal: (sig: SignalItem) => void;
}

export default function SmcScanner({
  selectedPair,
  setSelectedPair,
  selectedTimeframe,
  setSelectedTimeframe,
  isScanning,
  onTriggerScan,
  scanResult,
  onUseSignal
}: SmcScannerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const pairs = ['BTCUSD', 'XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY'] as const;
  const timeframes = ['5m', '15m', '1h', '4h'] as const;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Algorithmic Settings Console */}
      <div className="bg-slate-900/60 border border-slate-800/60 p-5 rounded-xl shadow-xl backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">SMC Structural Machine</h3>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Algorithmic scanning for Market Structure Break (BOS), Change of Character (CHoCH), and Order Blocks
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Pairs select */}
            <div className="flex flex-wrap gap-1.5">
              {pairs.map(sym => (
                <button
                  key={sym}
                  onClick={() => setSelectedPair(sym)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-200 border cursor-pointer ${
                    selectedPair === sym 
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_2px_8px_rgba(245,158,11,0.06)]' 
                      : 'bg-slate-950/50 border-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>

            {/* Timeframe select */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-850">
              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase px-1.5">TF:</span>
              {timeframes.map(tf => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-2.5 py-1 text-[10px] font-bold font-mono rounded-lg transition-all cursor-pointer ${
                    selectedTimeframe === tf 
                      ? 'bg-slate-850 text-amber-400' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Execute Button */}
            <button
              onClick={onTriggerScan}
              disabled={isScanning}
              className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:bg-slate-950 disabled:text-slate-600 text-slate-950 font-sans font-bold text-xs rounded-xl flex items-center gap-2 tracking-wide transition-all duration-200 cursor-pointer shadow-[0_4px_12px_rgba(255,255,255,0.05)]"
            >
              {isScanning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
              ) : (
                <Cpu className="w-3.5 h-3.5 text-slate-950" />
              )}
              {isScanning ? 'SYNTHESIZING MARKET...' : 'EXECUTE STRUCTURE SCAN'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Primary Scan Output Panel */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl shadow-xl backdrop-blur-sm p-6 min-h-[400px] flex flex-col justify-center">
        {isScanning ? (
          <div className="text-center py-20 space-y-4 max-w-sm mx-auto animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto animate-spin">
              <RefreshCw className="w-5 h-5 text-amber-400" />
            </div>
            <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">AI CONVERGENCE ENGINE</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Polled live order logs for <strong>{selectedPair}</strong>. Mapped local Support, resistance blocks, compiling dual LLM perspectives.
            </p>
          </div>
        ) : !scanResult ? (
          <div className="text-center py-20 max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-600 mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">AWAITING SCAN TRIGGER</h4>
              <p className="text-[11px] text-slate-500 font-sans mt-1 leading-relaxed">
                Click the <strong>"Execute Structure Scan"</strong> button. The system will analyze live order book matrices, map order blocks, and spin up the Gemini boardroom agents.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            {/* Verdict Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
              <div className="flex items-center gap-3">
                <div className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold ${
                  scanResult.verdict.includes('BUY') 
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                    : scanResult.verdict.includes('SELL') 
                      ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' 
                      : 'bg-slate-950 border border-slate-800 text-slate-400'
                }`}>
                  {scanResult.verdict}
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-white">
                    {selectedPair} SMC Thesis
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wide">
                    Timeframe: {selectedTimeframe} • Market state: <span className="text-slate-300 font-bold">{scanResult.trend}</span>
                  </p>
                </div>
              </div>

              {/* Confidence meter */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 font-mono font-bold block uppercase tracking-wider">AI Confidence</span>
                  <span className="text-sm font-mono font-bold text-white">{scanResult.confidence}%</span>
                </div>
                <div className="w-24 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${scanResult.confidence}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Smart Money Levels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950/60 border border-slate-850/80 rounded-xl">
                <span className="text-[9px] text-slate-500 font-mono font-bold block uppercase tracking-wider mb-1">Key Order Block</span>
                <span className="text-xs font-mono font-bold text-slate-200">{scanResult.orderBlock}</span>
              </div>
              <div className="p-4 bg-slate-950/60 border border-slate-850/80 rounded-xl">
                <span className="text-[9px] text-slate-500 font-mono font-bold block uppercase tracking-wider mb-1">Support Level</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{scanResult.support}</span>
              </div>
              <div className="p-4 bg-slate-950/60 border border-slate-850/80 rounded-xl">
                <span className="text-[9px] text-slate-500 font-mono font-bold block uppercase tracking-wider mb-1">Resistance Level</span>
                <span className="text-xs font-mono font-bold text-rose-400">{scanResult.resistance}</span>
              </div>
            </div>

            {/* Perspectives Grid (Gemini vs Groq Llama) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Gemini Agent */}
              <div className="p-5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Brain className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-white block uppercase tracking-wide">Gemini 2.5 Pro</span>
                    <span className="text-[8px] text-emerald-400 font-mono block">SMC RESEARCH ANALYST</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed italic">
                  "{scanResult.geminiView || scanResult.reasoning}"
                </p>
              </div>

              {/* Groq Agent */}
              <div className="p-5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-white block uppercase tracking-wide">Llama-3.3 (Groq)</span>
                    <span className="text-[8px] text-amber-400 font-mono block">QUANT RISK SPECIALIST</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed italic">
                  "{scanResult.groqView || 'Structure confirms liquidity pools are heavily concentrated below the key Order Block support. Cautious long execution advised.'}"
                </p>
              </div>
            </div>

            {/* Joint Room Debate Transcript */}
            {scanResult.debateTranscript && scanResult.debateTranscript.length > 0 && (
              <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-5 space-y-4">
                <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider pb-2 border-b border-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  Boardroom Consensus Debate
                </h4>
                
                <div className="space-y-3.5 max-h-[250px] overflow-y-auto scrollbar-thin pr-1 text-[11px] font-sans">
                  {scanResult.debateTranscript.map((dialogue, idx) => {
                    const isGemini = dialogue.speaker.toLowerCase().includes('gemini');
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border leading-relaxed ${
                          isGemini 
                            ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-100/90 ml-4' 
                            : 'bg-amber-500/5 border-amber-500/10 text-amber-100/90 mr-4'
                        }`}
                      >
                        <span className={`font-mono font-bold text-[9px] block mb-1 uppercase tracking-wider ${
                          isGemini ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {dialogue.speaker}
                        </span>
                        <p className="italic">"{dialogue.text}"</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Entry Matrix setup & Scalping Plan */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-3">
              {/* Parameter setup cards (col-span-7) */}
              <div className="lg:col-span-7 p-5 bg-gradient-to-r from-slate-950/60 to-slate-950/40 border border-slate-850/80 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">SMC Entry Matrix</h4>
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase">Interactive Limits</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl relative group">
                    <span className="text-[8px] text-slate-500 font-mono font-bold block uppercase tracking-wider mb-1">Entry Trigger</span>
                    <span className="text-xs font-mono font-bold text-white block">{scanResult.tradeSetup.entry}</span>
                    <button 
                      onClick={() => handleCopy(scanResult!.tradeSetup.entry.toString(), 'entry')}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-opacity"
                    >
                      {copiedField === 'entry' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl relative group">
                    <span className="text-[8px] text-rose-500 font-mono font-bold block uppercase tracking-wider mb-1">Stop Loss</span>
                    <span className="text-xs font-mono font-bold text-rose-400 block">{scanResult.tradeSetup.sl}</span>
                    <button 
                      onClick={() => handleCopy(scanResult!.tradeSetup.sl.toString(), 'sl')}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity"
                    >
                      {copiedField === 'sl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl relative group">
                    <span className="text-[8px] text-emerald-500 font-mono font-bold block uppercase tracking-wider mb-1">Take Profit 1</span>
                    <span className="text-xs font-mono font-bold text-emerald-400 block">{scanResult.tradeSetup.tp1}</span>
                    <button 
                      onClick={() => handleCopy(scanResult!.tradeSetup.tp1.toString(), 'tp1')}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-emerald-400 transition-opacity"
                    >
                      {copiedField === 'tp1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl relative group">
                    <span className="text-[8px] text-slate-400 font-mono font-bold block uppercase tracking-wider mb-1">Risk : Reward</span>
                    <span className="text-xs font-mono font-bold text-amber-400 block">{scanResult.tradeSetup.rrRatio}</span>
                  </div>
                </div>

                {/* Port parameter action */}
                <button
                  onClick={() => {
                    const mappedSignal: SignalItem = {
                      id: `sig-${Date.now()}`,
                      timestamp: 'Just now',
                      pair: selectedPair,
                      dir: scanResult!.verdict.includes('BUY') ? 'BUY' : 'SELL',
                      entry: scanResult!.tradeSetup.entry,
                      sl: scanResult!.tradeSetup.sl,
                      tp1: scanResult!.tradeSetup.tp1,
                      tp2: scanResult!.tradeSetup.tp2,
                      rrRatio: scanResult!.tradeSetup.rrRatio,
                      confidence: scanResult!.confidence,
                      status: 'ACTIVE'
                    };
                    onUseSignal(mappedSignal);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-slate-900 to-slate-900 hover:from-amber-500 hover:to-amber-600 border border-amber-500/20 hover:border-amber-400 text-amber-400 hover:text-slate-950 font-sans font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all duration-300 cursor-pointer"
                >
                  DESTRUCTIVELY PORT ENTRY PARAMETERS TO RISK CALCULATOR
                </button>
              </div>

              {/* Scalp Plan (col-span-5) */}
              <div className="lg:col-span-5 p-5 bg-slate-950/60 border border-slate-850/80 rounded-xl flex flex-col justify-between">
                <div>
                  <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider pb-2 border-b border-slate-900 mb-3">
                    Active Scalping Strategy
                  </h4>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    {scanResult.scalpPlan}
                  </p>
                </div>
                <div className="text-[9px] text-slate-500 font-mono border-t border-slate-900 pt-3 mt-4">
                  * Live parameter verification required inside regional MT5 terminal before trade execution.
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
