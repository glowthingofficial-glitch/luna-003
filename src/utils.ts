import { PriceData, NewsEvent } from './types';

// Extended type for news event analysis response
export interface EventAnalysisData {
  consensusBias: 'BULLISH' | 'BEARISH' | 'VOLATILE RANGE';
  probabilities: {
    bullishExpansion: number;
    bearishSweep: number;
    volatilityDangerIndex: number;
    liquidityGrabProb: number;
    interestRateShiftProb: number;
  };
  targets: {
    upperTarget: string;
    lowerTarget: string;
    liquidityZone: string;
  };
  debateTranscript: Array<{ speaker: 'Macro Hawk' | 'SMC Quant'; text: string }>;
  macroImpactAnalysis: string;
}

// Helper to parse and convert scheduled event times from EDT (Forex Factory) to UTC and BDT (Bangladesh Local Time)
export function formatEventTimes(dateStr?: string, timeStr?: string) {
  if (!dateStr) {
    return {
      ny: "Pending Schedule",
      utc: "Pending Schedule",
      bdt: "Pending Schedule"
    };
  }

  const timeRaw = timeStr || "12:00pm";
  const cleanTime = timeRaw.trim().toLowerCase();

  // If time is tentative or all day, we can't perform specific hour/minute math
  if (cleanTime === "tentative" || cleanTime === "all day" || cleanTime.includes("day") || cleanTime.includes("tent")) {
    return {
      ny: `${dateStr} (${timeRaw})`,
      utc: `${dateStr} (${timeRaw})`,
      bdt: `${dateStr} (${timeRaw})`
    };
  }

  try {
    // 1. Establish year, month (0-indexed), day
    let year = 2026;
    let month = 5; // June
    let day = 28;

    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        month = parseInt(parts[0], 10) - 1;
        day = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      }
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      month = parseInt(parts[0], 10) - 1;
      day = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    } else {
      const parsedD = new Date(dateStr.includes(',') ? dateStr : `${dateStr}, ${year}`);
      if (!isNaN(parsedD.getTime())) {
        year = parsedD.getFullYear();
        month = parsedD.getMonth();
        day = parsedD.getDate();
      }
    }

    // 2. Parse timeStr (e.g. "12:30pm", "8:15am")
    const match = cleanTime.match(/(\d+)[:.]?(\d*)\s*(am|pm)/i);
    let hours = 12;
    let minutes = 0;

    if (match) {
      hours = parseInt(match[1], 10);
      if (match[2]) {
        minutes = parseInt(match[2], 10);
      }
      const ampm = match[3].toLowerCase();
      if (ampm === "pm" && hours < 12) hours += 12;
      if (ampm === "am" && hours === 12) hours = 0;
    }

    // 3. Create EDT baseline
    const baseDate = new Date(Date.UTC(year, month, day, hours, minutes));

    // Calculate dates (UTC is EDT + 4 hrs, BDT is EDT + 10 hrs)
    const utcDate = new Date(baseDate.getTime() + 4 * 60 * 60 * 1000);
    const bdtDate = new Date(baseDate.getTime() + 10 * 60 * 60 * 1000);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const formatPart = (d: Date, tzLabel: string) => {
      const mName = months[d.getUTCMonth()];
      const dayNum = d.getUTCDate();
      const yr = d.getUTCFullYear();
      let hr = d.getUTCHours();
      const min = d.getUTCMinutes().toString().padStart(2, '0');
      const ampm = hr >= 12 ? 'PM' : 'AM';
      hr = hr % 12;
      if (hr === 0) hr = 12;
      return `${mName} ${dayNum}, ${yr} at ${hr}:${min} ${ampm} (${tzLabel})`;
    };

    return {
      ny: formatPart(baseDate, "New York / EDT"),
      utc: formatPart(utcDate, "UTC / GMT"),
      bdt: formatPart(bdtDate, "Bangladesh / BDT")
    };
  } catch (err) {
    return {
      ny: `${dateStr} ${timeStr || ''} (EDT)`,
      utc: `${dateStr} ${timeStr || ''} (UTC)`,
      bdt: `${dateStr} ${timeStr || ''} (BDT)`
    };
  }
}

