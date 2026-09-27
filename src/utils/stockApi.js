import analyzedStocks from "../data/analyzedStocks.json";

// Formatterer ticker til Yahoo Finance (f.eks. tilføjer .CO for danske aktier)
export function normalizeTicker(ticker) {
  if (!ticker) return "MAERSK-B.CO";
  const clean = ticker.trim().toUpperCase();
  if (clean.includes(".")) return clean;
  // Standardiserede danske aktier
  const dkMap = {
    "ZEAL": "ZEAL.CO",
    "MAERSK": "MAERSK-B.CO",
    "MAERSK-B": "MAERSK-B.CO",
    "AMBU": "AMBU-B.CO",
    "AMBU-B": "AMBU-B.CO",
    "NOVO": "NOVO-B.CO",
    "NOVO-B": "NOVO-B.CO",
    "DSV": "DSV.CO",
    "VWS": "VWS.CO",
    "CARL": "CARL-B.CO",
    "CARL-B": "CARL-B.CO",
    "DANSKE": "DANSKE.CO",
    "GENMAB": "GMAB.CO",
    "GMAB": "GMAB.CO",
    "PNDORA": "PNDORA.CO"
  };
  return dkMap[clean] || `${clean}.CO`;
}

// Analysér 3 måneders svingningshistorik
export function calculateVolatilityStats(validDays) {
  if (!validDays || validDays.length === 0) {
    return {
      totalDays: 0,
      avgDailySpreadPct: 2.5,
      daysAbove2: 0,
      daysAbove3: 0,
      pctAbove2: 50,
      pctAbove3: 25,
      distinctDipsOver2Pct: 5,
      distinctReboundsOver3Pct: 5,
      suitabilityScore: 3,
      suitabilityText: "Moderat volatilitet"
    };
  }

  const spreads = validDays.map(d => d.spreadPct);
  const avgDailySpreadPct = Number((spreads.reduce((a, b) => a + b, 0) / spreads.length).toFixed(2));
  const daysAbove2 = validDays.filter(d => d.spreadPct >= 2.0).length;
  const daysAbove3 = validDays.filter(d => d.spreadPct >= 3.0).length;
  const pctAbove2 = Math.round((daysAbove2 / validDays.length) * 100);
  const pctAbove3 = Math.round((daysAbove3 / validDays.length) * 100);

  const distinctDipsOver2Pct = validDays.filter(d => d.changePct <= -2.0).length;
  const distinctReboundsOver3Pct = validDays.filter(d => d.changePct >= 2.5).length;

  let suitabilityScore = 3;
  let suitabilityText = "Moderat svingning";
  if (pctAbove2 >= 85) {
    suitabilityScore = 5;
    suitabilityText = "⭐⭐⭐⭐⭐ Ekstremt velegnet (Svinger næsten hver dag >2%)";
  } else if (pctAbove2 >= 65) {
    suitabilityScore = 4;
    suitabilityText = "⭐⭐⭐⭐☆ Meget velegnet (Regelmæssige 2% muligheder)";
  } else {
    suitabilityScore = 3;
    suitabilityText = "⭐⭐⭐☆☆ Moderat velegnet (Mere stabil aktie)";
  }

  return {
    totalDays: validDays.length,
    avgDailySpreadPct,
    daysAbove2,
    daysAbove3,
    pctAbove2,
    pctAbove3,
    distinctDipsOver2Pct,
    distinctReboundsOver3Pct,
    suitabilityScore,
    suitabilityText
  };
}

// Hent live data og 3 måneders historik for enhver aktie
export async function fetchLiveStockData(tickerInput) {
  const yahooTicker = normalizeTicker(tickerInput);

  try {
    const response = await fetch(`/api/yahoo/v8/finance/chart/${yahooTicker}?interval=1d&range=3mo`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) throw new Error("Ingen data fra Yahoo Finance");

    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};

    const validDays = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quotes.close?.[i] != null && quotes.high?.[i] != null && quotes.low?.[i] != null) {
        const close = Number(quotes.close[i].toFixed(2));
        const high = Number(quotes.high[i].toFixed(2));
        const low = Number(quotes.low[i].toFixed(2));
        const open = Number((quotes.open?.[i] || close).toFixed(2));
        const spreadPct = Number(((high - low) / low * 100).toFixed(2));
        const prev = i > 0 && quotes.close[i - 1] ? quotes.close[i - 1] : open;
        const changePct = Number(((close - prev) / prev * 100).toFixed(2));
        const date = new Date(timestamps[i] * 1000).toISOString().split("T")[0];

        validDays.push({ date, open, high, low, close, spreadPct, changePct });
      }
    }

    const currentPrice = Number(meta.regularMarketPrice.toFixed(2));
    const previousClose = Number((meta.chartPreviousClose || meta.previousClose || currentPrice).toFixed(2));
    const change = Number((currentPrice - previousClose).toFixed(2));
    const changePercent = Number(((change / previousClose) * 100).toFixed(2));

    const stats = calculateVolatilityStats(validDays);

    return {
      symbol: meta.symbol.replace(".CO", ""),
      yahooTicker: meta.symbol,
      name: meta.longName || meta.shortName || meta.symbol,
      currency: meta.currency || "DKK",
      currentPrice,
      previousClose,
      change,
      changePercent,
      dayHigh: meta.regularMarketDayHigh || currentPrice,
      dayLow: meta.regularMarketDayLow || currentPrice,
      yearHigh: meta.fiftyTwoWeekHigh || currentPrice * 1.3,
      yearLow: meta.fiftyTwoWeekLow || currentPrice * 0.7,
      validDays,
      stats,
      source: "Nasdaq Copenhagen (Live via Yahoo)",
      lastUpdated: new Date().toLocaleTimeString("da-DK")
    };
  } catch (err) {
    console.warn(`Live opslag fejlede for ${tickerInput}, bruger lokal backup`, err);

    // Tjek om vi har lokal backup i analyzedStocks
    const cleanId = tickerInput.toLowerCase().replace(/[^a-z]/g, "");
    if (analyzedStocks[cleanId]) {
      const backup = analyzedStocks[cleanId];
      return {
        ...backup,
        source: "Nasdaq Copenhagen (Opdateret lukkekurs)",
        lastUpdated: "Seneste børslukning"
      };
    }

    throw err;
  }
}
