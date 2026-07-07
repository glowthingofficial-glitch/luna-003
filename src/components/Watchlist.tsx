import React, { useState } from 'react';
import { PriceData } from '../types';
import { TrendingUp, TrendingDown, RefreshCw, Zap, BarChart2 } from 'lucide-react';

interface WatchlistProps {
  prices: Record<string, PriceData>;
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  lastUpdateTime: string;
}

export default function Watchlist({ prices, selectedPair, setSelectedPair, lastUpdateTime }: WatchlistProps) {
  const [feedMode, setFeedMode] = useState<'terminal' | 'tradingview'>('terminal');
  const symbols = ['BTCUSD', 'XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY'] as const;

  const getDecimalCount = (sym: string) => {
    if (sym === 'BTCUSD') return 2;
    if (sym === 'XAUUSD' || sym.includes('JPY')) return 2;
    return 5;
  };

  const getFriendlyName = (sym: string) => {
    switch (sym) {
      case 'BTCUSD': return 'Bitcoin / US Dollar';
      case 'XAUUSD': return 'Spot Gold / US Dollar';
      case 'EURUSD': return 'Euro / US Dollar';
      case 'GBPUSD': return 'British Pound / US Dollar';
      case 'USDJPY': return 'US Dollar / Japanese Yen';
      case 'GBPJPY': return 'British Pound / Japanese Yen';
      default: return '';
    }
  };

  // URL-encoded symbols list for TradingView's Market Quotes Widget
  const tvQuotesWidgetUrl = `https://s.tradingview.com/embed-widget/market-quotes/?locale=en&theme=dark&symbols=%5B%7B%22name%22%3A%22COINBASE%3ABTCUSD%22%2C%22displayName%22%3A%22BTC%2FUSD%22%7D%2C%7B%22name%22%3A%22OANDA%3AXAUUSD%22%2C%22displayName%22%3A%22Gold%22%7D%2C%7B%22name%22%3A%22FX%3AEURUSD%22%2C%22displayName%22%3A%22EUR%2FUSD%22%7D%2C%7B%22name%22%3A%22FX%3AGBPUSD%22%2C%22displayName%22%3A%22GBP%2FUSD%22%7D%2C%7B%22name%22%3A%22FX%3AUSDJPY%22%2C%22displayName%22%3A%22USD%2FJPY%22%7D%2C%7B%22name%22%3A%22FX%3AGBPJPY%22%2C%22displayName%22%3A%22GBP%2FJPY%22%7D%5D&width=100%25&height=400&gridLineColor=rgba(42%2C%2046%2C%2057%2C%200.5)&fontColor=rgba(209%2C%20212%2C%20220%2C%201)&underLineColor=rgba(41%2C%2098%2C%20255%2C%200.3)&trendLineColor=rgba(41%2C%2098%2C%20255%2C%201)`;

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 p-5 rounded-xl shadow-xl backdrop-blur-sm">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5 mb-4">
        <div>
          <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">Spot Rates Feed</h3>
          <p className="text-[10px] text-slate-500 font-sans mt-0.5">Real-time institutional liquidity</p>
        </div>
        
        {/* View Mode Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850/80 self-start sm:self-center">
          <button
            onClick={() => setFeedMode('terminal')}
            className={`px-2 py-1 rounded text-[9px] font-mono font-bold tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              feedMode === 'terminal'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-2.5 h-2.5" />
            SMC FEED
          </button>
          <button
            onClick={() => setFeedMode('tradingview')}
            className={`px-2 py-1 rounded text-[9px] font-mono font-bold tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              feedMode === 'tradingview'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-2.5 h-2.5" />
            TV LIVE
          </button>
        </div>
      </div>

      {feedMode === 'tradingview' ? (
        <div className="rounded-xl overflow-hidden border border-slate-850 bg-slate-950/20" style={{ height: '400px' }}>
          <iframe
            src={tvQuotesWidgetUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 'none' }}
            title="TradingView Live Market Quotes Feed"
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Live stream indicator info banner */}
          <div className="bg-slate-950/50 border border-slate-850 px-3 py-2 rounded-lg flex items-center justify-between text-[9px]">
            <span className="text-slate-500 font-sans flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              BTCUSD: <span className="text-emerald-400 font-bold font-mono">BINANCE WEBSOCKET (0ms)</span>
            </span>
            <span className="text-slate-600 font-mono text-[8px]">{lastUpdateTime || 'LIVE'}</span>
          </div>

          {symbols.map(sym => {
            const data = prices[sym];
            const isSelected = selectedPair === sym;
            
            if (!data) {
              return (
                <div 
                  key={sym} 
                  className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex items-center justify-between font-mono animate-pulse"
                >
                  <div>
                    <span className="text-xs text-slate-400 font-bold">{sym}</span>
                    <span className="block text-[8px] text-slate-600">Connecting node...</span>
                  </div>
                  <span className="text-[9px] text-amber-500/50">STREAMING...</span>
                </div>
              );
            }

            const isUp = data.change >= 0;
            const dec = getDecimalCount(sym);
            const friendlyName = getFriendlyName(sym);

            return (
              <button
                key={sym}
                onClick={() => setSelectedPair(sym)}
                className={`w-full p-3.5 rounded-xl border text-left font-sans transition-all duration-300 flex items-center justify-between group cursor-pointer ${
                  isSelected 
                    ? 'bg-slate-850/90 border-amber-500/40 shadow-[0_4px_12px_rgba(245,158,11,0.06)]' 
                    : 'bg-slate-950/45 border-slate-850 hover:bg-slate-900/40 hover:border-slate-800'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold font-mono transition-colors ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                      {sym}
                    </span>
                    {sym === 'BTCUSD' && (
                      <span className="text-[7.5px] font-mono font-bold tracking-wider px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                        DIRECT WS
                      </span>
                    )}
                    {data.isMarketClosed && sym !== 'BTCUSD' && (
                      <span className="text-[8px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800/80 text-amber-500/90">
                        CLOSED
                      </span>
                    )}
                    <span className="text-[9px] text-slate-500 font-normal">
                      {friendlyName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500">
                    <span>H: <span className="text-slate-300">{data.high.toFixed(dec)}</span></span>
                    <span>L: <span className="text-slate-300">{data.low.toFixed(dec)}</span></span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1 font-mono">
                  <span className={`text-xs font-bold tracking-tight transition-colors ${
                    data.isMarketClosed && sym !== 'BTCUSD'
                      ? 'text-slate-400'
                      : data.tickDir === 'up' 
                        ? 'text-emerald-400' 
                        : data.tickDir === 'down' 
                          ? 'text-rose-400' 
                          : 'text-white'
                  }`}>
                    {data.price.toFixed(dec)}
                  </span>
                  {data.isMarketClosed && sym !== 'BTCUSD' ? (
                    <span className="text-[8px] font-mono font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-950/50 border border-slate-900">
                      WEEKEND FLAT
                    </span>
                  ) : (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                      isUp 
                        ? 'text-emerald-400 bg-emerald-500/10' 
                        : 'text-rose-400 bg-rose-500/10'
                    }`}>
                      {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                      {isUp ? '+' : ''}{data.changePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