// Helper to calculate custom high-fidelity simulated deviation scenarios
export function getSimulatedScenario(title: string, country: string, deviation: 'ABOVE' | 'BELOW' | 'INLINE') {
  const cleanTitle = title.toUpperCase();
  const cleanCountry = country.toUpperCase();

  let scenarioName = "";
  let dxyBias = "";
  let goldBias = "";
  let summary = "";
  let steps: string[] = [];
  let playbook = { entry: "", sl: "", tp: "", caution: "" };

  if (cleanTitle.includes("NFP") || cleanTitle.includes("EMPLOYMENT") || cleanTitle.includes("JOB")) {
    if (deviation === 'ABOVE') {
      scenarioName = "Hot Job Growth (Hawkish Tightening)";
      dxyBias = "BULLISH EXPANSION";
      goldBias = "BEARISH SWEEP";
      summary = "Employment figures print significantly above expectations. This reinforces the Federal Reserve's restrictive stance, sparking a wave of treasury bond yields which directly drains liquidity out of Spot Gold (XAUUSD).";
      steps = [
        "Instant spike in DXY sweeps previous daily high liquidity pools.",
        "XAUUSD drops violently to mitigate the H4 bullish order block.",
        "Wait for 5m consolidation before entering any bounce positions."
      ];
      playbook = {
        entry: "Sell XAUUSD on pullbacks to $2335, or Buy DXY on retest.",
        sl: "$2346 on XAUUSD stop orders.",
        tp: "$2302 (Primary weekly liquid liquidity pool).",
        caution: "Slippage is extremely severe on high-impact NFP prints."
      };
    } else if (deviation === 'BELOW') {
      scenarioName = "Cooling Jobs (Rate Cut Frontrunning)";
      dxyBias = "BEARISH DISPLACEMENT";
      goldBias = "BULLISH BREAKOUT";
      summary = "Employment prints below expectations, confirming economic cooling. Swaps market will aggressively price in immediate rate cuts, triggering high-velocity fund inflows into non-yielding safe-havens like Gold.";
      steps = [
        "DXY breaks structure to the downside, displacing below support.",
        "Gold initiates a massive breakout, sweeping buy-side liquidity.",
        "Price tests and holds the 15m Fair Value Gap before expansion."
      ];
      playbook = {
        entry: "Buy XAUUSD at $2352 (FVG trigger) with solid volume confirmation.",
        sl: "$2340 (Below structural swing low).",
        tp: "$2385 (Key resistance and daily range high).",
        caution: "Watch for false downside sweeps in the first 30 seconds."
      };
    } else {
      scenarioName = "Inline Employment (Chop & Reversion)";
      dxyBias = "NEUTRAL RANGEBOUND";
      goldBias = "CONSOLIDATION CHOP";
      summary = "Jobs report comes in close to expectations. No significant policy deviation is implied. Markets will experience initial two-sided whipsaw before reverting to the day's starting ranges.";
      steps = [
        "Two-sided stop hunt sweeps both Asian session highs and lows.",
        "Price-delivery algorithm stabilizes near the daily opening price.",
        "Spreads widen but trend direction remains highly consolidative."
      ];
      playbook = {
        entry: "Mean-reversion scalp plays on XAUUSD boundaries.",
        sl: "$12 below/above entry zone.",
        tp: "Daily equilibrium price level ($2340 area).",
        caution: "High spreads during first 10 minutes make scalping dangerous."
      };
    }
  } else if (cleanTitle.includes("CPI") || cleanTitle.includes("INFLATION") || cleanTitle.includes("PCE")) {
    if (deviation === 'ABOVE') {
      scenarioName = "Inflation Heatwave (Hawkish Pivot)";
      dxyBias = "AGGRESSIVE BULLISH EXPANSION";
      goldBias = "BEARISH DISTRIBUTION";
      summary = "Inflation measures come in higher than forecasted. This locks the central bank into a prolonged restrictive policy, driving up real yields and initiating aggressive distribution in Gold.";
      steps = [
        "DXY expands upward, breaching and holding above weekly pivot.",
        "Gold collapses to sweep Sell-Side Liquidity (SSL) below previous daily lows.",
        "Retests the newly formed bearish order block before continuing lower."
      ];
      playbook = {
        entry: "Short positions on XAUUSD on retests of $2328.",
        sl: "$2342 (Above structural break).",
        tp: "$2295 (Major historical support).",
        caution: "Institutional sellers will attempt to fill blocks at premium prices."
      };
    } else if (deviation === 'BELOW') {
      scenarioName = "Disinflation Confirmation (Dovish Rally)";
      dxyBias = "BEARISH BREAKDOWN";
      goldBias = "EXPLOSIVE BULLISH EXPANSION";
      summary = "Inflation prints cooler than expected. The market celebrates the return of price stability, boosting confidence in upcoming policy easing, pushing capital out of cash and into Gold and BTC.";
      steps = [
        "Immediate sell-off in DXY triggers institutional stop run.",
        "Gold breaks out of H1 consolidation with strong volume displacement.",
        "Tap and go off the 5m Bullish Mitigation Block."
      ];
      playbook = {
        entry: "Buy XAUUSD at $2362 or BTCUSD at 67,800 on support retests.",
        sl: "$2349 (Gold) / 66,500 (BTC).",
        tp: "$2398 (Gold) / 70,500 (BTC).",
        caution: "Avoid FOMO entries at absolute range highs; wait for first pullback."
      };
    } else {
      scenarioName = "Inline Inflation (Stable Pricing)";
      dxyBias = "STABLE MEAN REVERSION";
      goldBias = "SIDEWAYS COMPRESSION";
      summary = "Inflation is matching consensus exactly. Policy-makers are vindicated, and capital flows remain calm. Suitable for short-term range-bound grid strategies.";
      steps = [
        "Markets test the session high and are immediately rejected.",
        "Institutional algorithmic buying absorbs any major downside moves.",
        "Price coils tightly within a symmetric triangle pattern."
      ];
      playbook = {
        entry: "Sell the range highs, buy range lows on XAUUSD ($2330-$2350).",
        sl: "$10 beyond range boundaries.",
        tp: "Midpoint of the range ($2340).",
        caution: "Spreads may remain elevated despite low directional bias."
      };
    }
  } else if (cleanTitle.includes("FOMC") || cleanTitle.includes("RATE") || cleanTitle.includes("DECISION") || cleanTitle.includes("FED") || cleanTitle.includes("BOE") || cleanTitle.includes("ECB")) {
    if (deviation === 'ABOVE') {
      scenarioName = "Hawkish Stance / Surprise Rate Hike";
      dxyBias = "EXTREME BULLISH EXPANSION";
      goldBias = "LIQUIDATION RUN LOWER";
      summary = "The central bank delivers a hawkish statement or higher interest rates. This is highly restrictive, creating a global capital squeeze and initiating liquidation sweeps across all safe-haven and crypto assets.";
      steps = [
        "Mass liquidation triggers cascading sell stops on Gold and BTC.",
        "DXY climbs vertically, creating multiple hourly Fair Value Gaps.",
        "Major institutional order blocks are breached with no signs of mitigation."
      ];
      playbook = {
        entry: "Short sell limit orders on XAUUSD on minor relief rallies.",
        sl: "$25 above entry.",
        tp: "$2260 (Extremely strong macro support pool).",
        caution: "Do not attempt to catch falling knives or buy local dips."
      };
    } else if (deviation === 'BELOW') {
      scenarioName = "Dovish Pivot / Surprise Rate Cut";
      dxyBias = "SUDDEN LIQUIDITY CRASH";
      goldBias = "PARABOLIC MACRO EXPANSION";
      summary = "The central bank announces lower rates or a highly accommodative dovish statement. This instantly devalues cash holdings, triggering parabolic capital allocation into Gold and Bitcoin.";
      steps = [
        "Vertically rising bid prices on Gold break all intermediate resistance levels.",
        "Dollar Index experiences deep, multi-day structure breaks.",
        "Institutional algorithms aggressively hunt short-sellers' stop-losses."
      ];
      playbook = {
        entry: "Aggressive Buy Market entry or limit buys on any minor 1m dip.",
        sl: "$20 below entry.",
        tp: "$2410 (All-time high target).",
        caution: "Slippage can be extreme on buy limits; market execution is safer."
      };
    } else {
      scenarioName = "Inline Decision (Press Conference Catalyst)";
      dxyBias = "HIGH-VOLATILITY SWING";
      goldBias = "TWO-SIDED WHIPSAW";
      summary = "The rate decision matches forecast exactly. All attention shifts to the live press conference. Prepare for dual-sided liquidity sweeps as the chair speaks in real-time.";
      steps = [
        "Initial statement release sparks standard volatility sweeps.",
        "Live comments from the chair trigger sudden, massive 200-pip trend reversals.",
        "Price action is highly erratic and non-directional until press conference ends."
      ];
      playbook = {
        entry: "Wait until 30 minutes after press conference before initiating positions.",
        sl: "Keep stops wide ($25+) if active during the press conference.",
        tp: "Focus on weekly high/low sweeps.",
        caution: "Standard technical analysis fails during the live speaker session."
      };
    }
  } else {
    // General high/medium news
    if (deviation === 'ABOVE') {
      scenarioName = "Positive Economic Catalyst (Better than expected)";
      dxyBias = cleanCountry === "USD" ? "STRENGTH" : "WEAKNESS VS BASKET";
      goldBias = cleanCountry === "USD" ? "MODERATE PRESSURE" : "MODERATE SUPPORT";
      summary = `The economic metric for ${country} prints higher than expected. This indicates economic strength, bolstering the currency and putting minor pressure on safe-havens like Spot Gold.`;
      steps = [
        "Currency index rises instantly, testing local session resistance levels.",
        "Retests and consolidates above the daily opening price."
      ];
      playbook = {
        entry: `Buy ${cleanCountry} crosses on structure retests.`,
        sl: "30 pips below entry.",
        tp: "Previous day high target.",
        caution: "Ensure the deviation is substantial enough to sustain the trend."
      };
    } else if (deviation === 'BELOW') {
      scenarioName = "Negative Economic Catalyst (Economic Slowdown)";
      dxyBias = cleanCountry === "USD" ? "WEAKNESS" : "STRENGTH VS BASKET";
      goldBias = cleanCountry === "USD" ? "MODERATE SUPPORT" : "MODERATE PRESSURE";
      summary = `The ${country} economic release prints below consensus. This sparks local economic slowing concerns, pushing investors to allocate capital into safe-haven gold or stronger currencies.`;
      steps = [
        "Immediate structural break on local currency charts.",
        "Money flows redirect into safety plays and Gold."
      ];
      playbook = {
        entry: `Short ${cleanCountry} crosses or Buy Gold.`,
        sl: "25 pips on forex crosses.",
        tp: "Local support floor pools.",
        caution: "Check for counter-moves during London/NY session crossovers."
      };
    } else {
      scenarioName = "Inline Release (Quiet Session)";
      dxyBias = "FLATLINE CONSOLIDATION";
      goldBias = "STEADY RANGE";
      summary = `The ${country} release prints exactly as expected. No capital reallocation is triggered, and price continues in its pre-release consolidative structure.`;
      steps = [
        "Low volume profile remains active near the session Point of Control (POC).",
        "Technical support and resistance levels hold firmly."
      ];
      playbook = {
        entry: "Maintain existing swing positions. No news-based execution required.",
        sl: "Standard structure stop.",
        tp: "Existing swing targets.",
        caution: "Avoid over-trading quiet sessions."
      };
    }
  }

  return { scenarioName, dxyBias, goldBias, summary, steps, playbook };
}

