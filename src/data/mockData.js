import analyzedStocks from "./analyzedStocks.json";

export const USD_TO_DKK = 6.92;

// Brugerens 3 primære aktier med verificerede kurser fra Nasdaq Copenhagen
export const INITIAL_STOCKS = [
  {
    id: "zealand",
    symbol: "ZEAL",
    yahooTicker: "ZEAL.CO",
    name: "Zealand Pharma",
    sector: "Bioteknologi",
    country: "DK",
    currency: "DKK",
    currentPrice: analyzedStocks.zealand?.currentPrice || 272.70,
    previousClose: analyzedStocks.zealand?.previousClose || 278.40,
    change: analyzedStocks.zealand?.change || -5.70,
    changePercent: analyzedStocks.zealand?.changePercent || -2.05,
    dayHigh: analyzedStocks.zealand?.dayHigh || 282.00,
    dayLow: analyzedStocks.zealand?.dayLow || 270.50,
    yearHigh: analyzedStocks.zealand?.yearHigh || 315.00,
    yearLow: analyzedStocks.zealand?.yearLow || 175.00,
    peRatio: null,
    dividendYield: 0.00,
    dividendPerShare: 0.00,
    nextDividendDate: null,
    marketCap: "18,2 mia. DKK",
    logoBg: "#0284c7",
    sparkline: analyzedStocks.zealand?.validDays.slice(-8).map(d => d.close) || [278, 275, 272, 276, 274, 272.7],
    history: {
      "1D": [278, 276, 273, 275, 271, 272.7],
      "1U": [285, 280, 276, 274, 272.7],
      "1M": [260, 268, 282, 275, 272.7],
      "1Å": [180, 210, 245, 290, 272.7],
      "MAX": [120, 150, 220, 280, 272.7]
    }
  },
  {
    id: "maersk",
    symbol: "MAERSK-B",
    yahooTicker: "MAERSK-B.CO",
    name: "A.P. Møller - Mærsk B",
    sector: "Shipping & Logistik",
    country: "DK",
    currency: "DKK",
    currentPrice: analyzedStocks.maersk?.currentPrice || 23240.00,
    previousClose: analyzedStocks.maersk?.previousClose || 23720.00,
    change: analyzedStocks.maersk?.change || -480.00,
    changePercent: analyzedStocks.maersk?.changePercent || -2.02,
    dayHigh: analyzedStocks.maersk?.dayHigh || 23860.00,
    dayLow: analyzedStocks.maersk?.dayLow || 23120.00,
    yearHigh: analyzedStocks.maersk?.yearHigh || 24100.00,
    yearLow: analyzedStocks.maersk?.yearLow || 9400.00,
    peRatio: 12.4,
    dividendYield: 4.80,
    dividendPerShare: 1115.00,
    nextDividendDate: "2027-03-25",
    marketCap: "375 mia. DKK",
    logoBg: "#0369a1",
    sparkline: analyzedStocks.maersk?.validDays.slice(-8).map(d => d.close) || [23720, 23800, 23540, 23380, 23150, 23240],
    history: {
      "1D": [23720, 23800, 23540, 23380, 23150, 23240],
      "1U": [23900, 24100, 23850, 23500, 23240],
      "1M": [21500, 22200, 22900, 23800, 23240],
      "1Å": [12800, 14200, 16500, 19800, 23240],
      "MAX": [8500, 11500, 16000, 24100, 23240]
    }
  },
  {
    id: "ambu",
    symbol: "AMBU-B",
    yahooTicker: "AMBU-B.CO",
    name: "Ambu B",
    sector: "Medico & Udstyr",
    country: "DK",
    currency: "DKK",
    currentPrice: analyzedStocks.ambu?.currentPrice || 68.20,
    previousClose: analyzedStocks.ambu?.previousClose || 69.10,
    change: analyzedStocks.ambu?.change || -0.90,
    changePercent: analyzedStocks.ambu?.changePercent || -1.30,
    dayHigh: analyzedStocks.ambu?.dayHigh || 69.80,
    dayLow: analyzedStocks.ambu?.dayLow || 67.90,
    yearHigh: analyzedStocks.ambu?.yearHigh || 145.00,
    yearLow: analyzedStocks.ambu?.yearLow || 58.00,
    peRatio: 34.2,
    dividendYield: 0.55,
    dividendPerShare: 0.38,
    nextDividendDate: "2026-12-15",
    marketCap: "17,8 mia. DKK",
    logoBg: "#059669",
    sparkline: analyzedStocks.ambu?.validDays.slice(-8).map(d => d.close) || [69.1, 69.5, 68.8, 68.4, 68.2],
    history: {
      "1D": [69.1, 69.4, 68.6, 68.9, 68.2],
      "1U": [71.0, 70.2, 69.5, 68.9, 68.2],
      "1M": [65.0, 67.2, 70.5, 69.0, 68.2],
      "1Å": [85.0, 92.0, 78.0, 65.0, 68.2],
      "MAX": [45.0, 85.0, 140.0, 75.0, 68.2]
    }
  }
];

// Brugerens rene start-beholdning: 0 eller standard antal indtil brugeren indtaster sine præcise tal
export const INITIAL_HOLDINGS = [
  {
    stockId: "zealand",
    shares: 50,
    avgBuyPrice: 265.00,
    notes: "Min Zealand position"
  },
  {
    stockId: "maersk",
    shares: 2,
    avgBuyPrice: 22800.00,
    notes: "Min Mærsk position"
  },
  {
    stockId: "ambu",
    shares: 100,
    avgBuyPrice: 65.50,
    notes: "Min Ambu position"
  }
];

// Standard transaktioner
export const INITIAL_TRANSACTIONS = [
  {
    id: "tx-init-1",
    stockId: "zealand",
    type: "BUY",
    date: "2026-09-10",
    shares: 50,
    price: 265.00,
    currency: "DKK",
    fee: 29.00,
    total: 13279.00
  },
  {
    id: "tx-init-2",
    stockId: "maersk",
    type: "BUY",
    date: "2026-09-15",
    shares: 2,
    price: 22800.00,
    currency: "DKK",
    fee: 29.00,
    total: 45629.00
  },
  {
    id: "tx-init-3",
    stockId: "ambu",
    type: "BUY",
    date: "2026-09-18",
    shares: 100,
    price: 65.50,
    currency: "DKK",
    fee: 29.00,
    total: 6579.00
  }
];

export const PORTFOLIO_HISTORY = {
  "1D": [
    { label: "09:00", value: 65000 },
    { label: "12:00", value: 65400 },
    { label: "15:00", value: 65800 },
    { label: "17:00", value: 66530 }
  ],
  "1U": [
    { label: "Man", value: 64200 },
    { label: "Ons", value: 65100 },
    { label: "Fre", value: 66530 }
  ],
  "1M": [
    { label: "Uge 1", value: 61000 },
    { label: "Uge 2", value: 62800 },
    { label: "Uge 3", value: 64500 },
    { label: "Uge 4", value: 66530 }
  ],
  "1Å": [
    { label: "Q1", value: 52000 },
    { label: "Q2", value: 58000 },
    { label: "Q3", value: 66530 }
  ],
  "MAX": [
    { label: "Start", value: 50000 },
    { label: "Nu", value: 66530 }
  ]
};
