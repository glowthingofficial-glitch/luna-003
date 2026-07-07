import React from 'react';
import { Trade, PriceData } from '../types';
import { Calculator, FileText, Trash2, HelpCircle, PlusCircle, Sparkles, TrendingUp, TrendingDown, Percent, DollarSign, Activity } from 'lucide-react';

interface JournalCalculatorProps {
  prices: Record<string, PriceData>;
  // Calculator state
  riskPair: string;
  setRiskPair: (val: string) => void;
  riskPercent: string;
  setRiskPercent: (val: string) => void;
  riskBalance: string;
  setRiskBalance: (val: string) => void;
  riskSLPips: string;
  setRiskSLPips: (val: string) => void;
  calculatorResult: { riskAmount: number; lotSize: number; multiplier: number; } | null;

  // Logger Form state
  journalPair: string;
  setJournalPair: (val: string) => void;
  journalDir: 'BUY' | 'SELL';
  setJournalDir: (val: 'BUY' | 'SELL') => void;
  journalEntry: string;
  setJournalEntry: (val: string) => void;
  journalSL: string;
  setJournalSL: (val: string) => void;
  journalTP: string;
  setJournalTP: (val: string) => void;
  journalOutcome: 'WIN' | 'LOSS' | 'PENDING';
  setJournalOutcome: (val: 'WIN' | 'LOSS' | 'PENDING') => void;
  journalPnl: string;
  setJournalPnl: (val: string) => void;
  journalSession: 'TOKYO' | 'LONDON' | 'NEW YORK' | 'SYDNEY';
  setJournalSession: (val: 'TOKYO' | 'LONDON' | 'NEW YORK' | 'SYDNEY') => void;
  journalNotes: string;
  setJournalNotes: (val: string) => void;
  journalError: string;
  onLogTradeSubmit: (e: React.FormEvent) => void;

  // DB Trade state
  trades: Trade[];
  onDeleteTrade: (id: string) => void;
  onSeedDemoTrades: () => void;
  onClearAllTrades: () => void;
  stats: { total: number; winRate: number; totalPnl: number; };
}

