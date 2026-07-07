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
  Sparkles,
  Copy,
  Check
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

  // --- CUSTOM INJECTION STATE ---
  const [customTitle, setCustomTitle] = useState('');
  const [customCountry, setCustomCountry] = useState('USD');
  const [customImpact, setCustomImpact] = useState<'High' | 'Medium' | 'Low'>('High');
  const [customForecast, setCustomForecast] = useState('');
  const [customPrevious, setCustomPrevious] = useState('');
  const [customDate, setCustomDate] = useState('2026-07-07');
  const [customTime, setCustomTime] = useState('12:30pm');
  const [showCustomForm, setShowCustomForm] = useState(false);

  // --- AUDIO VOCALIZER STATE ---
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const [activeSpeechTurn, setActiveSpeechTurn] = useState<number | null>(null);
  const speechUtterancesRef = useRef<SpeechSynthesisUtterance[]>([]);

  // --- NEW EXQUISITE UX STATES ---
  const [activeTab, setActiveTab] = useState<'playbook' | 'debate' | 'analytics'>('playbook');
  const [copiedType, setCopiedType] = useState<'entry' | 'sl' | 'tp' | null>(null);

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
          const todayOrFutureEvent = eventsList.find((evt: any) => getNormalizedDateString(evt.date) >= todayStr) || eventsList[0];
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
        const todayOrFutureEvent = mockCalendar.find((evt: any) => getNormalizedDateString(evt.date) >= todayStr) || mockCalendar[0];
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

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        if (turn.speaker === 'Macro Hawk') {
          const maleVoice = voices.find(v => v.name.toLowerCase().includes('google uk english male') || v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david'));
          if (maleVoice) utterance.voice = maleVoice;
          utterance.pitch = 0.85;
          utterance.rate = 0.95;
        } else {
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

    // Reset fields
    setCustomTitle('');
    setCustomForecast('');
    setCustomPrevious('');
  };

  const handleCopyToClipboard = (text: string, type: 'entry' | 'sl' | 'tp') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const getNormalizedDateString = (dateStr: string): string => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return dateStr;
  };

  const getCountdownText = (dateStr: string, timeStr: string): { text: string; status: 'upcoming' | 'released' | 'recent' } => {
    try {
      const cleanTime = (timeStr || "12:00pm").trim().toLowerCase();
      if (cleanTime === "tentative" || cleanTime === "all day" || cleanTime.includes("day") || cleanTime.includes("tent")) {
        return { text: "Tentative Schedule", status: 'upcoming' };
      }
      
      const parts = dateStr.split('-');
      let year = 2026;
      let month = 6; // July (0-indexed: 6)
      let day = 7;
      if (parts.length === 3) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      }
      
      const match = cleanTime.match(/(\d+)[:.]?(\d*)\s*(am|pm)/i);
      let hours = 12;
      let minutes = 0;
      if (match) {
        hours = parseInt(match[1], 10);
        if (match[2]) minutes = parseInt(match[2], 10);
        const ampm = match[3].toLowerCase();
        if (ampm === "pm" && hours < 12) hours += 12;
        if (ampm === "am" && hours === 12) hours = 0;
      }
      
      const eventNYDate = new Date(year, month, day, hours, minutes);
      // NY is EDT/EST (approx UTC-4).
      const eventUtcMs = eventNYDate.getTime() + (4 * 60 * 60 * 1000); 
      
      const now = new Date();
      const diffMs = eventUtcMs - now.getTime();
      const absDiff = Math.abs(diffMs);
      
      const hoursDiff = Math.floor(absDiff / (1000 * 60 * 60));
      const minsDiff = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffMs > 0) {
        if (hoursDiff === 0) {
          return { text: `Scheduled in ${minsDiff}m`, status: 'upcoming' };
        }
        return { text: `Scheduled in ${hoursDiff}h ${minsDiff}m`, status: 'upcoming' };
      } else {
        if (hoursDiff === 0) {
          return { text: `Released ${minsDiff}m ago`, status: 'released' };
        }
        if (hoursDiff < 24) {
          return { text: `Released ${hoursDiff}h ago`, status: 'released' };
        }
        const daysAgo = Math.floor(hoursDiff / 24);
        return { text: `Released ${daysAgo}d ago`, status: 'recent' };
      }
    } catch (err) {
      return { text: "Scheduled", status: 'upcoming' };
    }
  };

  const activeSessions = (() => {
    const hr = utcTime.getUTCHours();
    const list: string[] = [];
    if (hr >= 8 && hr < 17) list.push('LONDON');
    if (hr >= 13 && hr < 22) list.push('NEW YORK');
    if (hr >= 0 && hr < 9) list.push('TOKYO');
    if (hr >= 22 || hr < 7) list.push('SYDNEY');
    return list;
  })();

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredEvents = newsEvents.filter(evt => {
    const matchesSearch = evt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          evt.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesImpact = impactFilter === 'ALL' || evt.impact === impactFilter;
    return matchesSearch && matchesImpact;
  });

  // Sort chronologically and group
  const sortedFilteredEvents = [...filteredEvents].sort((a, b) => {
    return getNormalizedDateString(a.date).localeCompare(getNormalizedDateString(b.date));
  });

  const todayEvents = sortedFilteredEvents.filter(e => getNormalizedDateString(e.date) === todayStr);
  const upcomingEvents = sortedFilteredEvents.filter(e => getNormalizedDateString(e.date) > todayStr);
  const pastEvents = sortedFilteredEvents.filter(e => getNormalizedDateString(e.date) < todayStr);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans antialiased selection:bg-amber-500/10 selection:text-amber-400">
      
      {/* 1. TOP SPOT LIGHT TICKER STRIP */}
      <div className="bg-zinc-950 border-b border-zinc-900 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 overflow-hidden shrink-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono font-bold text-zinc-400 tracking-widest uppercase">SPOT DEFI FEED</span>
        </div>
        
        {/* Real-time rates with flash animation states */}
        <div className="flex items-center gap-5 overflow-x-auto scrollbar-none py-0.5 text-[11px] font-mono flex-1 px-4">
          {Object.keys(prices).length === 0 ? (
            <span className="text-zinc-600 text-[10px] animate-pulse">Establishing secure price connection...</span>
          ) : (
            Object.entries(prices).map(([symbol, rawData]) => {
              const data = rawData as PriceData;
              const isUp = (data?.change ?? 0) >= 0;
              const dec = symbol === 'BTCUSD' ? 0 : symbol === 'XAUUSD' ? 2 : 4;
              return (
                <div key={symbol} className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/40 px-2.5 py-1 rounded-md transition-all hover:bg-zinc-900 text-zinc-300">
                  <span className="font-semibold text-zinc-400">{symbol}</span>
                  <span className={`font-bold transition-all duration-300 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(data?.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })}
                  </span>
                  <span className={`text-[9.5px] font-bold flex items-center ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isUp ? '▲' : '▼'}{(data?.changePercent ?? 0).toFixed(2)}%
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider">WS NETWORK:</span>
          <span className={`text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded border uppercase tracking-wider leading-none ${
            wsStatus === 'CONNECTED' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : wsStatus === 'RECONNECTING'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {wsStatus}
          </span>
        </div>
      </div>

      {/* 2. PRIMARY COMPACT DESK HEADER */}
      <header className="px-6 py-4 bg-zinc-900/80 border-b border-zinc-800/80 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-amber-500 shadow-inner">
            <Cpu className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-black text-lg tracking-tight text-white uppercase flex items-center gap-2">
                JARVIS <span className="text-amber-500">TRADING COCKPIT</span>
              </h1>
              <span className="font-mono text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 uppercase">
                v6.0 LIVE
              </span>
            </div>
            <p className="text-[10.5px] text-zinc-400 mt-0.5">SMC Playbooks & Institutional Macro Deviation Signals for Real Money Trading</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          {/* Active session tags */}
          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800/60 px-2.5 py-1.5 rounded-lg text-[10px]">
            <span className="text-zinc-500 font-bold">SESSION:</span>
            {activeSessions.length === 0 ? (
              <span className="text-zinc-400 font-bold">WEEKEND CLOSE</span>
            ) : (
              activeSessions.map(s => (
                <span key={s} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black text-[9px]">
                  ● {s}
                </span>
              ))
            )}
          </div>

          <button 
            onClick={() => setShowBrainsSettings(!showBrainsSettings)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10.5px] font-medium transition-all ${
              showBrainsSettings 
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' 
                : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-800 hover:text-white text-zinc-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <span>AI Brain Cores</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          </button>

          {/* Dhaka Local BDT vs NY vs UTC clocks */}
          <div className="hidden lg:flex items-center gap-4 border-l border-zinc-800 pl-4 text-right">
            <div>
              <span className="text-[8.5px] text-zinc-500 uppercase block font-bold leading-none">DHAKA (BDT)</span>
              <span className="text-zinc-200 font-bold text-[11px] font-mono">
                {new Date(utcTime.getTime() + 6 * 60 * 60 * 1000).getUTCHours().toString().padStart(2, '0')}:
                {new Date(utcTime.getTime() + 6 * 60 * 60 * 1000).getUTCMinutes().toString().padStart(2, '0')}:
                {new Date(utcTime.getTime() + 6 * 60 * 60 * 1000).getUTCSeconds().toString().padStart(2, '0')}
              </span>
            </div>
            <div>
              <span className="text-[8.5px] text-zinc-500 uppercase block font-bold leading-none">NEW YORK (EDT)</span>
              <span className="text-zinc-300 font-medium text-[11px] font-mono">
                {new Date(utcTime.getTime() - 4 * 60 * 60 * 1000).getUTCHours().toString().padStart(2, '0')}:
                {new Date(utcTime.getTime() - 4 * 60 * 60 * 1000).getUTCMinutes().toString().padStart(2, '0')}
              </span>
            </div>
            <div>
              <span className="text-[8.5px] text-zinc-500 uppercase block font-bold leading-none">UTC CLOCK</span>
              <span className="text-zinc-400 font-medium text-[11px] font-mono">
                {utcTime.getUTCHours().toString().padStart(2, '0')}:
                {utcTime.getUTCMinutes().toString().padStart(2, '0')}
              </span>
            </div>
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
            className="overflow-hidden bg-zinc-950 border-b border-zinc-800/80"
          >
            <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[9.5px] font-mono font-bold uppercase text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Dr. Marcus Vance (Macro Specialist Node)
                </label>
                <select
                  value={selectedPrimaryModel}
                  onChange={e => setSelectedPrimaryModel(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500/50 font-mono"
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Preferred)</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                  <option value="gemini-flash-latest">Gemini Flash Latest</option>
                </select>
                <p className="text-[9px] text-zinc-500">Responsible for interpreting central bank actions, consumer metrics, and sovereign yields.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9.5px] font-mono font-bold uppercase text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Silas Thorne (SMC Quant Node)
                </label>
                <select
                  value={selectedSecondaryModel}
                  onChange={e => setSelectedSecondaryModel(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500/50 font-mono"
                >
                  <option value="llama-3.3-70b-versatile">Llama-3.3 70B (Edge Logic)</option>
                  <option value="llama-3.1-8b-instant">Llama-3.1 8B (Instant-Execution)</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B (MoE Engine)</option>
                  <option value="gemma2-9b-it">Gemma-2 9B (Ultra-low Latency)</option>
                </select>
                <p className="text-[9px] text-zinc-500">Responsible for executing Smart Money Concepts, identifying order blocks, and estimating liquidity sweeps.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2.6 OFFLINE FALLBACK BANNER */}
      {isOfflineMode && (
        <div className="bg-amber-500/5 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-[10.5px] text-amber-300/90 font-mono">
              [SANDBOX MODE ACTIVE] Running local high-fidelity macroeconomic models. Free to customize.
            </span>
          </div>
          <button 
            onClick={() => setIsOfflineMode(false)}
            className="text-[9px] font-mono text-amber-400 border border-amber-500/20 rounded px-2 py-0.5 hover:bg-amber-500/15"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* 3. MAIN WORKSPACE COCKPIT */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start overflow-y-auto">
        
        {/* LEFT COLUMN: EVENTS FEEDS AND TIMELINES (col-span-5) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Feed Header */}
          <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-amber-500" />
              <div>
                <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider block leading-none">WEEKLY ECONOMIC CATALOG</span>
                <span className="text-sm font-bold text-zinc-100">{newsEvents.length} Catalysts Tracked</span>
              </div>
            </div>
            
            <button
              onClick={loadEconomicCalendar}
              disabled={isNewsLoading}
              className="p-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Sync Live Releases"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isNewsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* COLLAPSIBLE CUSTOM EVENT INJECTOR FORM */}
          <div className="border border-zinc-800 border-dashed p-3 rounded-xl hover:border-zinc-700 transition-all">
            {!showCustomForm ? (
              <button
                onClick={() => setShowCustomForm(true)}
                className="w-full py-1 flex items-center justify-center gap-2 text-[10.5px] font-mono font-bold text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-zinc-500" />
                <span>INJECT CUSTOM NEWS RELEASE</span>
              </button>
            ) : (
              <div className="space-y-4 p-1">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-300">CUSTOM MACRO INJECTOR</span>
                  <button 
                    onClick={() => setShowCustomForm(false)}
                    className="p-0.5 text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <form onSubmit={handleDeployCustomNews} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 block uppercase font-bold">Event Title / Indicator</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Core PCE Price Index m/m"
                      value={customTitle}
                      onChange={e => setCustomTitle(e.target.value)}
                      required
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-500 block uppercase font-bold">Country / Asset</label>
                      <input 
                        type="text" 
                        placeholder="e.g. USD, EUR, GBP"
                        value={customCountry}
                        onChange={e => setCustomCountry(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-500 block uppercase font-bold">Market Impact</label>
                      <select
                        value={customImpact}
                        onChange={e => setCustomImpact(e.target.value as 'High' | 'Medium' | 'Low')}
                        className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                      >
                        <option value="High">High (High Volatility)</option>
                        <option value="Medium">Medium (Moderate)</option>
                        <option value="Low">Low (Quiet)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-500 block uppercase font-bold">Consensus Forecast</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 0.3%"
                        value={customForecast}
                        onChange={e => setCustomForecast(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-500 block uppercase font-bold">Previous Value</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 0.2%"
                        value={customPrevious}
                        onChange={e => setCustomPrevious(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-500 block uppercase font-bold">Date (YYYY-MM-DD)</label>
                      <input 
                        type="text" 
                        placeholder="YYYY-MM-DD"
                        value={customDate}
                        onChange={e => setCustomDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-500 block uppercase font-bold">Time (EDT)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 12:30pm"
                        value={customTime}
                        onChange={e => setCustomTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-mono font-bold rounded transition-all tracking-wider"
                  >
                    DEPLOY CUSTOM RELEASE
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* SEARCH, FILTERS, AND GROUPS */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-md">
            
            {/* Search Input */}
            <div className="p-3 border-b border-zinc-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-500 ml-1" />
              <input 
                type="text" 
                placeholder="Search event name, currency..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-0.5 text-zinc-500 hover:text-zinc-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Market Impact Buttons */}
            <div className="flex border-b border-zinc-900 text-[10px] font-mono text-zinc-500 bg-zinc-900/40">
              {(['ALL', 'High', 'Medium', 'Low'] as const).map(impact => (
                <button
                  key={impact}
                  onClick={() => setImpactFilter(impact)}
                  className={`flex-1 py-2.5 border-r last:border-r-0 border-zinc-900 transition-all font-bold ${
                    impactFilter === impact 
                      ? 'text-amber-500 bg-zinc-900' 
                      : 'hover:text-zinc-300 hover:bg-zinc-900/30'
                  }`}
                >
                  {impact === 'High' ? '🔴 HIGH' : impact === 'Medium' ? '🟡 MED' : impact === 'Low' ? '⚪ LOW' : '🌐 ALL'}
                </button>
              ))}
            </div>

            {/* CHRONOLOGICAL GROUPS */}
            <div className="max-h-[600px] overflow-y-auto divide-y divide-zinc-900/50 scrollbar-thin scrollbar-thumb-zinc-900">
              
              {/* GROUP 1: TODAY'S RELEASES */}
              <div className="bg-amber-500/5 px-3 py-2 border-b border-zinc-900 flex items-center justify-between text-[10px] font-mono text-amber-400 font-bold tracking-widest uppercase">
                <span>📅 Today's Focus ({todayStr})</span>
                <span className="bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{todayEvents.length} Release{todayEvents.length === 1 ? '' : 's'}</span>
              </div>
              {todayEvents.length > 0 ? (
                todayEvents.map((evt, index) => {
                  const isSelected = selectedEvent?.title === evt.title;
                  const times = formatEventTimes(evt.date, evt.time);
                  const countdown = getCountdownText(evt.date, evt.time);
                  
                  return (
                    <div 
                      key={`today-${evt.title}-${index}`}
                      onClick={() => triggerEventAnalysis(evt)}
                      className={`p-3.5 transition-all cursor-pointer relative ${
                        isSelected 
                          ? 'bg-zinc-900/95 border-l-2 border-amber-500' 
                          : 'hover:bg-zinc-900/40 border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[9.5px] font-black text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                            {evt.country}
                          </span>
                          <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded uppercase ${
                            evt.impact === 'High' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : evt.impact === 'Medium'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {evt.impact}
                          </span>
                        </div>

                        <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          countdown.status === 'upcoming' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}>
                          {countdown.text}
                        </span>
                      </div>

                      <h4 className="text-[12.5px] font-bold text-white tracking-tight leading-snug">
                        {evt.title}
                      </h4>

                      <div className="flex justify-between items-center mt-2.5 text-[9.5px] font-mono text-zinc-500">
                        <div className="flex gap-3">
                          <div>Cons: <span className="text-zinc-300 font-bold">{evt.forecast || 'N/A'}</span></div>
                          <div>Prev: <span className="text-zinc-400">{evt.previous || 'N/A'}</span></div>
                        </div>
                        <span className="text-amber-500 font-bold font-mono">
                          {times.bdt ? times.bdt.split('at')[1]?.trim() : evt.time} BDT
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-zinc-600 text-[11px] font-mono bg-zinc-900/10">
                  No release triggers scheduled for today.
                </div>
              )}

              {/* GROUP 2: UPCOMING CATALOG */}
              <div className="bg-zinc-900/60 px-3 py-2 border-b border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-400 font-bold tracking-widest uppercase">
                <span>🚀 Upcoming Events</span>
                <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">{upcomingEvents.length}</span>
              </div>
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((evt, index) => {
                  const isSelected = selectedEvent?.title === evt.title;
                  const times = formatEventTimes(evt.date, evt.time);
                  const countdown = getCountdownText(evt.date, evt.time);
                  
                  return (
                    <div 
                      key={`upcoming-${evt.title}-${index}`}
                      onClick={() => triggerEventAnalysis(evt)}
                      className={`p-3.5 transition-all cursor-pointer relative ${
                        isSelected 
                          ? 'bg-zinc-900/95 border-l-2 border-amber-500' 
                          : 'hover:bg-zinc-900/40 border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[9.5px] font-black text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                            {evt.country}
                          </span>
                          <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded uppercase ${
                            evt.impact === 'High' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : evt.impact === 'Medium'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {evt.impact}
                          </span>
                        </div>

                        <span className="text-[9px] font-mono text-zinc-400">
                          {evt.date}
                        </span>
                      </div>

                      <h4 className="text-[12.5px] font-bold text-white tracking-tight leading-snug">
                        {evt.title}
                      </h4>

                      <div className="flex justify-between items-center mt-2.5 text-[9.5px] font-mono text-zinc-500">
                        <div className="flex gap-3">
                          <div>Cons: <span className="text-zinc-300 font-bold">{evt.forecast || 'N/A'}</span></div>
                          <div>Prev: <span className="text-zinc-400">{evt.previous || 'N/A'}</span></div>
                        </div>
                        <span className="text-zinc-400 font-semibold font-mono">
                          {countdown.text}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-zinc-600 text-[11px] font-mono">
                  No upcoming scheduled events matching filters.
                </div>
              )}

              {/* GROUP 3: PASSED HISTORY */}
              <div className="bg-zinc-950 px-3 py-2 border-b border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-500 font-bold tracking-widest uppercase">
                <span>⏮️ Recently Released</span>
                <span className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-600">{pastEvents.length}</span>
              </div>
              {pastEvents.length > 0 ? (
                pastEvents.map((evt, index) => {
                  const isSelected = selectedEvent?.title === evt.title;
                  const times = formatEventTimes(evt.date, evt.time);
                  const countdown = getCountdownText(evt.date, evt.time);
                  
                  return (
                    <div 
                      key={`past-${evt.title}-${index}`}
                      onClick={() => triggerEventAnalysis(evt)}
                      className={`p-3.5 transition-all cursor-pointer relative opacity-60 hover:opacity-100 ${
                        isSelected 
                          ? 'bg-zinc-900/95 border-l-2 border-amber-500 opacity-100' 
                          : 'hover:bg-zinc-900/40 border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[9.5px] font-black text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-850">
                            {evt.country}
                          </span>
                          <span className="text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-500 border border-zinc-700 uppercase">
                            {evt.impact}
                          </span>
                        </div>

                        <span className="text-[9px] font-mono text-zinc-500">
                          {evt.date}
                        </span>
                      </div>

                      <h4 className="text-[12.5px] font-bold text-zinc-300 tracking-tight leading-snug">
                        {evt.title}
                      </h4>

                      <div className="flex justify-between items-center mt-2.5 text-[9.5px] font-mono text-zinc-500">
                        <div className="flex gap-3">
                          <div>Cons: <span className="text-zinc-400">{evt.forecast || 'N/A'}</span></div>
                          <div>Prev: <span className="text-zinc-500">{evt.previous || 'N/A'}</span></div>
                        </div>
                        <span className="text-zinc-500">
                          {countdown.text}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-zinc-600 text-[11px] font-mono">
                  No passed history matches filters.
                </div>
              )}

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CORE DECISION TERMINAL & COCKPIT (col-span-7) */}
        <div ref={analysisPanelRef} className="lg:col-span-7 space-y-6">
          
          <AnimatePresence mode="wait">
            {!selectedEvent ? (
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-12 text-center text-zinc-500 font-mono text-xs flex flex-col items-center justify-center space-y-4 shadow-md min-h-[500px]">
                <Activity className="w-10 h-10 text-zinc-700 animate-pulse" />
                <div className="max-w-md space-y-2">
                  <h3 className="text-zinc-300 font-bold text-sm uppercase tracking-wider">SECURE TRADING TERMINAL</h3>
                  <p className="text-zinc-500 leading-relaxed">
                    Select an economic event from the left timeline. Jarvis will scan the release, formulate an institutional playbook, and simulate trade levels.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 w-full max-w-sm pt-4 border-t border-zinc-900 text-[10px] text-zinc-600 font-bold">
                  <div>1. CHECK SESSION</div>
                  <div>2. COPY LIMITS</div>
                  <div>3. ENTER METATRADER</div>
                </div>
              </div>
            ) : isAnalyzing ? (
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-12 text-center text-zinc-400 font-mono text-xs flex flex-col items-center justify-center space-y-4 shadow-md min-h-[500px]">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
                  <Sparkles className="w-4 h-4 text-amber-500 absolute top-4 left-4 animate-ping" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-bold tracking-widest text-zinc-100 uppercase text-xs">SOLVING COGNITIVE MODELS</p>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">Debating: {selectedPrimaryModel} vs {selectedSecondaryModel}</p>
                </div>
              </div>
            ) : analysisData ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                
                {/* HERO DIRECTIVE PANEL */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-900 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
                          ACTIVE INTEL BLUEPRINT
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 font-bold">
                          {selectedEvent.country} Range
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-white font-sans tracking-tight leading-tight">
                        {selectedEvent.title}
                      </h2>
                    </div>

                    <div className="shrink-0 font-mono">
                      <span className="text-[10px] block text-zinc-500 font-bold text-right uppercase">Dhaka Time (BDT)</span>
                      <span className="text-amber-500 font-black text-sm block tracking-tight mt-0.5">
                        {formatEventTimes(selectedEvent.date, selectedEvent.time).bdt.split('at')[1]?.trim() || selectedEvent.time} BDT
                      </span>
                    </div>
                  </div>

                  {/* High level specifications */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/60">
                      <span className="text-[9px] text-zinc-500 uppercase block font-bold leading-none">Consensus</span>
                      <span className="text-zinc-100 font-bold text-[12px] block mt-1">{selectedEvent.forecast || 'N/A'}</span>
                    </div>
                    <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/60">
                      <span className="text-[9px] text-zinc-500 uppercase block font-bold leading-none">Previous</span>
                      <span className="text-zinc-100 font-bold text-[12px] block mt-1">{selectedEvent.previous || 'N/A'}</span>
                    </div>
                    <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/60">
                      <span className="text-[9px] text-zinc-500 uppercase block font-bold leading-none">Consensus Bias</span>
                      <span className={`font-bold text-[11px] block mt-1 ${
                        analysisData.consensusBias === 'BULLISH' ? 'text-emerald-400' : analysisData.consensusBias === 'BEARISH' ? 'text-rose-400' : 'text-amber-400'
                      }`}>{analysisData.consensusBias}</span>
                    </div>
                    <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/60">
                      <span className="text-[9px] text-zinc-500 uppercase block font-bold leading-none">Countdown</span>
                      <span className="text-zinc-300 font-semibold text-[11px] block mt-1 truncate">
                        {getCountdownText(selectedEvent.date, selectedEvent.time).text}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TACTICAL INSTANT RECOMMENDATION BOX */}
                {(() => {
                  const scenario = getSimulatedScenario(selectedEvent.title, selectedEvent.country, simulatedDeviation);
                  const times = formatEventTimes(selectedEvent.date, selectedEvent.time);
                  const gBias = scenario.goldBias.toUpperCase();
                  const dBias = scenario.dxyBias.toUpperCase();
                  
                  let verdict = "HOLD / NEUTRAL";
                  let isBuy = false;
                  let isSell = false;
                  
                  if (gBias.includes("BULLISH") || gBias.includes("SUPPORT") || gBias.includes("BREAKOUT") || gBias.includes("EXPANSION") || dBias.includes("BEARISH") || dBias.includes("WEAKNESS") || dBias.includes("CRASH")) {
                    verdict = "BUY / LONG";
                    isBuy = true;
                  } else if (gBias.includes("BEARISH") || gBias.includes("PRESSURE") || gBias.includes("LIQUIDATION") || gBias.includes("DISTRIBUTION") || gBias.includes("SWEEP") || dBias.includes("BULLISH") || dBias.includes("STRENGTH")) {
                    verdict = "SELL / SHORT";
                    isSell = true;
                  }

                  const affectedAssets = selectedEvent.country.toUpperCase() === 'USD' 
                    ? 'Spot Gold (XAUUSD), EURUSD, GBPUSD, BTCUSD' 
                    : `${selectedEvent.country.toUpperCase()} Crosses & Spots`;

                  return (
                    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 shadow-sm space-y-4">
                      
                      {/* Interactive Deviation Selector */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-4">
                        <div>
                          <span className="text-amber-500 font-mono font-bold uppercase text-[9px] block tracking-widest">
                            PLAYBOOK MODELER (CHOOSE DEVIATION)
                          </span>
                          <h3 className="text-xs font-bold text-zinc-400 mt-0.5">
                            Toggle simulated print to update limits instantly
                          </h3>
                        </div>

                        <div className="flex p-0.5 bg-zinc-900 rounded-lg border border-zinc-800 text-[9.5px] font-mono shrink-0">
                          {(['ABOVE', 'BELOW', 'INLINE'] as const).map(tab => (
                            <button
                              key={tab}
                              onClick={() => setSimulatedDeviation(tab)}
                              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                                simulatedDeviation === tab 
                                  ? tab === 'ABOVE' 
                                    ? 'bg-emerald-500/10 text-emerald-400' 
                                    : tab === 'BELOW' 
                                      ? 'bg-rose-500/10 text-rose-400'
                                      : 'bg-zinc-800 text-zinc-300'
                                  : 'text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              {tab === 'ABOVE' ? 'PRINT ABOVE ▲' : tab === 'BELOW' ? 'PRINT BELOW ▼' : 'INLINE ⬌'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Giant Signal Verdict */}
                      <div className={`p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 ${
                        isBuy 
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                          : isSell 
                            ? 'bg-rose-500/5 border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.05)]'
                            : 'bg-amber-500/5 border-amber-500/20 text-amber-400'
                      }`}>
                        <div>
                          <span className="text-[9px] font-mono font-bold uppercase text-zinc-400 block tracking-wider">INSTANT EXECUTION SIGNAL</span>
                          <div className="text-3xl font-black tracking-tighter mt-1 uppercase">
                            {verdict}
                          </div>
                          <p className="text-[11.5px] text-zinc-300 mt-2 max-w-lg font-sans leading-relaxed">
                            {scenario.summary}
                          </p>
                        </div>

                        <div className="shrink-0 text-right font-mono text-[10px] space-y-1.5 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-3 sm:pt-0 sm:pl-4 self-stretch flex flex-col justify-center">
                          <div>
                            <span className="text-zinc-500 font-bold uppercase block">SUGGESTED MARKETS</span>
                            <span className="font-bold text-white">{affectedAssets}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 font-bold uppercase block">VOLATILITY TIMEFRAME</span>
                            <span className="font-bold text-zinc-300">Intraday (15m/5m execution)</span>
                          </div>
                        </div>
                      </div>

                      {/* DIRECT EXECUTION BRACKETS WITH COPIES */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9.5px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                            PLAYBOOK ORDER LIMITS (COPY TO PLATFORM)
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500">Click level to copy</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          
                          {/* Entry */}
                          <div 
                            onClick={() => handleCopyToClipboard(scenario.playbook.entry, 'entry')}
                            className="p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all flex justify-between items-center group"
                          >
                            <div>
                              <span className="text-[8.5px] font-mono font-bold text-zinc-500 uppercase block">ENTRY INSTRUCTIONS</span>
                              <span className="text-xs font-bold font-mono text-zinc-100 block mt-1 truncate">
                                {scenario.playbook.entry}
                              </span>
                            </div>
                            <button className="text-zinc-500 group-hover:text-zinc-300 p-1 bg-zinc-950 rounded border border-zinc-850">
                              {copiedType === 'entry' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Stop Loss */}
                          <div 
                            onClick={() => handleCopyToClipboard(scenario.playbook.sl, 'sl')}
                            className="p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all flex justify-between items-center group"
                          >
                            <div>
                              <span className="text-[8.5px] font-mono font-bold text-rose-500/80 uppercase block">STOP LOSS (SL)</span>
                              <span className="text-xs font-bold font-mono text-rose-400 block mt-1 truncate">
                                {scenario.playbook.sl}
                              </span>
                            </div>
                            <button className="text-zinc-500 group-hover:text-zinc-300 p-1 bg-zinc-950 rounded border border-zinc-850">
                              {copiedType === 'sl' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Take Profit */}
                          <div 
                            onClick={() => handleCopyToClipboard(scenario.playbook.tp, 'tp')}
                            className="p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all flex justify-between items-center group"
                          >
                            <div>
                              <span className="text-[8.5px] font-mono font-bold text-emerald-500/80 uppercase block">TAKE PROFIT (TP)</span>
                              <span className="text-xs font-bold font-mono text-emerald-400 block mt-1 truncate">
                                {scenario.playbook.tp}
                              </span>
                            </div>
                            <button className="text-zinc-500 group-hover:text-zinc-300 p-1 bg-zinc-950 rounded border border-zinc-850">
                              {copiedType === 'tp' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                        </div>
                      </div>

                    </div>
                  );
                })()}

                {/* DYNAMIC TAB CONTROLLER */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                  
                  {/* Tab Headers */}
                  <div className="flex border-b border-zinc-900 text-xs font-mono font-bold bg-zinc-900/25">
                    <button
                      onClick={() => setActiveTab('playbook')}
                      className={`flex-1 py-3 text-center border-r border-zinc-900 last:border-r-0 transition-all ${
                        activeTab === 'playbook' 
                          ? 'text-amber-500 bg-zinc-900 border-b border-b-amber-500' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      🎯 TRADING PLAYBOOK
                    </button>
                    <button
                      onClick={() => setActiveTab('debate')}
                      className={`flex-1 py-3 text-center border-r border-zinc-900 last:border-r-0 transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === 'debate' 
                          ? 'text-amber-500 bg-zinc-900 border-b border-b-amber-500' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      🎙️ DUAL AI DEBATE
                      {isPlayingSpeech && (
                        <span className="flex gap-0.5 items-center">
                          <span className="w-1 h-2.5 bg-amber-500 rounded-full animate-pulse"></span>
                          <span className="w-1 h-3.5 bg-amber-500 rounded-full animate-pulse delay-75"></span>
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className={`flex-1 py-3 text-center transition-all ${
                        activeTab === 'analytics' 
                          ? 'text-amber-500 bg-zinc-900 border-b border-b-amber-500' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      📊 QUANT ANALYTICS
                    </button>
                  </div>

                  {/* Tab Body Contents */}
                  <div className="p-5">
                    
                    {/* TAB 1: PLAYBOOK */}
                    {activeTab === 'playbook' && (
                      <div className="space-y-4">
                        
                        {/* Order Flow Steps */}
                        <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-3">
                          <span className="text-[10px] font-mono font-bold text-zinc-400 block uppercase tracking-wider">
                            ALGORITHMIC STEPS OF ORDER-FLOW DELIVERY:
                          </span>
                          <ul className="space-y-2.5 text-xs">
                            {(() => {
                              const scenario = getSimulatedScenario(selectedEvent.title, selectedEvent.country, simulatedDeviation);
                              return scenario.steps.map((step, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-zinc-300">
                                  <span className="w-4.5 h-4.5 rounded bg-zinc-950 border border-zinc-800 text-amber-500 flex items-center justify-center font-mono text-[9px] shrink-0 font-bold mt-0.5">
                                    0{i+1}
                                  </span>
                                  <span className="leading-relaxed">{step}</span>
                                </li>
                              ));
                            })()}
                          </ul>
                        </div>

                        {/* Warnings / Cautions */}
                        {(() => {
                          const scenario = getSimulatedScenario(selectedEvent.title, selectedEvent.country, simulatedDeviation);
                          if (!scenario.playbook.caution) return null;
                          return (
                            <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl flex gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              <div className="text-[11px] leading-relaxed text-rose-300">
                                <strong className="font-bold">SLIPPAGE & SPREAD ADVISORY:</strong> {scenario.playbook.caution}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Macro Summary Narrative */}
                        <div className="bg-zinc-900/20 border border-zinc-900 p-3.5 rounded-xl space-y-1">
                          <span className="text-[9px] font-mono font-bold text-zinc-500 block uppercase tracking-wider">SYSTEM NARRATIVE</span>
                          <p className="text-[11.5px] text-zinc-400 leading-relaxed font-sans italic">
                            "{analysisData.macroImpactAnalysis}"
                          </p>
                        </div>

                      </div>
                    )}

                    {/* TAB 2: AI SPEAKERS DEBATE */}
                    {activeTab === 'debate' && (
                      <div className="space-y-4">
                        
                        {/* Vocalizer Controls */}
                        <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                          <div>
                            <span className="text-[8.5px] text-zinc-500 font-mono font-bold uppercase block">COGNITIVE VOCAL ENGINE</span>
                            <span className="text-xs text-zinc-300 font-bold block mt-0.5">Listen to the debate synthesized live</span>
                          </div>

                          <div className="shrink-0">
                            {isPlayingSpeech ? (
                              <button
                                onClick={stopDebateSpeech}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-mono font-bold hover:bg-rose-500/20 transition-all cursor-pointer"
                              >
                                <VolumeX className="w-3.5 h-3.5" />
                                <span>STOP VOCALIZER</span>
                              </button>
                            ) : (
                              <button
                                onClick={startDebateSpeech}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold hover:bg-amber-500/20 transition-all cursor-pointer shadow-sm"
                              >
                                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                                <span>LISTEN LIVE DEBATE</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Debate turns with high styling */}
                        <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                          {analysisData.debateTranscript.map((turn, i) => {
                            const isActive = activeSpeechTurn === i;
                            const isVance = turn.speaker === 'Macro Hawk';
                            
                            return (
                              <div 
                                key={i}
                                className={`p-3 rounded-xl border transition-all duration-300 ${
                                  isActive 
                                    ? 'bg-amber-500/5 border-amber-500/40 ring-1 ring-amber-500/20' 
                                    : 'bg-zinc-900/30 border-zinc-900 hover:border-zinc-850'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-5.5 h-5.5 rounded-md flex items-center justify-center text-[10px] font-mono font-black ${
                                      isVance 
                                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                      {isVance ? 'MV' : 'ST'}
                                    </span>
                                    <div>
                                      <span className="text-xs font-bold text-zinc-100 block">
                                        {isVance ? 'Dr. Marcus Vance' : 'Silas Thorne'}
                                      </span>
                                      <span className="text-[8.5px] font-mono text-zinc-500 uppercase leading-none block mt-0.5">
                                        {isVance ? 'Macroeconomic Node Specialist' : 'Smart Money & Liquidity Quant'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {isActive && (
                                    <span className="text-[8.5px] font-mono text-amber-500 font-extrabold tracking-widest animate-pulse uppercase bg-amber-500/5 border border-amber-500/20 px-2 py-0.5 rounded">
                                      LIVE SPEAKING
                                    </span>
                                  )}
                                </div>

                                <p className="text-[12px] text-zinc-300 leading-relaxed font-sans pl-7 mt-2">
                                  {turn.text}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                      </div>
                    )}

                    {/* TAB 3: QUANT PROBABILITIES */}
                    {activeTab === 'analytics' && (
                      <div className="space-y-4">
                        
                        <div className="bg-[#0b0b0d] border border-zinc-900 p-4 rounded-xl space-y-4">
                          <span className="text-[9.5px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                            PROBABILISTIC MODEL OUTPUTS (QUANT DESK)
                          </span>

                          <div className="space-y-3">
                            {/* Prob 1 */}
                            <div>
                              <div className="flex justify-between items-center text-[11px] font-mono mb-1">
                                <span className="text-zinc-400 font-bold">Bullish Order-Block Expansion</span>
                                <span className="text-emerald-400 font-black">{analysisData.probabilities.bullishExpansion}%</span>
                              </div>
                              <div className="w-full h-2 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                  style={{ width: `${analysisData.probabilities.bullishExpansion}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Prob 2 */}
                            <div>
                              <div className="flex justify-between items-center text-[11px] font-mono mb-1">
                                <span className="text-zinc-400 font-bold">Bearish Liquidity Sweep</span>
                                <span className="text-rose-400 font-black">{analysisData.probabilities.bearishSweep}%</span>
                              </div>
                              <div className="w-full h-2 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                                  style={{ width: `${analysisData.probabilities.bearishSweep}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Prob 3 */}
                            <div>
                              <div className="flex justify-between items-center text-[11px] font-mono mb-1">
                                <span className="text-zinc-400 font-bold">Liquidity Grab & Mitigation Probe</span>
                                <span className="text-amber-400 font-black">{analysisData.probabilities.liquidityGrabProb || 68}%</span>
                              </div>
                              <div className="w-full h-2 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                  style={{ width: `${analysisData.probabilities.liquidityGrabProb || 68}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Prob 4 */}
                            <div>
                              <div className="flex justify-between items-center text-[11px] font-mono mb-1">
                                <span className="text-zinc-400 font-bold">Volatility Danger Level</span>
                                <span className="text-indigo-400 font-black">{analysisData.probabilities.volatilityDangerIndex}%</span>
                              </div>
                              <div className="w-full h-2 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                  style={{ width: `${analysisData.probabilities.volatilityDangerIndex}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Structural Levels Grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                          <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                            <span className="text-[8px] text-zinc-500 block font-bold">UPPER LIQUIDITY LEVEL</span>
                            <span className="text-zinc-200 font-bold mt-1 block">{analysisData.targets.upperTarget}</span>
                          </div>
                          <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                            <span className="text-[8px] text-zinc-500 block font-bold">LOWER STRUCTURAL FLOOR</span>
                            <span className="text-zinc-200 font-bold mt-1 block">{analysisData.targets.lowerTarget}</span>
                          </div>
                        </div>

                      </div>
                    )}

                  </div>

                </div>

              </motion.div>
            ) : null}
          </AnimatePresence>

        </div>

      </main>

      {/* 4. COMPACT PROFESSIONAL FOOTER */}
      <footer className="border-t border-zinc-900 bg-zinc-950 px-6 py-4.5 text-center text-[10px] text-zinc-500 font-mono shrink-0">
        <p>© 2026 JARVIS COGNITIVE CODESYSTEMS. ADVANCED TRADING NEWS INTEL DESK.</p>
        <p className="mt-1 text-[9px] uppercase tracking-wide text-zinc-650">
          Macroeconomic releases are parsed and synchronized dynamically. All financial quote simulations frozen on weekends.
        </p>
      </footer>

    </div>
  );
}