export const initialMockPrices: Record<string, PriceData> = {
  XAUUSD: { price: 2342.50, change: 12.40, changePercent: 0.53, high: 2355.00, low: 2328.10, history: [2330, 2335, 2340, 2342.50], isSimulated: true },
  BTCUSD: { price: 61250.00, change: 450.00, changePercent: 0.74, high: 61800.00, low: 60500.00, history: [60800, 60950, 61100, 61250.00], isSimulated: true },
  EURUSD: { price: 1.0845, change: -0.0021, changePercent: -0.19, high: 1.0890, low: 1.0820, history: [1.0866, 1.086, 1.085, 1.0845], isSimulated: true },
  GBPUSD: { price: 1.2650, change: 0.0015, changePercent: 0.12, high: 1.2680, low: 1.2610, history: [1.2635, 1.262, 1.264, 1.2650], isSimulated: true },
  USDJPY: { price: 157.85, change: 0.45, changePercent: 0.29, high: 158.20, low: 157.10, history: [157.40, 157.2, 157.5, 157.85], isSimulated: true },
  GBPJPY: { price: 199.65, change: 0.85, changePercent: 0.43, high: 200.10, low: 198.90, history: [198.80, 199.1, 199.4, 199.65], isSimulated: true }
};

export function generateLocalEventAnalysis(event: NewsEvent): EventAnalysisData {
  const title = event.title.toUpperCase();
  const country = event.country.toUpperCase();
  const isHigh = event.impact === 'High';
  
  let consensusBias: 'BULLISH' | 'BEARISH' | 'VOLATILE RANGE' = 'VOLATILE RANGE';
  let bullProb = 50;
  let bearProb = 50;
  let volIndex = isHigh ? 92 : 65;
  let liqProb = isHigh ? 88 : 60;
  let rateShift = isHigh ? 75 : 15;
  
  let upperTarget = "$2365 (Gold) / 69,500 (BTC)";
  let lowerTarget = "$2305 (Gold) / 64,800 (BTC)";
  let liquidityZone = "$2315 - $2322 (XAUUSD Daily Breaker Zone)";
  
  let vanceOpening = "";
  let silasOpening = "";
  let vanceRebuttal = "";
  let silasTactical = "";
  let macroImpactAnalysis = "";

  if (title.includes("NFP") || title.includes("EMPLOYMENT") || title.includes("ADP") || title.includes("JOB")) {
    consensusBias = "VOLATILE RANGE";
    bullProb = 48;
    bearProb = 52;
    upperTarget = "69,200 (BTC) / $2358 (XAUUSD)";
    lowerTarget = "65,400 (BTC) / $2295 (XAUUSD)";
    liquidityZone = "BTCUSD 4H Order Block at 65,800";
    
    vanceOpening = `Analyzing the upcoming ${event.title} (${country}). This jobs print is critical for Fed monetary path. A strong reading will cement the high-for-longer regime, lifting real yields and punishing non-yielding bullion.`;
    silasOpening = `Understood on the macro yields, Dr. Vance. But technically, we have key retail sell stops resting right below $2310 on XAUUSD. The algorithm will likely run these stops first before any bullish shift.`;
    vanceRebuttal = `That's a short-term liquidity view, Silas, but structural trends are driven by capital costs. If payrolls surprise by -30K, no amount of technical blocks will stop gold from a $40 breakout.`;
    silasTactical = `Agreed on that extreme tail risk. Tactically, we wait for the 5-minute displacement after the initial 8:30am hunt. If a bullish breaker forms, we target the fair value gap up at $2358.`;
    macroImpactAnalysis = `The Non-Farm Payrolls release is the premier market-moving indicator. In this environment, employment growth determines the central bank's timing on rate adjustments, creating severe bidirectional liquidity sweeps in early New York trading.`;
  } else if (title.includes("CPI") || title.includes("INFLATION") || title.includes("PCE")) {
    consensusBias = "BULLISH";
    bullProb = 62;
    bearProb = 38;
    upperTarget = "$2385 (Gold) / 71,200 (BTC)";
    lowerTarget = "$2320 (Gold) / 66,100 (BTC)";
    liquidityZone = "XAUUSD H4 Fair Value Gap at $2338 - $2342";
    
    vanceOpening = `Disinflation progress remains the focal point for all G10 central banks. The forecast of ${event.forecast} represents a minor tightening. Any surprise heat in core inflation will spark an aggressive hawkish pricing response.`;
    silasOpening = `Technically, XAUUSD is coiled in a daily symmetric triangle. If the inflation print triggers a downside reaction, the H4 FVG at $2338 is the primary institutional discount area to watch for buy setups.`;
    vanceRebuttal = `Agreed. But remember, a lower CPI print means real rates decline, which is fundamentally highly supportive for Gold. It would represent an immediate green light for capital allocation back into gold reserves.`;
    silasTactical = `Indeed. If we clear the triangle resistance on a soft CPI, we'll see a classic short-squeeze distribution run. Wait for the New York open block retest before chasing the breakout.`;
    macroImpactAnalysis = `Consumer Price Index (CPI) measures the average change over time in the prices paid by consumers. Since central banks target inflation of 2.0%, any persistent deviation of this metric directly dictates the interest rate policy path, producing massive immediate volatility in all global pairs.`;
  } else if (title.includes("FOMC") || title.includes("RATE") || title.includes("DECISION") || title.includes("FED") || title.includes("BOE") || title.includes("ECB") || title.includes("BOJ")) {
    consensusBias = "BEARISH";
    bullProb = 35;
    bearProb = 65;
    upperTarget = "$2420 (Gold) / 72,500 (BTC)";
    lowerTarget = "$2280 (Gold) / 63,400 (BTC)";
    liquidityZone = "FOMC Liquidated High Sweep at $2392";
    
    vanceOpening = `The central bank statement is the ultimate market event. Current terminal rate expectations are highly fragile. With the forecast standing at ${event.forecast}, any subtle adjustments to forward guidance will reshape the yield curve.`;
    silasOpening = `From an SMC perspective, these announcements represent algorithmic sweep events. We typically see double-sided sweeps of both previous daily highs and lows within the first 15 minutes.`;
    vanceRebuttal = `That's exactly why macro participants watch the live press conference. The press conference frequently reverses the initial knee-jerk statement reaction, as the chair balances hawkish actions with dovish commentary.`;
    silasTactical = `Exactly. We'll leave our hands off the keys during the first 30 minutes. Once the structural breaker block is confirmed, we'll trade the expansion leg toward the premium weekly liquidity pool.`;
    macroImpactAnalysis = `Central bank rate decisions and monetary policy statements set the benchmark cost of capital. A hawkish stance increases local currency value but creates a strong liquidity drain from non-yielding commodities and crypto, while a dovish stance devalues cash and fuels rallies.`;
  } else {
    consensusBias = isHigh ? "VOLATILE RANGE" : "BULLISH";
    bullProb = isHigh ? 55 : 51;
    bearProb = isHigh ? 45 : 49;
    upperTarget = "$2360 (Gold) / 68,900 (BTC)";
    lowerTarget = "$2315 (Gold) / 65,200 (BTC)";
    liquidityZone = "15m Bullish Mitigation Block at $2330";
    
    vanceOpening = `Evaluating ${event.title} from ${event.country}. Given the forecast of ${event.forecast} vs previous ${event.previous}, we expect local asset reallocation. Central banks will integrate this into their quarterly summary models.`;
    silasOpening = `On the lower timeframes, the volume profile is heavily concentrated around the session Point of Control. I expect price to remain rangebound until a clean mitigation of the local 15m order block.`;
    vanceRebuttal = `True, but do not underestimate the sentiment shift. Any deviation of more than 5% from the consensus will break that consolidative profile and establish a new intraday trend.`;
    silasTactical = `Understood. In that case, we watch for a premium/discount sweep, followed by a displacement candle. A clean entry on the return to the newly created breaker block is the highest-probability play.`;
    macroImpactAnalysis = `Economic releases of this tier represent secondary macroeconomic guides. While they do not alter monetary regimes on their own, their cumulative impact shapes the economic outlook and guides institutional risk exposure adjustments leading into major monthly sessions.`;
  }

  return {
    consensusBias,
    probabilities: {
      bullishExpansion: bullProb,
      bearishSweep: bearProb,
      volatilityDangerIndex: volIndex,
      liquidityGrabProb: liqProb,
      interestRateShiftProb: rateShift
    },
    targets: {
      upperTarget,
      lowerTarget,
      liquidityZone
    },
    debateTranscript: [
      { speaker: "Macro Hawk", text: vanceOpening },
      { speaker: "SMC Quant", text: silasOpening },
      { speaker: "Macro Hawk", text: vanceRebuttal },
      { speaker: "SMC Quant", text: silasTactical }
    ],
    macroImpactAnalysis
  };
}
