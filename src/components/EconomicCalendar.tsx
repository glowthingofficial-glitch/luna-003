import React from 'react';
import { NewsEvent, NewsAnalysis } from '../types';
import { Calendar, RefreshCw, HelpCircle, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';

interface EconomicCalendarProps {
  newsEvents: NewsEvent[];
  newsAnalysis: NewsAnalysis | null;
  isNewsLoading: boolean;
  onAnalyzeNews: () => void;
}

export default function EconomicCalendar({
  newsEvents,
  newsAnalysis,
  isNewsLoading,
  onAnalyzeNews
}: EconomicCalendarProps) {
  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Settings Panel */}
      <div className="bg-slate-900/60 border border-slate-800/60 p-5 rounded-xl shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">Macroeconomic Catalyst Calendar</h3>
            <p className="text-xs text-slate-400">
              Live economic calendar release feed polled and synthetically processed for structural directional bias
            </p>
          </div>

          <button
            onClick={onAnalyzeNews}
            disabled={isNewsLoading}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500/10 to-amber-500/5 hover:from-amber-500 hover:to-amber-600 border border-amber-500/30 hover:border-amber-400 text-amber-400 hover:text-slate-950 font-mono font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.04)]"
          >
            {isNewsLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <Calendar className="w-3.5 h-3.5" />
            )}
            {isNewsLoading ? 'SYNTHESIZING CATALYSTS...' : 'ANALYZE MACRO TRIGGERS'}
          </button>
        </div>
      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Economic Calendar Release Table */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 shadow-xl backdrop-blur-sm">
          <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider mb-4">Economic releases</h4>

          {newsEvents.length === 0 ? (
            <div className="text-center py-20 text-slate-500 space-y-3">
              <Calendar className="w-8 h-8 text-slate-700 mx-auto" />
              <p className="text-xs font-sans">
                No calendar entries processed. Click "Analyze Macro Triggers" to aggregate the feed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider">
                    <th className="pb-3">Country</th>
                    <th className="pb-3">Macro Trigger Catalyst</th>
                    <th className="pb-3 text-center">Expected Impact</th>
                    <th className="pb-3 text-right">Forecast / Prev</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {newsEvents.map((evt, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/20 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-slate-200">{evt.country}</td>
                      <td className="py-3.5 text-white font-medium">{evt.title}</td>
                      <td className="py-3.5 text-center">
                        <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${
                          evt.impact === 'High' 
                            ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' 
                            : evt.impact === 'Medium' 
                              ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' 
                              : 'bg-slate-950 border-slate-850 text-slate-500'
                        }`}>
                          {evt.impact}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-mono text-slate-400 text-[11px]">
                        {evt.forecast || 'N/A'} <span className="text-slate-600">/</span> {evt.previous || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI Catalyst Macro Synthesis */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              SMC Sentiment Bias compiler
            </h4>

            {!newsAnalysis ? (
              <div className="text-center py-20 text-slate-500 space-y-3 my-auto">
                <HelpCircle className="w-8 h-8 text-slate-700 mx-auto" />
                <p className="text-xs max-w-xs mx-auto leading-relaxed">
                  Trigger the macro synthesis compiler above to aggregate raw release data points into a solid sentiment bias.
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                {/* Compiler narrative */}
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-2">
                  <span className="text-amber-400 font-mono font-bold uppercase text-[9px] block tracking-widest">Compiler Synthesis</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    {newsAnalysis.macroNarrative}
                  </p>
                </div>

                {/* Specific advisories */}
                <div className="space-y-3">
                  <span className="text-slate-400 font-mono font-bold uppercase text-[9px] block tracking-wider border-b border-slate-850 pb-1.5">
                    Advisory Execution Guides
                  </span>
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto scrollbar-thin">
                    {newsAnalysis.events.map((evt, idx) => {
                      const isBullish = evt.sentimentBias.includes('BULLISH') || evt.sentimentBias.includes('ALIGNMENT');
                      return (
                        <div key={idx} className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 space-y-2 text-[11px] hover:border-slate-850 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200 font-sans">{evt.title}</span>
                            <span className={`text-[8px] font-mono font-bold px-1.5 rounded uppercase tracking-wider ${
                              isBullish 
                                ? 'bg-emerald-500/15 text-emerald-400' 
                                : 'bg-rose-500/15 text-rose-400'
                            }`}>
                              {evt.sentimentBias}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                            {evt.scalperAdvice}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-[9px] text-slate-500 font-mono border-t border-slate-900 pt-3 mt-4 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-slate-600 shrink-0" />
            <span>Avoid holding limit orders across major economic release seconds.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