export default function JournalCalculator({
  prices,
  riskPair,
  setRiskPair,
  riskPercent,
  setRiskPercent,
  riskBalance,
  setRiskBalance,
  riskSLPips,
  setRiskSLPips,
  calculatorResult,
  journalPair,
  setJournalPair,
  journalDir,
  setJournalDir,
  journalEntry,
  setJournalEntry,
  journalSL,
  setJournalSL,
  journalTP,
  setJournalTP,
  journalOutcome,
  setJournalOutcome,
  journalPnl,
  setJournalPnl,
  journalSession,
  setJournalSession,
  journalNotes,
  setJournalNotes,
  journalError,
  onLogTradeSubmit,
  trades,
  onDeleteTrade,
  onSeedDemoTrades,
  onClearAllTrades,
  stats
}: JournalCalculatorProps) {
  const assets = ['BTCUSD', 'XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY'] as const;
  const sessions = ['TOKYO', 'LONDON', 'NEW YORK', 'SYDNEY'] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn font-sans">
      
      {/* Left Columns (Lot Calculator + Manual Logger Form) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* 1. Lot Calculator Widget */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 shadow-xl backdrop-blur-sm">
          <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-500" />
            Risk Lot Calculator
          </h3>

          <div className="space-y-4 text-xs text-slate-300">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] text-slate-500 font-mono font-bold block mb-1 uppercase tracking-wider">Asset Class</label>
                <select
                  value={riskPair}
                  onChange={(e) => setRiskPair(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500/40 cursor-pointer"
                >
                  {assets.map(sym => (
                    <option key={sym} value={sym}>{sym}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[8px] text-slate-500 font-mono font-bold block mb-1 uppercase tracking-wider">Risk Percent</label>
                <div className="relative">
                  <input
                    type="number"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 pr-7 focus:outline-none focus:border-amber-500/40"
                  />
                  <span className="absolute right-2.5 top-1.5 text-slate-600 font-mono text-[10px] font-bold">%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] text-slate-500 font-mono font-bold block mb-1 uppercase tracking-wider">Account Bal ($)</label>
                <input
                  type="number"
                  value={riskBalance}
                  onChange={(e) => setRiskBalance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500/40"
                />
              </div>

              <div>
                <label className="text-[8px] text-slate-500 font-mono font-bold block mb-1 uppercase tracking-wider">Stop Loss (Pips)</label>
                <input
                  type="number"
                  value={riskSLPips}
                  onChange={(e) => setRiskSLPips(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500/40"
                />
              </div>
            </div>

            {calculatorResult ? (
              <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center text-[10px] border-b border-amber-500/10 pb-1.5 font-mono">
                  <span className="text-slate-400">MAX FIAT ACCUMULATION RISK:</span>
                  <span className="font-bold text-white">${calculatorResult.riskAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-400 font-bold">SUGGESTED CONTRACT LOTS:</span>
                  <span className="text-xs font-bold text-amber-400">{calculatorResult.lotSize} Lots</span>
                </div>

                <div className="text-[8px] text-slate-500 text-center leading-normal">
                  * Leverage mapping strictly respects standard contract sizing of {riskPair}. Adjust SL parameters per structure.
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-950/40 text-center rounded-xl border border-slate-900 text-slate-500 text-[10px] font-sans">
                Enter risk parameters to view lot allocations.
              </div>
            )}
          </div>
        </div>

        {/* 2. Manual Trade Logger Form */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 shadow-xl backdrop-blur-sm">
          <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            Manually Log Trade
          </h3>

          <form onSubmit={onLogTradeSubmit} className="space-y-4 text-xs">
            {journalError && <p className="text-rose-400 text-[10px] font-mono font-bold">{journalError}</p>}
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] text-slate-500 font-mono font-bold block mb-1">Asset</label>
                <select
                  value={journalPair}
                  onChange={(e) => setJournalPair(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500/40 cursor-pointer"
                >
                  {assets.map(sym => (
                    <option key={sym} value={sym}>{sym}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[8px] text-slate-500 font-mono font-bold block mb-1">Direction</label>
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setJournalDir('BUY')}
                    className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-md cursor-pointer transition-colors ${
                      journalDir === 'BUY' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setJournalDir('SELL')}
                    className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-md cursor-pointer transition-colors ${
                      journalDir === 'SELL' 
                        ? 'bg-rose-500/10 text-rose-400' 
                        : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    SELL
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[8px] text-slate-500 font-mono font-bold block">Entry Price</label>
                  {prices && prices[journalPair] && (
                    <button
                      type="button"
                      onClick={() => {
                        const curPrice = prices[journalPair].price;
                        setJournalEntry(curPrice.toString());
                        // Auto-calculate suggested SL and TP based on typical SMC structure
                        if (journalPair === 'BTCUSD') {
                          setJournalSL((curPrice - (journalDir === 'BUY' ? 450 : -450)).toFixed(0));
                          setJournalTP((curPrice + (journalDir === 'BUY' ? 900 : -900)).toFixed(0));
                        } else if (journalPair === 'XAUUSD') {
                          setJournalSL((curPrice - (journalDir === 'BUY' ? 5 : -5)).toFixed(1));
                          setJournalTP((curPrice + (journalDir === 'BUY' ? 10 : -10)).toFixed(1));
                        } else {
                          setJournalSL((curPrice - (journalDir === 'BUY' ? 0.0030 : -0.0030)).toFixed(5));
                          setJournalTP((curPrice + (journalDir === 'BUY' ? 0.0060 : -0.0060)).toFixed(5));
                        }
                      }}
                      className="text-[7px] font-mono font-bold text-amber-400 hover:text-slate-950 hover:bg-amber-400 bg-amber-500/10 px-1 rounded cursor-pointer transition-all uppercase tracking-wider"
                      title="Auto-feed live spot price from the feed"
                    >
                      ⚡ Feed
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="any"
                  value={journalEntry}
                  onChange={(e) => setJournalEntry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-amber-500/40"
                  placeholder="61250"
                />
              </div>
              <div>
                <label className="text-[8px] text-rose-400 font-mono font-bold block mb-1">Stop Loss</label>
                <input
                  type="number"
                  step="any"
                  value={journalSL}
                  onChange={(e) => setJournalSL(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-amber-500/40"
                  placeholder="60500"
                />
              </div>
              <div>
                <label className="text-[8px] text-emerald-400 font-mono font-bold block mb-1">Take Profit</label>
                <input
                  type="number"
                  step="any"
                  value={journalTP}
                  onChange={(e) => setJournalTP(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-amber-500/40"
                  placeholder="62500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] text-slate-500 font-mono font-bold block mb-1">Outcome</label>
                <select
                  value={journalOutcome}
                  onChange={(e) => setJournalOutcome(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500/40 cursor-pointer"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="WIN">WIN</option>
                  <option value="LOSS">LOSS</option>
                </select>
              </div>

              <div>
                <label className="text-[8px] text-slate-500 font-mono font-bold block mb-1">P&L Delta ($)</label>
                <input
                  type="number"
                  value={journalPnl}
                  onChange={(e) => setJournalPnl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-amber-500/40"
                  placeholder="0"
                  disabled={journalOutcome === 'PENDING'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] text-slate-500 font-mono font-bold block mb-1">Session</label>
                <select
                  value={journalSession}
                  onChange={(e) => setJournalSession(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500/40 cursor-pointer"
                >
                  {sessions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[8px] text-slate-500 font-mono font-bold block mb-1">SMC Setup Comment</label>
                <input
                  type="text"
                  value={journalNotes}
                  onChange={(e) => setJournalNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-amber-500/40"
                  placeholder="BOS liquidity grab"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-slate-950 font-sans font-bold uppercase rounded-xl tracking-wide text-xs transition-colors duration-200 cursor-pointer"
            >
              Log Active Trade
            </button>
          </form>
        </div>

      </div>

      {/* Right Column (Trade Archive Database & Analytics Panels) */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Archive Board */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 mb-4 gap-4">
            <div>
              <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">Recorded Trade Logs Archive</h3>
              <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Persistent log of institutional entries synced in browser memory</p>
            </div>

            <div className="flex space-x-2">
              {trades.length === 0 && (
                <button
                  onClick={onSeedDemoTrades}
                  className="px-3 py-1.5 bg-slate-950 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                >
                  💡 SEED DEMO DATA
                </button>
              )}
              {trades.length > 0 && (
                <button
                  onClick={onClearAllTrades}
                  className="px-3 py-1.5 bg-rose-500/10 text-rose-300 hover:text-white border border-rose-500/20 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                >
                  Clear Archive
                </button>
              )}
            </div>
          </div>

          {/* Stats Bento-Grid */}
          {trades.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-5 font-mono">
              <div className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl">
                <span className="text-[8px] text-slate-500 block font-bold uppercase tracking-wider mb-1">CLOSED CONTRACTS</span>
                <span className="text-xs font-bold text-white">{stats.total} Trades</span>
              </div>
              <div className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl">
                <span className="text-[8px] text-slate-500 block font-bold uppercase tracking-wider mb-1">WIN RATIO METRIC</span>
                <span className="text-xs font-bold text-emerald-400">{stats.winRate.toFixed(1)}%</span>
              </div>
              <div className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl">
                <span className="text-[8px] text-slate-500 block font-bold uppercase tracking-wider mb-1">ACCUMULATED NET PNL</span>
                <span className={`text-xs font-bold ${stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Table list */}
          {trades.length === 0 ? (
            <div className="text-center py-20 text-slate-500 bg-slate-950/30 border border-slate-900 rounded-2xl">
              <FileText className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">No Trade History Logged</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                Your database is currently clean. Input metrics using the left cockpit panel or pre-fill using the seed option above.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {trades.map(t => {
                const isWin = t.outcome === 'WIN';
                const isLoss = t.outcome === 'LOSS';
                return (
                  <div key={t.id} className="p-3.5 bg-slate-950/50 border border-slate-900 hover:border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-200">
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                        isWin 
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                          : isLoss 
                            ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' 
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        {t.outcome}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white font-mono">{t.pair}</span>
                          <span className={`text-[9px] font-mono font-bold uppercase ${t.dir === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {t.dir}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{t.date} • {t.session}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px] flex-1 text-slate-400 font-sans">
                      <div>
                        <span className="text-[8px] text-slate-500 font-mono font-bold block uppercase tracking-wider mb-0.5">Entry Trigger</span>
                        <span className="text-slate-200 font-mono font-semibold">{t.entry}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-500 font-mono font-bold block uppercase tracking-wider mb-0.5">SL / TP Matrix</span>
                        <span className="text-slate-400 font-mono">{t.sl} / {t.tp}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-500 font-mono font-bold block uppercase tracking-wider mb-0.5">PNL Delta</span>
                        <span className={`font-mono font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[8px] text-slate-500 font-mono font-bold block uppercase tracking-wider mb-0.5">SMC Notes</span>
                        <span className="text-slate-400 font-sans block truncate max-w-[130px] italic">{t.notes}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteTrade(t.id)}
                      className="text-slate-600 hover:text-rose-400 p-2 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer self-end md:self-center shrink-0 border border-transparent hover:border-rose-500/20"
                      title="Delete Trade Log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
