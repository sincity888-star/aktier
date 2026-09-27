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
  ArrowLeft
} from "lucide-react";
import { formatCurrency, formatPercent } from "../utils/calculations";
import { playAlertChime, requestNotificationPermission } from "../utils/audioAlert";
import { fetchLiveStockData, calculateVolatilityStats } from "../utils/stockApi";
import analyzedStocksBackup from "../data/analyzedStocks.json";

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

  // SVG Graf data
  const dataPoints = stockDays.length > 0 ? stockDays : [
    { close: currentPrice * 0.92 },
    { close: currentPrice * 0.95 },
    { close: currentPrice * 0.98 },
    { close: currentPrice * 0.94 },
    { close: currentPrice * 1.02 },
    { close: currentPrice }
  ];
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

        {/* Børskurs & Reference */}
        <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-medium">
              <span>Børskurs</span>
              <button
                onClick={() => {
                  setEditPriceInput(currentPrice);
                  setIsEditingPrice(e => !e);
                }}
                className="text-blue-400 hover:text-white"
                title="Tilpas kurs manuelt"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>

            {isEditingPrice ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  step="0.1"
                  value={editPriceInput}
                  onChange={(e) => setEditPriceInput(e.target.value)}
                  className="w-28 px-2 py-1 rounded-lg bg-[var(--bg-input)] border border-blue-500 text-sm font-mono font-bold text-white"
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
                  className="px-2 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold"
                >
                  Gem
                </button>
              </div>
            ) : (
              <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                {currentPrice.toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr.
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-[11px] text-[var(--text-muted)] font-medium">Fra reference ({refPrice} kr.)</div>
            <div 
              className="text-sm font-bold font-mono tabular-nums flex items-center justify-end gap-1 mt-0.5"
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

      {/* 2. FREKVENS- OG 3-MÅNEDERS ANALYSE FANE */}
      {activeTab === "analysis" && (
        <div className="space-y-3 animate-fade-in">
          {/* Egnetheds-banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-blue-300">2-3% Swing Egnethed</div>
              <div className="text-xs font-bold text-white mt-0.5">{stats.suitabilityText}</div>
            </div>
            <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-extrabold border border-emerald-500/30">
              Gns. {stats.avgDailySpreadPct}% / dag
            </span>
          </div>

          {/* Volatilitets-statistik grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Gns. Dagsspænd</div>
              <div className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5">
                {stats.avgDailySpreadPct}%
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Forskel top vs. bund</div>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Dage med &ge; 2% Spænd</div>
              <div className="text-lg font-extrabold text-blue-400 font-mono mt-0.5">
                {stats.pctAbove2}%
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{stats.daysAbove2} af {stats.totalDays} dage</div>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Dage med &ge; 3% Spænd</div>
              <div className="text-lg font-extrabold text-amber-400 font-mono mt-0.5">
                {stats.pctAbove3}%
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{stats.daysAbove3} af {stats.totalDays} dage</div>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Ugentlig Frekvens</div>
              <div className="text-lg font-extrabold text-purple-400 font-mono mt-0.5">
                {stats.pctAbove2 >= 85 ? "2-3 gange/uge" : "1-2 gange/uge"}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Oplagte swing-muligheder</div>
            </div>
          </div>

          {/* 90-Dages Graf */}
          <div className="p-3.5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>3 Måneders Kursforløb ({currentStock.symbol})</span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">{stockDays.length} handelsdage</span>
            </div>

            <div className="w-full h-[145px]">
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id={`grad-${selectedStockId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <path
                  d={`${linePath} L ${coords[coords.length - 1].x},${svgH} L ${coords[0].x},${svgH} Z`}
                  fill={`url(#grad-${selectedStockId})`}
                />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono mt-1 px-1">
              <span>Min: {minPrice.toLocaleString("da-DK")} kr.</span>
              <span>Aktuel: {currentPrice.toLocaleString("da-DK")} kr.</span>
              <span>Max: {maxPrice.toLocaleString("da-DK")} kr.</span>
            </div>
          </div>
        </div>
      )}

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
