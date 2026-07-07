export interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  history: number[];
  isSimulated: boolean;
  tickDir?: 'up' | 'down' | 'stable';
  isMarketClosed?: boolean;
}

export interface Trade {
  id: string;
  date: string;
  pair: string;
  dir: 'BUY' | 'SELL';
  entry: number;
  sl: number;
  tp: number;
  outcome: 'WIN' | 'LOSS' | 'PENDING';
  pnl: number;
  session: 'TOKYO' | 'LONDON' | 'NEW YORK' | 'SYDNEY';
  notes?: string;
}

export interface ScanResult {
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  verdict: 'STRONG BUY' | 'BUY' | 'WAIT' | 'SELL' | 'STRONG SELL';
  confidence: number;
  support: string;
  resistance: string;
  orderBlock: string;
  tradeSetup: {
    entry: number;
    sl: number;
    tp1: number;
    tp2: number;
    rrRatio: string;
  };
  reasoning: string;
  scalpPlan: string;
  geminiView?: string;
  groqView?: string;
  debateTranscript?: Array<{ speaker: string; text: string }>;
  isGroqActive?: boolean;
}

export interface SignalItem {
  id: string;
  timestamp: string;
  pair: string;
  dir: 'BUY' | 'SELL';
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  rrRatio: string;
  confidence: number;
  status: 'ACTIVE' | 'TRIGGERED' | 'TP HIT' | 'SL HIT';
}

export interface NewsEvent {
  title: string;
  country: string;
  impact: string;
  forecast: string;
  previous: string;
  date?: string;
  time?: string;
}

export interface NewsAnalysis {
  macroNarrative: string;
  events: Array<{
    title: string;
    country: string;
    impact: 'High' | 'Medium' | 'Low';
    forecast: string;
    previous: string;
    sentimentBias: 'GOLD BULLISH' | 'USD BULLISH' | 'VOLATILITY ALIGNMENT' | 'NEUTRAL';
    scalperAdvice: string;
  }>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
