import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Play, 
  Volume2, 
  VolumeX, 
  PlusCircle, 
  Calendar, 
  AlertTriangle, 
  Percent, 
  Activity, 
  Search, 
  RefreshCw, 
  Globe, 
  Sliders, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRight, 
  Flame, 
  Scale,
  X,
  Sparkles
} from 'lucide-react';
import { PriceData, NewsEvent } from './types';
import { 
  EventAnalysisData, 
  formatEventTimes, 
  getSimulatedScenario, 
  initialMockPrices, 
  generateLocalEventAnalysis 
} from './utils';

export default function App() {
  // --- GENERAL STATE ---
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [utcTime, setUtcTime] = useState<Date>(new Date());
  const [wsStatus, setWsStatus] = useState<'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED'>('DISCONNECTED');
  const [selectedPrimaryModel, setSelectedPrimaryModel] = useState<string>('gemini-3.5-flash');
  const [selectedSecondaryModel, setSelectedSecondaryModel] = useState<string>('llama-3.3-70b-versatile');
  const [showBrainsSettings, setShowBrainsSettings] = useState<boolean>(false);

  // --- NEWS EVENTS FEED STATE ---
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [impactFilter, setImpactFilter] = useState<'ALL' | 'High' | 'Medium' | 'Low'>('ALL');

  // --- ACTIVE ANALYSIS STATE ---
  const [selectedEvent, setSelectedEvent] = useState<NewsEvent | null>(null);
  const [analysisData, setAnalysisData] = useState<EventAnalysisData | null>(null);
  const [simulatedDeviation, setSimulatedDeviation] = useState<'ABOVE' | 'BELOW' | 'INLINE'>('ABOVE');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDebateTranscript, setShowDebateTranscript] = useState<boolean>(false);

  // --- CUSTOM INJECTION STATE ---
  const [customTitle, setCustomTitle] = useState('');
  const [customCountry, setCustomCountry] = useState('USD');
  const [customImpact, setCustomImpact] = useState<'High' | 'Medium' | 'Low'>('High');
  const [customForecast, setCustomForecast] = useState('');
  const [customPrevious, setCustomPrevious] = useState('');
  const [customDate, setCustomDate] = useState('2026-07-06');
  const [customTime, setCustomTime] = useState('12:30pm');
  const [showCustomForm, setShowCustomForm] = useState(false);

  // --- AUDIO VOCALIZER STATE ---
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const [activeSpeechTurn, setActiveSpeechTurn] = useState<number | null>(null);
  const speechUtterancesRef = useRef<SpeechSynthesisUtterance[]>([]);

  // --- REFERENCES ---
  const analysisPanelRef = useRef<HTMLDivElement>(null);

  // --- FETCH INITIAL ECONOMIC EVENTS & LIVE PRICES ---
  useEffect(() => {
    fetchPrices();
    loadEconomicCalendar();

    // Direct Browser-to-Binance Live WebSocket connection for zero-lag spot rates
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        setWsStatus('RECONNECTING');
        ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');
        
        ws.onopen = () => {
          setWsStatus('CONNECTED');
          console.log('Connected to Binance Live WebSocket for zero-lag spot rates');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.c) {
              const wsPrice = parseFloat(data.c);
              const changePercent = parseFloat(data.P) || 0;
              const change = parseFloat(data.p) || 0;
              const high = parseFloat(data.h) || wsPrice;
              const low = parseFloat(data.l) || wsPrice;

              if (!isNaN(wsPrice) && wsPrice > 0) {
                setPrices(prev => ({
                  ...prev,
                  'BTCUSD': {
                    price: wsPrice,
                    change,
                    changePercent,
                    high,
                    low,
                    history: prev['BTCUSD']?.history ? [...prev['BTCUSD'].history.slice(-19), wsPrice] : [wsPrice],
                    isSimulated: false,
                    tickDir: prev['BTCUSD']?.price ? (wsPrice > prev['BTCUSD'].price ? 'up' : wsPrice < prev['BTCUSD'].price ? 'down' : 'stable') : 'stable'
                  }
                }));
                const now = new Date();
                setLastUpdateTime(now.toTimeString().split(' ')[0]);
              }
            }
          } catch (e) {
            // ignore JSON parse errors
          }
        };

        ws.onclose = () => {
          setWsStatus('DISCONNECTED');
          console.warn('Binance WebSocket closed. Reconnecting in 3s...');
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (err) {
        console.error('Failed to create Binance WebSocket:', err);
      }
    };

    connectWebSocket();

    // UTC clock
    const clockInterval = setInterval(() => {
      setUtcTime(new Date());
    }, 1000);

    // Fetch prices periodically (acts as fallback and pulls non-crypto prices)
    const priceInterval = setInterval(() => {
      fetchPrices();
    }, 3000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(priceInterval);
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      stopDebateSpeech();
    };
  }, []);

  const fetchPrices = async () => {
    try {
      const res = await fetch('/api/prices');
      const data = await res.json();
      if (data.success && data.prices) {
        setPrices(prev => {
          const merged = { ...data.prices };
          if (prev['BTCUSD'] && !prev['BTCUSD'].isSimulated) {
            merged['BTCUSD'] = prev['BTCUSD'];
          }
          return merged;
        });
      } else {
        throw new Error('Prices load returned non-success response');
      }
    } catch (e) {
      console.warn('Unable to reach backend /api/prices. Activating browser-side price drift simulation.');
      setIsOfflineMode(true);
      setPrices(prev => {
        const nextPrices = { ...prev };
        const symbols = ['XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY'];
        symbols.forEach(sym => {
          if (!nextPrices[sym]) {
            nextPrices[sym] = { ...initialMockPrices[sym] };
          } else {
            const current = nextPrices[sym];
            if (sym !== 'BTCUSD' || current.isSimulated) {
              const driftPercent = (Math.random() - 0.5) * 0.0006;
              const newPrice = current.price * (1 + driftPercent);
              const change = newPrice - (initialMockPrices[sym].price - initialMockPrices[sym].change);
              const changePercent = (change / (initialMockPrices[sym].price - initialMockPrices[sym].change)) * 100;
              const nextHistory = current.history ? [...current.history.slice(-19), newPrice] : [newPrice];
              
              nextPrices[sym] = {
                ...current,
                price: newPrice,
                change,
                changePercent,
                history: nextHistory,
                isSimulated: true,
                tickDir: newPrice > current.price ? 'up' : newPrice < current.price ? 'down' : 'stable'
              };
            }
          }
        });
        return nextPrices;
      });
    }
  };

  const loadEconomicCalendar = async () => {
    setIsNewsLoading(true);
    const getDynamicLocalDate = (offsetDays: number): string => {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().split('T')[0];
    };
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      const eventsList = data.calendar || data.rawEvents || (data.analysis && data.analysis.events);
      if (data.success && eventsList && eventsList.length > 0) {
        setNewsEvents(eventsList);
        // Default to first event that is today or in the future
        if (!selectedEvent) {
          const todayOrFutureEvent = eventsList.find((evt: any) => evt.date >= todayStr) || eventsList[0];
          triggerEventAnalysis(todayOrFutureEvent);
        }
      } else {
        throw new Error('News fetch failed');
      }
    } catch (e) {
      console.warn('Unable to retrieve calendar from backend. Falling back to local catalog.');
      setIsOfflineMode(true);
      const mockCalendar: NewsEvent[] = [
        { title: "CB Consumer Confidence", country: "USD", impact: "Medium", forecast: "103.0", previous: "101.3", date: getDynamicLocalDate(0), time: "10:00am" },
        { title: "CPI m/m Inflation", country: "USD", impact: "High", forecast: "0.1%", previous: "0.0%", date: getDynamicLocalDate(0), time: "1:00pm" },
        { title: "ADP Non-Farm Employment Change", country: "USD", impact: "High", forecast: "155K", previous: "192K", date: getDynamicLocalDate(1), time: "8:15am" },
        { title: "Unemployment Claims", country: "USD", impact: "Medium", forecast: "212K", previous: "218K", date: getDynamicLocalDate(1), time: "8:30am" },
        { title: "Non-Farm Employment Change (NFP)", country: "USD", impact: "High", forecast: "185K", previous: "272K", date: getDynamicLocalDate(2), time: "12:30pm" },
        { title: "FOMC Federal Funds Rate Decision", country: "USD", impact: "High", forecast: "5.50%", previous: "5.50%", date: getDynamicLocalDate(2), time: "6:00pm" },
      ];
      setNewsEvents(mockCalendar);
      if (!selectedEvent) {
        const todayOrFutureEvent = mockCalendar.find((evt: any) => evt.date >= todayStr) || mockCalendar[0];
        triggerEventAnalysis(todayOrFutureEvent);
      }
    } finally {
      setIsNewsLoading(false);
    }
  };

  const triggerEventAnalysis = async (event: NewsEvent) => {
    setSelectedEvent(event);
    setIsAnalyzing(true);
    stopDebateSpeech();
    
    // Smooth scroll on mobile to active panel
    setTimeout(() => {
      analysisPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const res = await fetch('/api/analyze-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          primaryModel: selectedPrimaryModel,
          secondaryModel: selectedSecondaryModel
        })
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysisData(data.analysis);
      } else {
        throw new Error('Server analysis returned unsuccessful');
      }
    } catch (e) {
      console.warn('Backend LLM analysis unavailable. Activating high-fidelity browser client simulation.');
      setIsOfflineMode(true);
      // Generate highly targeted local scenario fallback
      const localResult = generateLocalEventAnalysis(event);
      setAnalysisData(localResult);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stopDebateSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    speechUtterancesRef.current = [];
    setIsPlayingSpeech(false);
    setActiveSpeechTurn(null);
  };

  const startDebateSpeech = () => {
    if (!analysisData || !analysisData.debateTranscript) return;
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech not supported in this browser version.');
      return;
    }

    stopDebateSpeech();
    setIsPlayingSpeech(true);

    const transcript = analysisData.debateTranscript;
    const utterances: SpeechSynthesisUtterance[] = [];

    transcript.forEach((turn, idx) => {
      const textToSpeak = `${turn.speaker === 'Macro Hawk' ? 'Doctor Vance' : 'Silas'} says: ${turn.text}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      // Attempt to assign distinct voices
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        if (turn.speaker === 'Macro Hawk') {
          // Deep/Google male voice
          const maleVoice = voices.find(v => v.name.toLowerCase().includes('google uk english male') || v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david'));
          if (maleVoice) utterance.voice = maleVoice;
          utterance.pitch = 0.85;
          utterance.rate = 0.95;
        } else {
          // Sharp/Google female voice
          const femaleVoice = voices.find(v => v.name.toLowerCase().includes('google us english female') || v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira'));
          if (femaleVoice) utterance.voice = femaleVoice;
          utterance.pitch = 1.05;
          utterance.rate = 1.0;
        }
      }

      utterance.onstart = () => {
        setActiveSpeechTurn(idx);
      };

      utterance.onend = () => {
        if (idx === transcript.length - 1) {
          setIsPlayingSpeech(false);
          setActiveSpeechTurn(null);
        }
      };

      utterance.onerror = () => {
        setIsPlayingSpeech(false);
        setActiveSpeechTurn(null);
      };

      utterances.push(utterance);
      speechUtterancesRef.current.push(utterance);
    });

    // Queue utterances sequentially
    utterances.forEach(u => window.speechSynthesis.speak(u));
  };

  const handleDeployCustomNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newEvent: NewsEvent = {
      title: customTitle.trim(),
      country: customCountry.toUpperCase(),
      impact: customImpact,
      forecast: customForecast.trim() || 'TBD',
      previous: customPrevious.trim() || 'TBD',
      date: customDate,
      time: customTime
    };

    setNewsEvents(prev => [newEvent, ...prev]);
    setShowCustomForm(false);
    triggerEventAnalysis(newEvent);

    // Reset fields safely
    setCustomTitle('');
    setCustomForecast('');
    setCustomPrevious('');
  };

  const filteredEvents = newsEvents.filter(evt => {
    const matchesSearch = evt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          evt.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesImpact = impactFilter === 'ALL' || evt.impact === impactFilter;
    return matchesSearch && matchesImpact;
  });

  return (
    <div className="min-h-screen bg-[#070708] text-zinc-300 flex flex-col font-sans antialiased selection:bg-amber-500/10 selection:text-amber-400">
      
      {/* 1. TOP TICKER STRIP */}
      <div className="bg-[#09090b] border-b border-zinc-900/80 px-6 py-2.5 flex items-center justify-between gap-4 overflow-hidden shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono font-medium text-zinc-500 tracking-wider">LIVE LIQUIDITY FEED</span>
        </div>
        
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none py-0.5 text-[11px] font-mono flex-1 px-4">
          {Object.keys(prices).length === 0 ? (
            <span className="text-zinc-600 text-[10px] animate-pulse">Syncing institutional asset prices...</span>
          ) : (
            Object.entries(prices).map(([symbol, rawData]) => {
              const data = rawData as PriceData;
              const isUp = (data?.change ?? 0) >= 0;
              const dec = symbol === 'BTCUSD' ? 0 : symbol === 'XAUUSD' ? 2 : 4;
              return (
                <div key={symbol} className="flex items-center gap-2.5 bg-zinc-900/30 border border-zinc-800/40 px-2.5 py-1 rounded-md transition-all hover:bg-zinc-900/60">
                  <span className="text-zinc-400 font-semibold">{symbol}</span>
                  <span className={`font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(data?.price ?? 0).toFixed(dec)}
                  </span>
                  <span className={`text-[9.5px] font-semibold flex items-center ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isUp ? <span className="mr-0.5">▲</span> : <span className="mr-0.5">▼</span>}
                    {isUp ? '+' : ''}{(data?.changePercent ?? 0).toFixed(2)}%
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] text-zinc-500 font-mono tracking-wider">WS SPOT:</span>
          <span className={`text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${
            wsStatus === 'CONNECTED' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : wsStatus === 'RECONNECTING'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {wsStatus}
          </span>
        </div>
      </div>

      {/* 2. PRIMARY INST HEADER */}
      <header className="px-6 py-4.5 bg-[#09090b]/90 border-b border-zinc-900/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            <Cpu className="w-4.5 h-4.5 text-zinc-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-[17px] tracking-tight text-white uppercase">JARVIS TRADING INTELLIGENCE</h1>
              <span className="font-mono text-[9px] font-semibold tracking-wider px-1.5 py-0.2 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 uppercase">v4.0 Live</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-sans">Macroeconomic panel debates & high-impact algorithmic risk matrices</p>
          </div>
        </div>

        <div className="flex items-center gap-5 text-xs font-mono">
          <button 
            onClick={() => setShowBrainsSettings(!showBrainsSettings)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10.5px] font-medium transition-all ${
              showBrainsSettings 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>AI Brain Cores</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5"></span>
          </button>

          <div className="hidden md:flex flex-col items-end border-l border-zinc-800 pl-4">
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Live Clock</span>
            <span className="text-zinc-300 font-semibold text-[11px] tracking-tight">
              {utcTime.getUTCHours().toString().padStart(2, '0')}:
              {utcTime.getUTCMinutes().toString().padStart(2, '0')}:
              {utcTime.getUTCSeconds().toString().padStart(2, '0')} <span className="text-amber-500 font-bold">UTC</span>
            </span>
          </div>
        </div>
      </header>

      {/* 2.5 COLLAPSIBLE AI BRAIN CORES CONFIGURATION PANEL */}
      <AnimatePresence>
        {showBrainsSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#0a0a0c] border-b border-zinc-900/80"
          >
            <div className="max-w-7xl mx-auto px-6 py-4.5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono font-semibold uppercase text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]"></span>
                  Dr. Marcus Vance (Macro Specialist Node)
                </label>
                <select
                  value={selectedPrimaryModel}
                  onChange={e => setSelectedPrimaryModel(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 focus:outline-none focus:border-amber-500/50 font-mono"
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Preferred)</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                  <option value="gemini-flash-latest">Gemini Flash Latest</option>
                </select>
                <p className="text-[9px] text-zinc-500">Allocates advanced reasoning weights for macroeconomic variables and systemic bias analysis.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono font-semibold uppercase text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span>
                  Silas Thorne (SMC Quant Node)
                </label>
                <select
                  value={selectedSecondaryModel}
                  onChange={e => setSelectedSecondaryModel(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 focus:outline-none focus:border-amber-500/50 font-mono"
                >
                  <option value="llama-3.3-70b-versatile">Llama-3.3 70B (Groq Edge Core)</option>
                  <option value="llama-3.1-8b-instant">Llama-3.1 8B (Instant Execution)</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B (MoE Core)</option>
                  <option value="gemma2-9b-it">Gemma-2 9B (Ultra-low Latency)</option>
                </select>
                <p className="text-[9px] text-zinc-500">Determines algorithmic trading setup strategies, support/resistance targets, and liquidity points.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2.6 OFFLINE BANNER */}
      {isOfflineMode && (
        <div className="bg-amber-500/5 border-b border-amber-500/20 px-6 py-2 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-[10.5px] text-amber-200/90 font-mono leading-none">
              [LOCAL SIMULATION ENGAGED]: Running offline-compatible drift prices and economic calendars safely on your client.
            </span>
          </div>
          <button 
            onClick={() => setIsOfflineMode(false)}
            className="text-[9px] font-mono text-amber-400 border border-amber-500/20 rounded px-2 py-0.5 hover:bg-amber-500/10"
          >
            ACKNOWLEDGE
          </button>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start overflow-y-auto">
        
        {/* LEFT PANEL: EVENTS FEED (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Feed Header Stats */}
          <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-3">
              <Calendar className="w-4.5 h-4.5 text-amber-500" />
              <div>
                <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider block leading-none">News Release Triggers</span>
                <span className="text-sm font-display font-bold text-zinc-100">{newsEvents.length} High-Impact Catalysts Active</span>
              </div>
            </div>
            
            <button
              onClick={loadEconomicCalendar}
              disabled={isNewsLoading}
              className="p-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Refresh News Calendar Feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isNewsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Collapsible Custom Event Injector Trigger */}
          <div className="border border-dashed border-zinc-800 p-2.5 rounded-xl transition-all hover:border-zinc-700">
            {!showCustomForm ? (
              <button
                onClick={() => setShowCustomForm(true)}
                className="w-full py-1.5 flex items-center justify-center gap-2 text-[10.5px] font-mono text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-zinc-500" />
                <span>INJECT CUSTOM ECONOMIC RELEASE</span>
              </button>
            ) : (
              <div className="space-y-4 p-1.5">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <span className="text-[10px] font-mono font-semibold uppercase text-zinc-300">CUSTOM MACRO INJECTOR</span>
                  <button 
                    onClick={() => setShowCustomForm(false)}
                    className="p-0.5 text-zinc-500 hover:text-zinc-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <form onSubmit={handleDeployCustomNews} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 block uppercase">Event Title / Indicator</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Core PCE Price Index m/m"
                      value={customTitle}
                      onChange={e => setCustomTitle(e.target.value)}
                      required
                      className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-500 block uppercase">Country / Asset</label>
                      <input 
                        type="text" 
                        placeholder="e.g. USD, EUR, GBP"
                        value={customCountry}
                        onChange={e => setCustomCountry(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-500 block uppercase">Market Impact</label>
                      <select
                        value={customImpact}
                        onChange={e => setCustomImpact(e.target.value as 'High' | 'Medium' | 'Low')}
                        className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                      >
                        <option value="High">High (Red Alert)</option>
                        <option value="Medium">Medium (Orange Alert)</option>
                        <option value="Low">Low (Grey Range)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-500 block uppercase">Consensus Forecast</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 0.3%"
                        value={customForecast}
                        onChange={e => setCustomForecast(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-500 block uppercase">Previous Value</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 0.2%"
                        value={customPrevious}
                        onChange={e => setCustomPrevious(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-500 block uppercase">Date</label>
                      <input 
                        type="text" 
                        placeholder="YYYY-MM-DD"
                        value={customDate}
                        onChange={e => setCustomDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-500 block uppercase">Time (EDT)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 12:30pm"
                        value={customTime}
                        onChange={e => setCustomTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-mono font-bold rounded transition-all tracking-wider"
                  >
                    DEPLOY & DEBATE SYNTHESIS
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Calendar List & Search */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
            
            {/* Search Input */}
            <div className="p-3 border-b border-zinc-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-500 ml-1" />
              <input 
                type="text" 
                placeholder="Search event title or country..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-0.5 text-zinc-600 hover:text-zinc-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Impact Filter Buttons */}
            <div className="flex border-b border-zinc-900 text-[10px] font-mono text-zinc-500 bg-[#0c0c0e]">
              {(['ALL', 'High', 'Medium', 'Low'] as const).map(impact => (
                <button
                  key={impact}
                  onClick={() => setImpactFilter(impact)}
                  className={`flex-1 py-2 border-r last:border-r-0 border-zinc-900 transition-all ${
                    impactFilter === impact 
                      ? 'text-amber-500 bg-zinc-900 font-semibold' 
                      : 'hover:text-zinc-300 hover:bg-zinc-900/30'
                  }`}
                >
                  {impact === 'High' ? '🔴 HIGH' : impact === 'Medium' ? '🟡 MEDIUM' : impact === 'Low' ? '⚪ LOW' : '🌐 ALL'}
                </button>
              ))}
            </div>

            {/* Events Scroll Feed */}
            <div className="max-h-[580px] overflow-y-auto divide-y divide-zinc-900/60 scrollbar-thin scrollbar-thumb-zinc-900">
              {filteredEvents.length === 0 ? (
                <div className="p-8 text-center text-zinc-600 text-xs font-mono">
                  No release triggers match the filter constraints.
                </div>
              ) : (
                filteredEvents.map((evt, index) => {
                  const isSelected = selectedEvent?.title === evt.title;
                  const times = formatEventTimes(evt.date, evt.time);
                  
                  return (
                    <div 
                      key={`${evt.title}-${index}`}
                      onClick={() => triggerEventAnalysis(evt)}
                      className={`p-3.5 transition-all cursor-pointer relative ${
                        isSelected 
                          ? 'bg-zinc-900/80 border-l-2 border-amber-500' 
                          : 'hover:bg-zinc-900/30 border-l-2 border-transparent'
                      }`}
                    >
                      {/* Top Meta Line */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                            {evt.country}
                          </span>
                          <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                            evt.impact === 'High' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : evt.impact === 'Medium'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {evt.impact}
                          </span>
                        </div>

                        <div className="flex flex-col items-end text-right shrink-0">
                          <span className="text-[9.5px] font-mono font-bold text-zinc-400">
                            {evt.date}
                          </span>
                          <span className="text-[9px] font-mono text-amber-500 font-semibold">
                            {times.bdt ? times.bdt.split('at')[1]?.trim() : evt.time} BDT
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-[12.5px] font-semibold text-zinc-100 tracking-tight leading-snug">
                        {evt.title}
                      </h4>

                      {/* Value Summary Strip */}
                      <div className="flex gap-4 mt-2 text-[10px] font-mono text-zinc-500">
                        <div>
                          <span>Consensus: </span>
                          <span className="text-zinc-300 font-bold">{evt.forecast || 'N/A'}</span>
                        </div>
                        <div>
                          <span>Previous: </span>
                          <span className="text-zinc-300">{evt.previous || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

        {/* RIGHT PANEL: CORE DEBATE & PROBABILITY DESK (col-span-7) */}
        <div ref={analysisPanelRef} className="lg:col-span-7 space-y-6">
          
          <AnimatePresence mode="wait">
            {!selectedEvent ? (
              <div className="bg-zinc-950 border border-zinc-900/60 rounded-2xl p-12 text-center text-zinc-500 font-mono text-xs flex flex-col items-center justify-center space-y-3 shadow-xl min-h-[450px]">
                <Activity className="w-8 h-8 text-zinc-600 animate-pulse" />
                <p>Select an economic release from the calendar grid to initialize cognitive debate parsing.</p>
              </div>
            ) : isAnalyzing ? (
              <div className="bg-zinc-950 border border-zinc-900/60 rounded-2xl p-12 text-center text-zinc-400 font-mono text-xs flex flex-col items-center justify-center space-y-4 shadow-xl min-h-[450px]">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
                  <Sparkles className="w-4 h-4 text-amber-400 absolute top-4 left-4 animate-ping" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold tracking-wider text-zinc-100 uppercase">Orchestrating AI Panel Debate...</p>
                  <p className="text-[10px] text-zinc-600">Retrieving intelligence models: {selectedPrimaryModel} & {selectedSecondaryModel}</p>
                </div>
              </div>
            ) : analysisData ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* 1. COGNITIVE RECONSTRUCT CARD (HEADER OVERVIEW) */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-900/80 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10.5px] font-bold text-amber-500 uppercase tracking-widest">
                          RELEASE CATALYST OVERVIEW
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      </div>
                      <h2 className="text-2xl font-bold text-white font-display tracking-tight leading-tight">
                        {selectedEvent.title}
                      </h2>
                    </div>

                    {/* Speech Vocalizer Module */}
                    <div className="shrink-0">
                      {isPlayingSpeech ? (
                        <button
                          onClick={stopDebateSpeech}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-mono font-bold transition-all hover:bg-rose-500/25 cursor-pointer"
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>STOP SPEECH</span>
                        </button>
                      ) : (
                        <button
                          onClick={startDebateSpeech}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold transition-all hover:bg-amber-500/25 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>VOCALIZE DEBATE</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metas Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-900">
                      <span className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">Consensus Forecast</span>
                      <span className="text-sm font-bold text-zinc-100 font-mono mt-0.5 block">{selectedEvent.forecast}</span>
                    </div>

                    <div className="bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-900">
                      <span className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">Previous Value</span>
                      <span className="text-sm font-semibold text-zinc-100 font-mono mt-0.5 block">{selectedEvent.previous}</span>
                    </div>

                    <div className="bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-900">
                      <span className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">Consensus Bias</span>
                      <span className={`text-sm font-bold font-mono mt-0.5 block ${
                        analysisData.consensusBias === 'BULLISH' 
                          ? 'text-emerald-400' 
                          : analysisData.consensusBias === 'BEARISH' 
                            ? 'text-rose-400' 
                            : 'text-amber-400'
                      }`}>
                        {analysisData.consensusBias}
                      </span>
                    </div>

                    <div className="bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-900">
                      <span className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">Bangladesh Time (BDT)</span>
                      <span className="text-sm font-bold text-amber-500 font-mono mt-0.5 block">
                        {formatEventTimes(selectedEvent.date, selectedEvent.time).bdt.split('at')[1]?.trim() || selectedEvent.time}
                      </span>
                    </div>
                  </div>

                  {/* TIMING AND TIMEZONE MATRICES */}
                  <div className="bg-zinc-900/15 border border-zinc-900/60 p-3 rounded-xl space-y-2">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">COMPLETE SCHEDULE OVERVIEW (WHEN IT HAPPENS)</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="bg-[#0b0b0d] border border-zinc-900 px-3 py-2 rounded-lg">
                        <span className="text-[8px] text-zinc-500 uppercase block">BANGLADESH (BDT)</span>
                        <span className="text-zinc-200 font-bold block mt-0.5">
                          {formatEventTimes(selectedEvent.date, selectedEvent.time).bdt}
                        </span>
                      </div>
                      <div className="bg-[#0b0b0d] border border-zinc-900 px-3 py-2 rounded-lg">
                        <span className="text-[8px] text-zinc-500 uppercase block">NEW YORK (EDT)</span>
                        <span className="text-zinc-300 font-medium block mt-0.5">
                          {formatEventTimes(selectedEvent.date, selectedEvent.time).ny}
                        </span>
                      </div>
                      <div className="bg-[#0b0b0d] border border-zinc-900 px-3 py-2 rounded-lg">
                        <span className="text-[8px] text-zinc-500 uppercase block">UTC / GMT</span>
                        <span className="text-zinc-300 font-medium block mt-0.5">
                          {formatEventTimes(selectedEvent.date, selectedEvent.time).utc}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 2. DIRECT ACTIONABLE TRADING DIRECTIVE (BUY/SELL/HOLD CORES) */}
                {(() => {
                  const scenario = getSimulatedScenario(selectedEvent.title, selectedEvent.country, simulatedDeviation);
                  const times = formatEventTimes(selectedEvent.date, selectedEvent.time);
                  
                  // Helper to get actionable verdict
                  const gBias = scenario.goldBias.toUpperCase();
                  const dBias = scenario.dxyBias.toUpperCase();
                  
                  let verdict = "HOLD / NEUTRAL";
                  let colorClass = "text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]";
                  let bgPill = "bg-amber-500 text-zinc-950";
                  
                  if (gBias.includes("BULLISH") || gBias.includes("SUPPORT") || gBias.includes("BREAKOUT") || gBias.includes("EXPANSION")) {
                    verdict = "BUY / LONG";
                    colorClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.18)]";
                    bgPill = "bg-emerald-500 text-zinc-950";
                  } else if (gBias.includes("BEARISH") || gBias.includes("PRESSURE") || gBias.includes("LIQUIDATION") || gBias.includes("DISTRIBUTION") || gBias.includes("SWEEP")) {
                    verdict = "SELL / SHORT";
                    colorClass = "text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.18)]";
                    bgPill = "bg-rose-500 text-white";
                  } else if (dBias.includes("BULLISH") || dBias.includes("STRENGTH")) {
                    verdict = "SELL / SHORT";
                    colorClass = "text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.18)]";
                    bgPill = "bg-rose-500 text-white";
                  } else if (dBias.includes("BEARISH") || dBias.includes("WEAKNESS") || dBias.includes("CRASH")) {
                    verdict = "BUY / LONG";
                    colorClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.18)]";
                    bgPill = "bg-emerald-500 text-zinc-950";
                  }

                  // Affected assets mapping
                  const country = selectedEvent.country.toUpperCase();
                  const affectedAssets = country === 'USD' 
                    ? 'Gold (XAUUSD), BTCUSD, EURUSD, GBPUSD' 
                    : country === 'EUR' 
                      ? 'EURUSD, EURGBP, EURJPY, XAUUSD' 
                      : country === 'GBP' 
                        ? 'GBPUSD, GBPJPY, EURGBP' 
                        : country === 'JPY' 
                          ? 'USDJPY, GBPJPY, XAUUSD' 
                          : `${country} Forex Crosses & Spot rates`;

                  const timeframeSuggestion = selectedEvent.impact === 'High' 
                    ? 'SHORT-TERM (SCALP) + LONG-TERM (SWING OVERLAY)' 
                    : 'SHORT-TERM (INTRADAY SCALP ONLY)';

                  return (
                    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 shadow-xl space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
                        <div>
                          <span className="text-amber-500 font-mono font-bold uppercase text-[9px] block tracking-widest">
                            SMC ACTION DIRECTIVE & PLAYBOOK
                          </span>
                          <h3 className="text-base font-bold text-white tracking-tight font-display mt-0.5">
                            Real-time Execution Guidelines based on actual data print deviation
                          </h3>
                        </div>

                        {/* Switch Pills */}
                        <div className="flex p-0.5 bg-zinc-900 rounded-lg border border-zinc-800 text-[9.5px] font-mono shrink-0">
                          {(['ABOVE', 'BELOW', 'INLINE'] as const).map(tab => (
                            <button
                              key={tab}
                              onClick={() => setSimulatedDeviation(tab)}
                              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                                simulatedDeviation === tab 
                                  ? tab === 'ABOVE' 
                                    ? 'bg-emerald-500/10 text-emerald-400 font-bold' 
                                    : tab === 'BELOW' 
                                      ? 'bg-rose-500/10 text-rose-400 font-bold'
                                      : 'bg-zinc-800 text-zinc-300'
                                  : 'text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              {tab === 'ABOVE' ? 'PRINT ABOVE ▲' : tab === 'BELOW' ? 'PRINT BELOW ▼' : 'INLINE ⬌'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ACTIONABLE SPECIFICATION PANEL (THE VERDICT CORE) */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        
                        {/* Massive Recommendation Card */}
                        <div className={`md:col-span-5 p-5 rounded-xl border flex flex-col justify-between space-y-4 ${colorClass}`}>
                          <div>
                            <span className="text-[9px] font-mono uppercase tracking-wider block text-zinc-400">INSTANT TRADING CALL</span>
                            <div className="text-3xl font-black tracking-tight font-display mt-1 uppercase flex items-center gap-2">
                              {verdict}
                            </div>
                            <p className="text-xs text-zinc-300/90 leading-relaxed font-sans mt-3">
                              If the print comes out <strong className="text-zinc-100">{simulatedDeviation === 'ABOVE' ? 'ABOVE FORECAST' : simulatedDeviation === 'BELOW' ? 'BELOW FORECAST' : 'INLINE'}</strong>, execute this signal immediately.
                            </p>
                          </div>

                          <div className="space-y-3 pt-3 border-t border-zinc-800/60 text-xs">
                            <div>
                              <span className="text-[9px] font-mono uppercase text-zinc-400 block">SUGGESTED TIME HORIZON:</span>
                              <span className="font-bold font-mono text-zinc-100">{timeframeSuggestion}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-mono uppercase text-zinc-400 block">AFFECTED MARKETS:</span>
                              <span className="font-bold text-amber-500 font-sans block mt-0.5">{affectedAssets}</span>
                            </div>
                          </div>
                        </div>

                        {/* Tactical Playbook Targets */}
                        <div className="md:col-span-7 space-y-4">
                          <div className="bg-[#0b0b0d] border border-zinc-900/80 p-4 rounded-xl space-y-3">
                            <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block">
                              ALGORITHMIC PRICING & SL/TP BRACKETS
                            </span>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                              <div className="p-2.5 bg-zinc-900/40 rounded-lg border border-zinc-900/60 text-center">
                                <span className="text-[8px] text-zinc-500 uppercase block">EXECUTION STRATEGY</span>
                                <span className="text-zinc-100 font-bold block mt-1">{scenario.playbook.entry}</span>
                              </div>
                              <div className="p-2.5 bg-rose-500/5 rounded-lg border border-rose-500/10 text-center">
                                <span className="text-[8px] text-rose-400/80 uppercase block">INVALIDATION (SL)</span>
                                <span className="text-rose-400 font-bold block mt-1">{scenario.playbook.sl}</span>
                              </div>
                              <div className="p-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10 text-center">
                                <span className="text-[8px] text-emerald-400/80 uppercase block">OBJECTIVE TARGET (TP)</span>
                                <span className="text-emerald-400 font-bold block mt-1">{scenario.playbook.tp}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-1">
                              <div className="p-2 bg-[#08080a] rounded-lg border border-zinc-900 text-left pl-3">
                                <span className="text-[8.5px] text-zinc-500 uppercase">UPPER LIQUIDITY LEVEL:</span>
                                <span className="text-zinc-300 font-bold block">{analysisData.targets.upperTarget}</span>
                              </div>
                              <div className="p-2 bg-[#08080a] rounded-lg border border-zinc-900 text-left pl-3">
                                <span className="text-[8.5px] text-zinc-500 uppercase">LOWER STRUCTURAL FLOOR:</span>
                                <span className="text-zinc-300 font-bold block">{analysisData.targets.lowerTarget}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#0b0b0d] border border-zinc-900/80 p-3.5 rounded-xl space-y-1.5">
                            <span className="text-[9.5px] font-mono text-zinc-400 block uppercase">ALGORITHMIC ORDER FLOW STEPS:</span>
                            <ul className="space-y-1 text-xs">
                              {scenario.steps.map((step, i) => (
                                <li key={i} className="flex items-start gap-2 text-zinc-300 py-0.5">
                                  <span className="w-4 h-4 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-mono text-[9px] shrink-0 font-bold mt-0.5">{i+1}</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {scenario.playbook.caution && (
                            <div className="bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-lg text-[10px] text-rose-300/90 leading-relaxed font-sans">
                              <strong>CRITICAL TRADER RISK WARNING:</strong> {scenario.playbook.caution}
                            </div>
                          )}
                        </div>

                      </div>

                    </div>
                  );
                })()}

                {/* 3. COLLAPSIBLE DUAL-BRAIN COGNITIVE DEBATE FEED */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
                  <button
                    onClick={() => setShowDebateTranscript(!showDebateTranscript)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-zinc-900/20 transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
                      <div>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">EXPERT BRAINS DESK LOG</span>
                        <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-tight">
                          {showDebateTranscript ? '▼ Collapse' : '▶ Expand'} AI Synthesis Transcript: Dr. Vance vs Silas Thorne ({analysisData.debateTranscript.length} turns)
                        </h4>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                      {showDebateTranscript ? 'HIDE DEBATE' : 'VIEW DEBATE'}
                    </span>
                  </button>

                  <AnimatePresence>
                    {showDebateTranscript && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-zinc-900 p-5 space-y-3.5 bg-zinc-950/50"
                      >
                        <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                          {analysisData.debateTranscript.map((turn, i) => {
                            const isActive = activeSpeechTurn === i;
                            const isVance = turn.speaker === 'Macro Hawk';
                            
                            return (
                              <div 
                                key={i}
                                className={`p-3 rounded-xl border transition-all ${
                                  isActive 
                                    ? 'bg-amber-500/5 border-amber-500/30 ring-1 ring-amber-500/20' 
                                    : 'bg-zinc-900/10 border-zinc-900/60'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-black ${
                                      isVance 
                                        ? 'bg-indigo-500/10 text-indigo-400' 
                                        : 'bg-emerald-500/10 text-emerald-400'
                                    }`}>
                                      {isVance ? 'MV' : 'ST'}
                                    </span>
                                    <span className="text-[11px] font-mono font-bold text-zinc-200">
                                      {isVance ? 'Dr. Marcus Vance (Macro Hawk)' : 'Silas Thorne (SMC Quant)'}
                                    </span>
                                  </div>
                                  
                                  {isActive && (
                                    <span className="text-[9px] font-mono text-amber-500 font-semibold tracking-wider animate-pulse uppercase">
                                      [SPEAKING AUDIO ACTIVE]
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-zinc-300 leading-relaxed font-sans pl-7">
                                  {turn.text}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 4. MACRO IMPACT NARRATIVE SUMMARY */}
                <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl shadow-xl space-y-2">
                  <span className="text-zinc-500 font-mono font-bold uppercase text-[9px] block tracking-widest">
                    SYSTEM ANALYTICAL SUMMARY
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans italic pl-1">
                    "{analysisData.macroImpactAnalysis}"
                  </p>
                </div>

              </motion.div>
            ) : null}
          </AnimatePresence>

        </div>

      </main>

      {/* 4. COMPACT INST FOOTER */}
      <footer className="border-t border-zinc-900 bg-[#09090b] px-6 py-4.5 text-center text-[10px] text-zinc-500 font-mono shrink-0">
        <p>© 2026 JARVIS COGNITIVE CODESYSTEMS. ADVANCED TRADING NEWS INTEL DESK.</p>
        <p className="mt-1 text-[9px] uppercase tracking-wide text-zinc-600">
          Macroeconomic releases are parsed and synchronized dynamically. All financial quote simulations frozen on weekends.
        </p>
      </footer>

    </div>
  );
}
