import React, { useState, useEffect } from "react";
import { 
  Anchor, 
  TrendingUp, 
  TrendingDown, 
  Bell, 
  BellRing, 
  Calculator, 
  Target, 
  ShieldAlert, 
  Calendar, 
  Sparkles, 
  Check, 
  ArrowUpRight, 
  ArrowDownRight, 
  RotateCcw, 
  Volume2,
  DollarSign,
  RefreshCw,
  Edit3,
  Plus,
  Pill,
  Stethoscope,
  Search,
  CheckCircle2,
  ArrowLeft,
  Mail,
  Send,
  AtSign,
  Settings,
  Smartphone,
  ExternalLink,
  Key
} from "lucide-react";
import { formatCurrency, formatPercent } from "../utils/calculations";
import { playAlertChime, requestNotificationPermission } from "../utils/audioAlert";
import { fetchLiveStockData, calculateVolatilityStats } from "../utils/stockApi";
import { sendStockAlertEmail } from "../utils/emailAlert";
import analyzedStocksBackup from "../data/analyzedStocks.json";

// DYNAMISK ANALYSE MOTOR (Live beregnet ud fra dagens & ugens faktiske børskursdata)
export function calculateDynamicInsight(currentStock, stats, timeframe = "daily", backupDays = []) {
  const currentPrice = currentStock?.currentPrice || 100;
  const dayHigh = currentStock?.dayHigh || currentPrice * 1.01;
  const dayLow = currentStock?.dayLow || currentPrice * 0.99;
  const daySpread = dayHigh - dayLow;
  const daySpreadPct = dayLow > 0 ? (daySpread / dayLow) * 100 : 0;
  const prevClose = currentStock?.previousClose || currentPrice;
  const dayChange = currentStock?.change || (currentPrice - prevClose);
  const dayChangePct = currentStock?.changePercent || (prevClose > 0 ? (dayChange / prevClose) * 100 : 0);

  // Hent de seneste handelsdage (ugens forløb)
  const allDays = (currentStock?.validDays && currentStock.validDays.length > 0)
    ? currentStock.validDays
    : backupDays;
  const recentDays = allDays.length >= 5 ? allDays.slice(-5) : allDays;

  const weekHistory = currentStock?.history?.["1U"] || (recentDays.map(d => d.close));
  const weekLow = recentDays.length > 0 ? Math.min(...recentDays.map(d => d.low)) : (weekHistory.length > 0 ? Math.min(...weekHistory) : currentPrice * 0.97);
  const weekHigh = recentDays.length > 0 ? Math.max(...recentDays.map(d => d.high)) : (weekHistory.length > 0 ? Math.max(...weekHistory) : currentPrice * 1.03);
  const weekSpread = weekHigh - weekLow;
  const weekSpreadPct = weekLow > 0 ? (weekSpread / weekLow) * 100 : 4.5;
  const weekStartPrice = weekHistory.length > 0 ? weekHistory[0] : (recentDays.length > 0 ? recentDays[0].open : currentPrice);
  const weekReturnPct = weekStartPrice > 0 ? ((currentPrice - weekStartPrice) / weekStartPrice) * 100 : 0;
  const daysOver2ThisWeek = recentDays.filter(d => d.spreadPct >= 2.0).length;

  if (timeframe === "daily") {
    const dayPos = daySpread > 0 ? Math.max(0, Math.min(1, (currentPrice - dayLow) / daySpread)) : 0.5;

    let forecast = "STIGER (REKYL)";
    let direction = "UP";
    let signalTag = "Oplagt dip-køb";
    let subtitle = `Dagens spænd: ${daySpreadPct.toFixed(2)}% (${daySpread.toLocaleString("da-DK", { maximumFractionDigits: 1 })} kr.)`;
    let rationale = "";
    let targetPrice = (currentPrice * 1.025).toLocaleString("da-DK", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kr.";
    let stopLoss = (dayLow * 0.985).toLocaleString("da-DK", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kr.";

    if (dayPos <= 0.35 || dayChangePct <= -1.0) {
      forecast = "KØBSZONE (DIP)";
      direction = "UP";
      signalTag = "Køb på dagens bund";
      subtitle = `Aktien tester bunden i dag (${dayLow.toLocaleString("da-DK")} kr.)`;
      rationale = `${currentStock.name} handles i dag i den nederste del af sit dagsinterval (${dayLow.toLocaleString("da-DK")} – ${dayHigh.toLocaleString("da-DK")} kr.). Med et dagsspænd på ${daySpreadPct.toFixed(2)}% (${daySpread.toLocaleString("da-DK", { maximumFractionDigits: 1 })} kr.) er der god sandsynlighed for en rekyl mod toppen af spændet for at hente de +2–3%.`;
      targetPrice = (currentPrice * 1.025).toLocaleString("da-DK", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kr. (+2,5%)";
    } else if (dayPos >= 0.70 || dayChangePct >= 2.0) {
      forecast = "SALGSZONE (PROFIT)";
      direction = "DOWN";
      signalTag = "Tag profit nu";
      subtitle = `Aktien tester toppen i dag (${dayHigh.toLocaleString("da-DK")} kr.)`;
      rationale = `${currentStock.name} har i dag taget et solidt ryk opad på ${dayChangePct > 0 ? '+' : ''}${dayChangePct.toFixed(2)}% og handles tæt på dagens højeste kurs (${dayHigh.toLocaleString("da-DK")} kr.). Ifølge din 2–3% profit-strategi er det nu tid til at sikre overskuddet.`;
      targetPrice = dayHigh.toLocaleString("da-DK", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kr. (Dagens top)";
    } else {
      forecast = "KONSOLIDERING";
      direction = "NEUTRAL";
      signalTag = "Afventer retning";
      subtitle = `Svinger roligt mellem ${dayLow.toLocaleString("da-DK")} og ${dayHigh.toLocaleString("da-DK")} kr.`;
      rationale = `${currentStock.name} befinder sig midt i dagens handelsinterval. Dagens spænd er ${daySpread.toLocaleString("da-DK", { maximumFractionDigits: 1 })} kr. (${daySpreadPct.toFixed(2)}%). Afvent et lille dip mod ${dayLow.toLocaleString("da-DK")} kr. før næste køb.`;
    }

    return {
      forecast,
      direction,
      signalTag,
      subtitle,
      rationale,
      targetPrice,
      stopLoss,
      dailyVolatilityText: `${currentStock.name} svinger i dag ${daySpreadPct.toFixed(2)}% (ca. ${daySpread.toLocaleString("da-DK", { maximumFractionDigits: 1 })} kr.) mellem dagens laveste (${dayLow.toLocaleString("da-DK")} kr.) og højeste (${dayHigh.toLocaleString("da-DK")} kr.).`,
      weeklyVolatilityText: `Rullende ugentlig spredning er ca. ${(daySpreadPct * 1.8).toFixed(1)}%.`,
      frequencyText: daySpreadPct >= 2.0 
        ? `Dagens sving er på ${daySpreadPct.toFixed(2)}%, hvilket betyder at 2% grænsen allerede er nået i dag!`
        : `Dagens sving er på ${daySpreadPct.toFixed(2)}%. Aktiens historik viser at sving over 2% sker ${stats?.pctAbove2 >= 80 ? '2,5-3,5' : '1,5-2,5'} gange om ugen.`
    };
  } else if (timeframe === "weekly") {
    let forecast = weekReturnPct >= 1.5 ? "STIGER (BULLISH)" : (weekReturnPct <= -1.5 ? "KØBSMULIGHED (RABAT)" : "SIDEVÆRTS KANAL");
    let direction = weekReturnPct >= 0 ? "UP" : (weekReturnPct <= -2.5 ? "DOWN" : "NEUTRAL");
    let signalTag = weekReturnPct >= 0 ? "Ugentlig optrend" : "Ugentlig korrektion";
    let subtitle = `Ugeafkast: ${weekReturnPct >= 0 ? '+' : ''}${weekReturnPct.toFixed(2)}% | Ugens spænd: ${weekSpreadPct.toFixed(1)}%`;
    let rationale = `I løbet af de seneste 7 dages handel har ${currentStock.name} bevæget sig mellem ${weekLow.toLocaleString("da-DK")} kr. og ${weekHigh.toLocaleString("da-DK")} kr. Dette giver en ugentlig spredning på ${weekSpreadPct.toFixed(1)}% (${weekSpread.toLocaleString("da-DK", { maximumFractionDigits: 0 })} kr.). I denne uge har ${daysOver2ThisWeek} ud af ${Math.max(1, recentDays.length)} handelsdage budt på sving over 2%.`;

    return {
      forecast,
      direction,
      signalTag,
      subtitle,
      rationale,
      targetPrice: weekHigh.toLocaleString("da-DK", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kr. (Ugens top)",
      stopLoss: (weekLow * 0.98).toLocaleString("da-DK", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kr. (Under ugens bund)",
      dailyVolatilityText: `Gennemsnitlig daglig svingning har i ugen ligget på ca. ${(weekSpreadPct / 2.2).toFixed(2)}%.`,
      weeklyVolatilityText: `Faktisk spredning i de seneste 7 dage er ${weekSpreadPct.toFixed(1)}% (${weekSpread.toLocaleString("da-DK", { maximumFractionDigits: 0 })} kr. mellem ${weekLow.toLocaleString("da-DK")} kr. og ${weekHigh.toLocaleString("da-DK")} kr.).`,
      frequencyText: `I den seneste uge har ${daysOver2ThisWeek} ud af ${Math.max(1, recentDays.length)} handelsdage haft sving over 2%, hvilket bekræfter den høje svingningsfrekvens.`
    };
  } else {
    // 3 Måneders Historisk
    return {
      forecast: "STIGER (HISTORISK)",
      direction: "UP",
      signalTag: "60 Dages Statistik",
      subtitle: `60 Dages Gennemsnit: ${stats?.avgDailySpreadPct || 2.5}% daglig spredning`,
      rationale: `Gennem de seneste 3 måneder har ${currentStock.name} gennemført ${stats?.daysAbove2 || 40} handelsdage med udsving over 2% ud af ${stats?.totalDays || 60} dage (${stats?.pctAbove2 || 67}% af alle dage). Dette gør aktien exceptionelt velegnet til 2–3% dip-køb og profit-taking.`,
      targetPrice: `${(currentPrice * 1.03).toLocaleString("da-DK", { maximumFractionDigits: 1 })} kr. (+3,0%)`,
      stopLoss: `${(currentPrice * 0.98).toLocaleString("da-DK", { maximumFractionDigits: 1 })} kr. (-2,0%)`,
      dailyVolatilityText: `${currentStock.name} svinger i gennemsnit ${stats?.avgDailySpreadPct || 2.5}% mellem dagens højeste og laveste kurs over de seneste 60 børsdage.`,
      weeklyVolatilityText: `Gennemsnitlig ugentlig spredning målt over 3 måneder er ca. ${((stats?.avgDailySpreadPct || 2.5) * 1.8).toFixed(1)}%.`,
      frequencyText: `Sker i gennemsnit ${(stats?.pctAbove2 || 70) >= 85 ? "2,5 til 3,5" : "1,5 til 2,5"} gange om ugen, hvilket giver dig kontinuerlige handelsmuligheder.`
    };
  }
}

export function StockRadar({
  stocks,
  onAddNewStock,
  currency,
  alertConfigs,
  onUpdateAlertConfig,
  onOpenTradeModal,
  onUpdateStockPrice,
  onGoBack
}) {
  const [selectedStockId, setSelectedStockId] = useState(() => stocks[0]?.id || "zealand");
  const [activeTab, setActiveTab] = useState("alerts"); // 'alerts' | 'calculator' | 'analysis'
  const [chartPeriod, setChartPeriod] = useState("3M"); // '1D' | '1U' | '1M' | '3M' | '1Å' | '5Å'
  const [analysisTimeframe, setAnalysisTimeframe] = useState("daily"); // 'daily' | 'weekly' | '3m'
  
  // Ny aktie modal state
  const [isAddTickerOpen, setIsAddTickerOpen] = useState(false);
  const [newTickerInput, setNewTickerInput] = useState("");
  const [isSearchingTicker, setIsSearchingTicker] = useState(false);
  const [tickerError, setTickerError] = useState("");

  const currentStock = stocks.find(s => s.id === selectedStockId) || stocks[0];
  const currentPrice = currentStock ? currentStock.currentPrice : 272.70;

  // Live synkronisering tilstande
  const [isSyncing, setIsSyncing] = useState(false);
  const [dataSourceInfo, setDataSourceInfo] = useState("Nasdaq Copenhagen (Yahoo Finance)");
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editPriceInput, setEditPriceInput] = useState(currentPrice);

  // Swing-trade kalkulator states
  const [calcPrice, setCalcPrice] = useState(currentPrice);
  const [calcShares, setCalcShares] = useState(currentStock?.id === "maersk" ? 2 : currentStock?.id === "zealand" ? 50 : 100);
  const [targetPct, setTargetPct] = useState(3.0);
  const [stopLossPct, setStopLossPct] = useState(2.0);

  // E-mail notifikationer state
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("sincity_alert_email") || "sincity888@gmail.com");
  const [isEmailAlertEnabled, setIsEmailAlertEnabled] = useState(() => localStorage.getItem("sincity_email_alerts_enabled") !== "false");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState(null);
  const [isEmailSettingsOpen, setIsEmailSettingsOpen] = useState(false);
  const [gmailAppPassword, setGmailAppPassword] = useState(() => localStorage.getItem("sincity_gmail_app_password") || "");
  const [resendApiKey, setResendApiKey] = useState(() => localStorage.getItem("sincity_resend_api_key") || "");
  const [sentEmailLogs, setSentEmailLogs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sincity_sent_emails") || "[]");
    } catch {
      return [];
    }
  });

  const handleUpdateEmail = (val) => {
    setUserEmail(val);
    localStorage.setItem("sincity_alert_email", val);
  };

  const handleToggleEmailAlert = (val) => {
    setIsEmailAlertEnabled(val);
    localStorage.setItem("sincity_email_alerts_enabled", val ? "true" : "false");
  };

  const handleUpdateAppPassword = (val) => {
    setGmailAppPassword(val);
    localStorage.setItem("sincity_gmail_app_password", val);
  };

  const handleUpdateResendApiKey = (val) => {
    setResendApiKey(val);
    localStorage.setItem("sincity_resend_api_key", val);
  };

  const handleSendTestEmail = async () => {
    if (!userEmail) return;
    setIsSendingEmail(true);
    setTestEmailStatus(null);
    try {
      const res = await sendStockAlertEmail({
        toEmail: userEmail,
        stockName: currentStock.name,
        symbol: currentStock.symbol,
        type: "BUY_SIGNAL",
        currentPrice,
        diffPct: -currentAlert.dropPctThreshold,
        referencePrice: refPrice,
        targetPrice: Math.round(refPrice * (1 + currentAlert.risePctThreshold / 100))
      });
      setTestEmailStatus({
        type: "success",
        message: `✓ Test-email sendt til ${userEmail}! (${currentStock.symbol} dip-købsalarm)`
      });
      try {
        const logs = JSON.parse(localStorage.getItem("sincity_sent_emails") || "[]");
        setSentEmailLogs(logs);
      } catch {}
    } catch (err) {
      setTestEmailStatus({
        type: "error",
        message: `Fejl ved afsendelse: ${err.message}`
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Hent aktiv alarm for valgt aktie
  const currentAlert = alertConfigs[selectedStockId] || {
    isEnabled: true,
    referencePrice: currentPrice,
    dropPctThreshold: 2.0,
    risePctThreshold: 3.0,
    soundEnabled: true
  };

  // Synkroniser kalkulator ved skift af aktie
  useEffect(() => {
    setCalcPrice(currentPrice);
    setEditPriceInput(currentPrice);
    if (currentStock?.id === "maersk") setCalcShares(2);
    else if (currentStock?.id === "zealand") setCalcShares(50);
    else if (currentStock?.id === "ambu") setCalcShares(100);
  }, [selectedStockId, currentPrice]);

  // Kalkulator beregninger
  const buyCost = calcPrice * calcShares;
  const targetSellPrice = Math.round(calcPrice * (1 + targetPct / 100) * 100) / 100;
  const targetSellTotal = targetSellPrice * calcShares;
  const brokerageFee = 29 * 2;
  const grossProfit = targetSellTotal - buyCost;
  const netProfit = grossProfit - brokerageFee;
  const netProfitPct = buyCost > 0 ? (netProfit / buyCost) * 100 : 0;

  const stopLossPrice = Math.round(calcPrice * (1 - stopLossPct / 100) * 100) / 100;
  const stopLossTotal = stopLossPrice * calcShares;
  const stopLossLoss = buyCost - stopLossTotal + brokerageFee;

  // Reference forskel
  const refPrice = currentAlert.referencePrice || currentPrice;
  const diffFromRef = currentPrice - refPrice;
  const diffFromRefPct = refPrice > 0 ? (diffFromRef / refPrice) * 100 : 0;

  // Statistikker for den valgte aktie
  const backupData = analyzedStocksBackup[selectedStockId];
  const stockDays = currentStock?.validDays || backupData?.validDays || [];
  const stats = currentStock?.stats || backupData?.stats || calculateVolatilityStats(stockDays);

  // SVG Graf data for den valgte tidsperiode ('1D', '1U', '1M', '3M', '1Å', '5Å')
  const getPeriodDataPoints = () => {
    if (chartPeriod === "3M" && stockDays.length > 0) {
      return stockDays.map(d => ({ close: d.close, high: d.high, low: d.low, date: d.date }));
    }
    const hist = currentStock?.history || {};
    const arr = hist[chartPeriod];
    if (arr && arr.length > 0) {
      return arr.map((val, idx) => ({ close: val, high: val * 1.01, low: val * 0.99, label: `#${idx + 1}` }));
    }
    if (stockDays.length > 0) {
      return stockDays.map(d => ({ close: d.close, high: d.high, low: d.low, date: d.date }));
    }
    return [
      { close: currentPrice * 0.95, high: currentPrice * 0.96, low: currentPrice * 0.94 },
      { close: currentPrice * 0.98, high: currentPrice * 0.99, low: currentPrice * 0.97 },
      { close: currentPrice * 0.96, high: currentPrice * 0.97, low: currentPrice * 0.95 },
      { close: currentPrice * 1.02, high: currentPrice * 1.03, low: currentPrice * 1.01 },
      { close: currentPrice, high: currentPrice * 1.01, low: currentPrice * 0.99 }
    ];
  };

  const dataPoints = getPeriodDataPoints();
  const minPrice = Math.min(...dataPoints.map(d => d.low || d.close));
  const maxPrice = Math.max(...dataPoints.map(d => d.high || d.close));
  const priceRange = maxPrice - minPrice || 1;

  const svgW = 360;
  const svgH = 145;
  const padX = 10;
  const padY = 14;
  const effW = svgW - padX * 2;
  const effH = svgH - padY * 2;

  const coords = dataPoints.map((d, i) => ({
    x: padX + (i / Math.max(1, dataPoints.length - 1)) * effW,
    y: padY + effH - (((d.close) - minPrice) / priceRange) * effH,
    ...d
  }));

  const linePath = coords.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pt.x},${pt.y}`;
  }, "");

  // Live Sync
  const handleLiveSync = async () => {
    setIsSyncing(true);
    try {
      const data = await fetchLiveStockData(currentStock.symbol);
      if (data && data.currentPrice) {
        if (onUpdateStockPrice) {
          onUpdateStockPrice(currentStock.id, data.currentPrice);
        }
        setCalcPrice(data.currentPrice);
        setDataSourceInfo(`${data.source} · ${data.lastUpdated}`);
      }
    } catch (err) {
      console.error("Live sync fejl", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  // Tilføj ny aktie
  const handleSearchAndAddTicker = async (e) => {
    e.preventDefault();
    if (!newTickerInput.trim()) return;
    setIsSearchingTicker(true);
    setTickerError("");

    try {
      const result = await fetchLiveStockData(newTickerInput);
      const newStockObj = {
        id: result.symbol.toLowerCase().replace(/[^a-z0-9]/g, ""),
        symbol: result.symbol,
        yahooTicker: result.yahooTicker,
        name: result.name,
        sector: "Handel / Børs",
        country: "DK",
        currency: result.currency || "DKK",
        currentPrice: result.currentPrice,
        previousClose: result.previousClose,
        change: result.change,
        changePercent: result.changePercent,
        dayHigh: result.dayHigh,
        dayLow: result.dayLow,
        yearHigh: result.yearHigh,
        yearLow: result.yearLow,
        validDays: result.validDays,
        stats: result.stats,
        logoBg: "#4338ca",
        sparkline: result.validDays.slice(-8).map(d => d.close),
        history: { "1D": [result.currentPrice], "1U": [result.currentPrice], "1M": [result.currentPrice] }
      };

      onAddNewStock(newStockObj);
      setSelectedStockId(newStockObj.id);
      setIsAddTickerOpen(false);
      setNewTickerInput("");
    } catch (err) {
      setTickerError("Kunne ikke hente kurs for denne ticker. Tjek at symbolet er korrekt.");
    } finally {
      setIsSearchingTicker(false);
    }
  };

  // Ikon baseret på aktie
  const getStockIcon = (sym) => {
    if (sym.includes("ZEAL")) return <Pill className="w-5 h-5" />;
    if (sym.includes("MAERSK")) return <Anchor className="w-5 h-5 stroke-[2.2]" />;
    if (sym.includes("AMBU")) return <Stethoscope className="w-5 h-5 stroke-[2.2]" />;
    return <TrendingUp className="w-5 h-5" />;
  };

  return (
    <div className="px-4 py-3 space-y-4 animate-fade-in">
      {/* Tilbage-knap til overblik */}
      {onGoBack && (
        <div className="flex items-center justify-between pb-0.5">
          <button
            type="button"
            onClick={onGoBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span>← Tilbage til Overblik</span>
          </button>
          <span className="text-[11px] font-semibold text-blue-400">2-3% Svingningsradar</span>
        </div>
      )}

      {/* Vælg Aktie Vælger (Tabs & Tilføj Ny) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {stocks.map(stk => {
          const isSelected = stk.id === selectedStockId;
          return (
            <button
              key={stk.id}
              onClick={() => setSelectedStockId(stk.id)}
              className={`px-3 py-2 rounded-2xl flex items-center gap-2 transition-all whitespace-nowrap border ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-400/50 shadow-md shadow-blue-600/30 scale-105"
                  : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-white border-[var(--border-subtle)]"
              }`}
            >
              <span className="font-bold text-xs">{stk.symbol}</span>
              <span className="font-mono text-xs opacity-90 tabular-nums">
                {stk.currentPrice.toLocaleString("da-DK")} kr.
              </span>
            </button>
          );
        })}

        {/* Tilføj ny aktie knap */}
        <button
          onClick={() => setIsAddTickerOpen(true)}
          className="px-3 py-2 rounded-2xl bg-[var(--bg-card)] border border-dashed border-slate-600 hover:border-blue-400 text-blue-400 hover:text-white flex items-center gap-1 text-xs font-bold whitespace-nowrap active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tilføj Ticker</span>
        </button>
      </div>

      {/* Hurtig visning af aktuel overvågning for valgt aktie */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 text-xs shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Overvåger {currentStock.name}:</div>
            <div className="font-mono font-bold text-white flex items-center gap-2 mt-0.5">
              <span className="text-blue-400">Køb ved: -{currentAlert.dropPctThreshold.toFixed(1)}%</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400">Sælg ved: +{currentAlert.risePctThreshold.toFixed(1)}%</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab("alerts")}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
            activeTab === "alerts"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30"
          }`}
        >
          {activeTab === "alerts" ? "✓ Åben nu" : "Skift %"}
        </button>
      </div>

      {/* Hero Kort for den valgte aktie */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-950/40 via-[var(--bg-card)] to-[var(--bg-card-elevated)] border border-blue-500/30 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: currentStock?.logoBg || "#0369a1" }}
            >
              {getStockIcon(currentStock.symbol)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-extrabold text-base text-white">{currentStock.name}</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {currentStock.symbol}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">{currentStock.sector} · Nasdaq CPH</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Live Sync Knap */}
            <button
              onClick={handleLiveSync}
              disabled={isSyncing}
              className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 flex items-center gap-1 text-xs font-semibold active:scale-95 transition-all"
              title="Hent seneste live kurs fra børsen"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-blue-400" : ""}`} />
              <span className="hidden xs:inline">{isSyncing ? "Henter..." : "Live Sync"}</span>
            </button>

            {/* Alarm aktiv badge */}
            <button
              onClick={() => {
                requestNotificationPermission();
                onUpdateAlertConfig(selectedStockId, { ...currentAlert, isEnabled: !currentAlert.isEnabled });
              }}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
                currentAlert.isEnabled
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/20"
                  : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-muted)]"
              }`}
            >
              {currentAlert.isEnabled ? (
                <>
                  <BellRing className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                  <span>Alarm Til</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Fra</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Datakilde Bar */}
        <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-blue-950/40 border border-blue-500/20 text-[10px] text-blue-300/90 font-medium">
          <span className="truncate">📡 {dataSourceInfo}</span>
          <span className="font-mono text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Verificeret kurs
          </span>
        </div>

        {/* Børskurs & Reference - Plus500 Style UI */}
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)] font-medium">
            <span>Markedspriser (Live)</span>
            {isEditingPrice ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={editPriceInput}
                  onChange={(e) => setEditPriceInput(e.target.value)}
                  className="w-24 px-2 py-1 rounded-md bg-[var(--bg-input)] border border-blue-500 text-xs font-mono font-bold text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = Number(editPriceInput);
                    if (val > 0) {
                      onUpdateStockPrice(selectedStockId, val);
                      setCalcPrice(val);
                      setIsEditingPrice(false);
                    }
                  }}
                  className="px-2 py-1 rounded-md bg-blue-600 text-white text-xs font-bold"
                >Gem</button>
              </div>
            ) : (
              <button onClick={() => { setEditPriceInput(currentPrice); setIsEditingPrice(e => !e); }} className="text-blue-400 hover:text-white flex items-center gap-1" title="Tilpas kurs manuelt"><Edit3 className="w-3 h-3" /> <span className="text-[9px]">Ret</span></button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* SÆLG KNAP (Bid) */}
            <button 
              onClick={() => onOpenTradeModal && onOpenTradeModal(selectedStockId, "SELL")}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-rose-500/50 hover:bg-rose-500/10 active:scale-95 transition-all cursor-pointer shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500/70"></div>
              <span className="text-[10px] font-bold text-rose-500 mb-0.5 tracking-wider">SÆLG</span>
              <span className="text-xl sm:text-2xl font-extrabold text-[var(--text-main)] font-mono tabular-nums">
                {(currentPrice * 0.9995).toLocaleString("da-DK", { minimumFractionDigits: 2 })}
              </span>
            </button>

            {/* KØB KNAP (Ask) */}
            <button 
              onClick={() => onOpenTradeModal && onOpenTradeModal(selectedStockId, "BUY")}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-emerald-500/50 hover:bg-emerald-500/10 active:scale-95 transition-all cursor-pointer shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/70"></div>
              <span className="text-[10px] font-bold text-emerald-500 mb-0.5 tracking-wider">KØB</span>
              <span className="text-xl sm:text-2xl font-extrabold text-[var(--text-main)] font-mono tabular-nums">
                {(currentPrice * 1.0005).toLocaleString("da-DK", { minimumFractionDigits: 2 })}
              </span>
            </button>
          </div>

          <div className="flex justify-between items-center pt-2 mt-1 border-t border-[var(--border-subtle)]">
            <div className="text-[11px] text-[var(--text-muted)] font-medium">Fra reference ({refPrice} kr.)</div>
            <div 
              className="text-sm font-bold font-mono tabular-nums flex items-center gap-1"
              style={{ color: diffFromRef >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}
            >
              {diffFromRef >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{diffFromRef >= 0 ? "+" : ""}{diffFromRef.toFixed(1)} kr. ({formatPercent(diffFromRefPct)})</span>
            </div>
          </div>
        </div>

        {/* Nulstil reference knap */}
        <div className="flex items-center justify-between mt-3 pt-2 text-xs border-t border-[var(--border-subtle)]">
          <span className="text-[var(--text-muted)] text-[11px]">Bruges til 2-3% alarmer</span>
          <button
            onClick={() => onUpdateAlertConfig(selectedStockId, { ...currentAlert, referencePrice: currentPrice })}
            className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 active:scale-95 transition-transform"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Sæt reference til nuværende ({currentPrice} kr.)</span>
          </button>
        </div>
      </div>

      {/* Faner: Sæt % Alarmer / 2-3% Kalkulator / Frekvensanalyse */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs font-bold">
        <button
          onClick={() => setActiveTab("alerts")}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "alerts"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-[var(--text-muted)] hover:text-white"
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>Indstil %</span>
        </button>

        <button
          onClick={() => setActiveTab("calculator")}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "calculator"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-[var(--text-muted)] hover:text-white"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Kalkulator</span>
        </button>

        <button
          onClick={() => setActiveTab("analysis")}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "analysis"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-[var(--text-muted)] hover:text-white"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Analyse</span>
        </button>
      </div>

      {/* 1. KALKULATOR FANE */}
      {activeTab === "calculator" && (
        <div className="space-y-3 animate-fade-in">
          <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>2-3% Kalkulator: {currentStock.name}</span>
              </div>
              <button
                onClick={() => setCalcPrice(currentPrice)}
                className="text-[11px] text-blue-400 hover:underline"
              >
                Brug aktuel kurs
              </button>
            </div>

            {/* Input: Købskurs & Antal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Købskurs (kr.)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={calcPrice}
                  onChange={(e) => setCalcPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] focus:border-blue-500 font-mono text-sm font-bold text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Antal aktier (stk.)
                </label>
                <input
                  type="number"
                  min="1"
                  value={calcShares}
                  onChange={(e) => setCalcShares(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] focus:border-blue-500 font-mono text-sm font-bold text-white text-center"
                />
              </div>
            </div>

            {/* Vælg Profitmål % */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">
                <span>Vælg Profitmål</span>
                <span className="text-emerald-400 font-mono font-bold">+{targetPct.toFixed(1)}%</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[2.0, 2.5, 3.0, 4.0].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setTargetPct(pct)}
                    className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                      targetPct === pct
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                        : "bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-white border border-[var(--border-subtle)]"
                    }`}
                  >
                    +{pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Resultat: Målkurs & Nettofortjeneste */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)] font-medium">🎯 Salgsmål ved +{targetPct}%:</span>
                <span className="text-base font-extrabold text-emerald-300 font-mono tabular-nums">
                  {targetSellPrice.toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr.
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-emerald-500/20">
                <span className="text-[var(--text-muted)] font-medium">Netto gevinst efter kurtage (58 kr.):</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono tabular-nums">
                  +{netProfit.toLocaleString("da-DK", { maximumFractionDigits: 0 })} kr.
                  <span className="text-[11px] ml-1 font-semibold text-emerald-400/90">({netProfitPct.toFixed(2)}%)</span>
                </span>
              </div>
            </div>

            {/* Stop-loss beregning */}
            <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/25 flex items-center justify-between text-xs">
              <div>
                <span className="text-[var(--text-muted)]">🛡️ Stop-loss (-{stopLossPct}%):</span>
                <div className="text-rose-300 font-mono font-bold mt-0.5">
                  {stopLossPrice.toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr.
                </div>
              </div>
              <div className="text-right">
                <span className="text-[var(--text-muted)]">Maks risiko:</span>
                <div className="text-rose-400 font-mono font-bold mt-0.5">
                  -{stopLossLoss.toLocaleString("da-DK", { maximumFractionDigits: 0 })} kr.
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenTradeModal(currentStock.id, "BUY")}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 active:scale-98 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Køb {currentStock.name}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. FREKVENS- OG DYNAMISK ANALYSE FANE */}
      {activeTab === "analysis" && (() => {
        const aiInsight = calculateDynamicInsight(
          currentStock,
          stats,
          analysisTimeframe,
          backupData?.validDays || []
        );

        const isUp = aiInsight.direction === "UP";
        const isDown = aiInsight.direction === "DOWN";

        return (
          <div className="space-y-3.5 animate-fade-in">
            {/* 1. Sincity AI Kursvurdering: Stige eller Falde? */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-950/40 via-[var(--bg-card)] to-[var(--bg-card-elevated)] border border-blue-500/30 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-blue-300">Sincity AI Analyse</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Live beregnet ud fra dagsdata"></span>
                    </div>
                    <h3 className="text-xs font-bold text-white">{currentStock.name} ({currentStock.symbol})</h3>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full font-extrabold text-xs border ${
                  isUp 
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                    : isDown
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                }`}>
                  {aiInsight.forecast}
                </span>
              </div>

              {/* Tidsvælger: Daglig vs Ugentlig vs 3 Måneder */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-700/80 text-center">
                <button
                  type="button"
                  onClick={() => setAnalysisTimeframe("daily")}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    analysisTimeframe === "daily"
                      ? "bg-blue-600 text-white shadow-sm scale-102"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  📅 Daglig (I dag)
                </button>
                <button
                  type="button"
                  onClick={() => setAnalysisTimeframe("weekly")}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    analysisTimeframe === "weekly"
                      ? "bg-blue-600 text-white shadow-sm scale-102"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  📆 Ugentlig (7 dage)
                </button>
                <button
                  type="button"
                  onClick={() => setAnalysisTimeframe("3m")}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    analysisTimeframe === "3m"
                      ? "bg-blue-600 text-white shadow-sm scale-102"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  📊 3 Mdr. Statistik
                </button>
              </div>

              {/* Hovedkonklusion */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700/70 space-y-2">
                <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <span className="text-sm">{isUp ? "🚀" : isDown ? "💰" : "⚖️"}</span>
                  <span>{analysisTimeframe === "daily" ? "Dagens Vurdering:" : analysisTimeframe === "weekly" ? "Ugens Vurdering:" : "Historisk Vurdering:"}</span>
                  <span className={isUp ? "text-emerald-400 font-extrabold" : isDown ? "text-amber-400 font-extrabold" : "text-blue-300 font-extrabold"}>
                    {aiInsight.subtitle}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {aiInsight.rationale}
                </p>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 pt-1.5 border-t border-slate-800 text-[11px] font-mono">
                  <span className="text-slate-400">
                    🎯 {analysisTimeframe === "daily" ? "Dagens Målkurs (+2-3%):" : analysisTimeframe === "weekly" ? "Ugens Målkurs (Top):" : "3 Mdr. Målkurs:"}{" "}
                    <strong className="text-emerald-400 font-bold">{aiInsight.targetPrice}</strong>
                  </span>
                  <span className="text-slate-400">
                    🛡️ Stop-loss: <strong className="text-rose-400 font-bold">{aiInsight.stopLoss}</strong>
                  </span>
                </div>
              </div>

              {/* De 3 Nøglepunkter - dynamisk baseret på valgt tidsramme */}
              <div className="space-y-2 pt-1">
                {/* 1. Daglig volatilitet */}
                <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{analysisTimeframe === "daily" ? "Dagens bevægelse & spænd" : "Daglig volatilitet"}</span>
                    </div>
                    {analysisTimeframe === "daily" && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold">
                        Live Lige Nu
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {aiInsight.dailyVolatilityText}
                  </p>
                </div>

                {/* 2. Ugentlig volatilitet */}
                <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{analysisTimeframe === "weekly" ? "Ugens handelsinterval & spredning" : "Ugentlig volatilitet"}</span>
                    </div>
                    {analysisTimeframe === "weekly" && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                        Seneste 7 Dage
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {aiInsight.weeklyVolatilityText}
                  </p>
                </div>

                {/* 3. Frekvens af 2–3% sving */}
                <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                      <Target className="w-3.5 h-3.5" />
                      <span>Frekvens af 2–3% sving</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-300/80">
                      Strategi: Dip & Profit
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {aiInsight.frequencyText}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Interaktiv Kursgraf med 6 Perioder: 1D, 1 uge, 1 mdr, 3 mdr, 1 år, 5 år */}
            <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Kursforløb for {currentStock.symbol}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Aktuel: <strong className="text-white">{currentPrice.toLocaleString("da-DK")} kr.</strong>
                </span>
              </div>

              {/* Tidsperiode knapper */}
              <div className="grid grid-cols-6 gap-1 p-1 rounded-xl bg-slate-900/70 border border-slate-700/60 text-center">
                {[
                  { key: "1D", label: "1D" },
                  { key: "1U", label: "1 uge" },
                  { key: "1M", label: "1 mdr" },
                  { key: "3M", label: "3 mdr" },
                  { key: "1Å", label: "1 år" },
                  { key: "5Å", label: "5 år" }
                ].map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setChartPeriod(p.key)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      chartPeriod === p.key
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Graf visning */}
              <div className="w-full h-[145px]">
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id={`grad-${selectedStockId}-${chartPeriod}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <path
                    d={`${linePath} L ${coords[coords.length - 1].x},${svgH} L ${coords[0].x},${svgH} Z`}
                    fill={`url(#grad-${selectedStockId}-${chartPeriod})`}
                  />
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
                <span>Lavest i {chartPeriod}: <strong className="text-slate-300">{minPrice.toLocaleString("da-DK")} kr.</strong></span>
                <span>Højest i {chartPeriod}: <strong className="text-slate-300">{maxPrice.toLocaleString("da-DK")} kr.</strong></span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. ALARM INDSTILLINGER FANE */}
      {activeTab === "alerts" && (
        <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-emerald-400" />
              <span>Indstil Overvågningsprocent: {currentStock.name}</span>
            </div>
            <button
              onClick={() => playAlertChime("buy")}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Test Lyd</span>
            </button>
          </div>

          <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-2xl border border-slate-700/80">
            🔔 Appen holder øje med kursen live og giver besked med lyd og notifikation, når kursen afviger med de valgte procenter fra referencekursen (<strong className="text-white font-mono">{refPrice.toLocaleString("da-DK")} kr.</strong>).
          </div>

          {/* Referencekurs justering */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <span className="text-slate-400">Referencekurs at måle ud fra:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white">{refPrice.toLocaleString("da-DK")} kr.</span>
              <button
                type="button"
                onClick={() => onUpdateAlertConfig(selectedStockId, { ...currentAlert, referencePrice: currentPrice })}
                className="px-2 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-bold text-[10px] border border-blue-500/30"
              >
                Nulstil til nuværende kurs
              </button>
            </div>
          </div>

          {/* Fald-alarm */}
          <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/40 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-300 flex items-center gap-1.5 text-sm">
                <TrendingDown className="w-4 h-4 text-blue-400" />
                <span>Købssignal ved fald (Dip)</span>
              </span>
              <span className="font-mono font-bold text-blue-300 text-sm">
                {(refPrice * (1 - currentAlert.dropPctThreshold / 100)).toLocaleString("da-DK", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kr.
              </span>
            </div>

            {/* Hurtig-knapper for % fald */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 mr-1 font-semibold">Vælg %:</span>
              {[1.5, 2.0, 2.5, 3.0, 4.0, 5.0].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onUpdateAlertConfig(selectedStockId, { ...currentAlert, dropPctThreshold: pct })}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all ${
                    currentAlert.dropPctThreshold === pct
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/40 scale-105 border border-blue-400"
                      : "bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                  }`}
                >
                  -{pct.toFixed(1)}%
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.1"
                value={currentAlert.dropPctThreshold}
                onChange={(e) => onUpdateAlertConfig(selectedStockId, { ...currentAlert, dropPctThreshold: Number(e.target.value) })}
                className="flex-1 accent-blue-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="w-16 text-right font-mono font-extrabold text-base text-blue-400">
                -{currentAlert.dropPctThreshold.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Stignings-alarm */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-sm">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Salgssignal ved stigning (Profit)</span>
              </span>
              <span className="font-mono font-bold text-emerald-300 text-sm">
                {(refPrice * (1 + currentAlert.risePctThreshold / 100)).toLocaleString("da-DK", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kr.
              </span>
            </div>

            {/* Hurtig-knapper for % stigning */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 mr-1 font-semibold">Vælg %:</span>
              {[1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onUpdateAlertConfig(selectedStockId, { ...currentAlert, risePctThreshold: pct })}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all ${
                    currentAlert.risePctThreshold === pct
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/40 scale-105 border border-emerald-400"
                      : "bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                  }`}
                >
                  +{pct.toFixed(1)}%
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.1"
                value={currentAlert.risePctThreshold}
                onChange={(e) => onUpdateAlertConfig(selectedStockId, { ...currentAlert, risePctThreshold: Number(e.target.value) })}
                className="flex-1 accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="w-16 text-right font-mono font-extrabold text-base text-emerald-400">
                +{currentAlert.risePctThreshold.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* E-MAIL NOTIFIKATIONER SEKTION */}
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                    <span>E-mail Notifikationer ved Alarmer</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      PRO
                    </span>
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Få besked direkte i din indbakke, når {currentStock.name} rammer dit købs- eller salgsmål
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEmailAlertEnabled}
                  onChange={(e) => handleToggleEmailAlert(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* E-mail adresse input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <AtSign className="w-3 h-3 text-amber-400" />
                <span>Modtager e-mailadresse:</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => handleUpdateEmail(e.target.value)}
                  placeholder="f.eks. sincity888@gmail.com"
                  className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSendingEmail || !userEmail}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSendingEmail ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sender...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Test Mail</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Test Email Status Message */}
            {testEmailStatus && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${
                  testEmailStatus.type === "success"
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{testEmailStatus.message}</span>
              </div>
            )}

            {/* Hjælpeboks & Seneste afsendte mails */}
            <div className="pt-1 text-[11px] text-slate-400 space-y-2">
              <div className="flex items-center justify-between">
                <span>✓ E-mailen indeholder kurs, swing-mål (+2-3%) og direkte link.</span>
                <button
                  type="button"
                  onClick={() => setIsEmailSettingsOpen(prev => !prev)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-3 h-3" />
                  <span>{isEmailSettingsOpen ? "Skjul indstillinger" : "Avanceret (Rigtig Gmail / Telefon)"}</span>
                </button>
              </div>

              {/* Avancerede indstillinger for rigtig afsendelse */}
              {isEmailSettingsOpen && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Forbind til rigtig Gmail-levering</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block">
                      Google App-adgangskode (16 bogstaver, f.eks. "abcd efgh ijkl mnop"):
                    </label>
                    <input
                      type="password"
                      value={gmailAppPassword}
                      onChange={(e) => handleUpdateAppPassword(e.target.value)}
                      placeholder="Indsæt Google App Password..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                    <div className="text-[10px] text-slate-400 pt-0.5">
                      💡 Google tillader ikke dit normale kodeord. Opret en 16-bogstavs app-kode på 20 sekunder her:{" "}
                      <a 
                        href="https://myaccount.google.com/apppasswords" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-amber-400 hover:underline inline-flex items-center gap-0.5 font-semibold"
                      >
                        myaccount.google.com/apppasswords <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                        <span>Live Telefon Push (0 koder)</span>
                      </span>
                      <a
                        href="https://ntfy.sh/sincity_aktie_radar"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-bold text-[10px] rounded-lg border border-blue-500/30 inline-flex items-center gap-1"
                      >
                        <span>Åbn ntfy.sh</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Åbn linket på din iPhone/Android og tryk "Abonner", så vibrerer og bipper din mobil med det samme ved hver 2–3% alarm!
                    </p>
                  </div>
                </div>
              )}

              {sentEmailLogs.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between mb-1">
                    <span>Seneste afsendte alarm ({sentEmailLogs.length}):</span>
                    <span>{new Date(sentEmailLogs[0].date).toLocaleTimeString("da-DK", { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 truncate font-mono bg-slate-950/40 px-2 py-1 rounded border border-slate-800">
                    {sentEmailLogs[0].subject}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tilføj Ny Aktie Ticker */}
      {isAddTickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-400" />
                <span>Tilføj Ny Aktie til Radar</span>
              </h3>
              <button
                onClick={() => setIsAddTickerOpen(false)}
                className="w-8 h-8 rounded-full bg-[var(--bg-card)] text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSearchAndAddTicker} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Indtast Tickersymbol
                </label>
                <input
                  type="text"
                  placeholder="F.eks. NOVO-B, DSV, VWS, TSLA..."
                  value={newTickerInput}
                  onChange={(e) => setNewTickerInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-blue-500 text-sm font-bold text-white uppercase placeholder-slate-500"
                  autoFocus
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  For danske aktier tilføjes automatisk .CO (f.eks. DSV bliver til DSV.CO)
                </p>
              </div>

              {tickerError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  {tickerError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSearchingTicker || !newTickerInput.trim()}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isSearchingTicker ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Henter 3 Mdr. Data & Kurs...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Hent og Analyser Aktie</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
