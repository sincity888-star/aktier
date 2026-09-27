import { USD_TO_DKK } from "../data/mockData";

export function formatCurrency(amount, currency = "DKK", maximumFractionDigits = 2) {
  if (amount === undefined || amount === null || isNaN(amount)) return "0,00 kr.";
  
  const formatter = new Intl.NumberFormat("da-DK", {
    minimumFractionDigits: maximumFractionDigits > 0 ? 2 : 0,
    maximumFractionDigits: maximumFractionDigits,
  });

  const formatted = formatter.format(amount);
  if (currency === "USD") {
    return `$${formatted}`;
  }
  return `${formatted} kr.`;
}

export function formatPercent(value) {
  if (value === undefined || value === null || isNaN(value)) return "+0,00%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

// Konverter et beløb mellem valutaer
export function convertCurrency(amount, fromCurrency, toCurrency, rate = USD_TO_DKK) {
  if (fromCurrency === toCurrency) return amount;
  if (fromCurrency === "USD" && toCurrency === "DKK") {
    return amount * rate;
  }
  if (fromCurrency === "DKK" && toCurrency === "USD") {
    return amount / rate;
  }
  return amount;
}

// Beregn værdier for en enkelt beholdning
export function getHoldingMetrics(holding, stock, displayCurrency = "DKK", usdRate = USD_TO_DKK) {
  if (!stock) return null;

  // Kurs og købskurs i aktiens egen valuta
  const currentPriceNative = stock.currentPrice;
  const avgCostNative = holding.avgBuyPrice;
  const shares = holding.shares;

  // Værdier i aktiens egen valuta
  const currentValueNative = currentPriceNative * shares;
  const totalCostNative = avgCostNative * shares;
  const profitNative = currentValueNative - totalCostNative;
  const profitPercent = totalCostNative > 0 ? (profitNative / totalCostNative) * 100 : 0;

  // Dagens ændring i aktiens egen valuta
  const dayChangeNative = (stock.change || 0) * shares;
  const dayChangePercent = stock.changePercent || 0;

  // Konverter til den valgte visningsvaluta (DKK eller USD)
  const currentValue = convertCurrency(currentValueNative, stock.currency, displayCurrency, usdRate);
  const totalCost = convertCurrency(totalCostNative, stock.currency, displayCurrency, usdRate);
  const totalProfit = convertCurrency(profitNative, stock.currency, displayCurrency, usdRate);
  const dayChange = convertCurrency(dayChangeNative, stock.currency, displayCurrency, usdRate);

  // Årligt udbytte
  const annualDividendNative = (stock.dividendPerShare || 0) * shares;
  const annualDividend = convertCurrency(annualDividendNative, stock.currency, displayCurrency, usdRate);

  return {
    ...holding,
    stock,
    currentValueNative,
    currentValue,
    totalCost,
    totalProfit,
    profitPercent,
    dayChange,
    dayChangePercent,
    annualDividend,
    dividendYield: stock.dividendYield || 0,
    yieldOnCost: avgCostNative > 0 ? ((stock.dividendPerShare || 0) / avgCostNative) * 100 : 0
  };
}

// Beregn samlede nøgletal for hele porteføljen
export function getPortfolioSummary(holdings, stocks, displayCurrency = "DKK", usdRate = USD_TO_DKK) {
  let totalValue = 0;
  let totalCost = 0;
  let totalDayChange = 0;
  let totalAnnualDividend = 0;

  const stockMap = new Map(stocks.map(s => [s.id, s]));

  const holdingMetrics = holdings
    .map(h => getHoldingMetrics(h, stockMap.get(h.stockId), displayCurrency, usdRate))
    .filter(Boolean);

  for (const m of holdingMetrics) {
    totalValue += m.currentValue;
    totalCost += m.totalCost;
    totalDayChange += m.dayChange;
    totalAnnualDividend += m.annualDividend;
  }

  const totalProfit = totalValue - totalCost;
  const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  const dayChangePercent = (totalValue - totalDayChange) > 0 
    ? (totalDayChange / (totalValue - totalDayChange)) * 100 
    : 0;

  const overallDividendYield = totalValue > 0 ? (totalAnnualDividend / totalValue) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalProfit,
    totalProfitPercent,
    totalDayChange,
    dayChangePercent,
    totalAnnualDividend,
    overallDividendYield,
    holdingMetrics
  };
}
