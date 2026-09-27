import React, { useState } from "react";
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
  Sliders,
  DollarSign,
  RefreshCw,
  Edit3,
  CheckCircle2
} from "lucide-react";
import { formatCurrency, formatPercent } from "../utils/calculations";
import { MAERSK_DAILY_DATA_90D, MAERSK_STATISTICS } from "../data/maerskAnalysis";
import { playAlertChime, requestNotificationPermission } from "../utils/audioAlert";
import { fetchLiveMaerskData } from "../utils/stockApi";

export function MaerskRadar({
  maerskStock,
  currency,
  alertConfig,
  onUpdateAlertConfig,
  onOpenTradeModal,
  onUpdateStockPrice
}) {
  const currentPrice = maerskStock ? maerskStock.currentPrice : MAERSK_STATISTICS.currentPrice;
  const isUp = (maerskStock?.change || 0) >= 0;

  // Live synkronisering tilstande
  const [isSyncing, setIsSyncing] = useState(false);
  const [dataSourceInfo, setDataSourceInfo] = useState("Nasdaq Copenhagen (Yahoo Finance)");
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editPriceInput, setEditPriceInput] = useState(currentPrice);

  // Swing-trade kalkulator states
  const [calcPrice, setCalcPrice] = useState(currentPrice);
  const [calcShares, setCalcShares] = useState(2);
  const [targetPct, setTargetPct] = useState(3.0); // 3% stigning
  const [stopLossPct, setStopLossPct] = useState(2.0); // 2% fald
  const [activeTab, setActiveTab] = useState("calculator"); // 'calculator' | 'analysis' | 'alerts'

  // Håndter live synkronisering med Yahoo Finance / Nasdaq
  const handleLiveSync = async () => {
    setIsSyncing(true);
    try {
      const data = await fetchLiveMaerskData();
      if (data && data.currentPrice) {
        if (onUpdateStockPrice) {
          onUpdateStockPrice(data.currentPrice);
        }
        setCalcPrice(data.currentPrice);
        setDataSourceInfo(`${data.source} · ${data.lastUpdated}`);
      }
    } catch (err) {
      console.error("Sync fejl", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleSaveCustomPrice = (e) => {
    e.preventDefault();
    const val = Number(editPriceInput);
    if (val > 0) {
      if (onUpdateStockPrice) {
        onUpdateStockPrice(val);
      }
      setCalcPrice(val);
      setIsEditingPrice(false);
    }
  };

  // Beregninger for kalkulator
  const buyCost = calcPrice * calcShares;
  const targetSellPrice = Math.round(calcPrice * (1 + targetPct / 100));
  const targetSellTotal = targetSellPrice * calcShares;
  const brokerageFee = 29 * 2; // 29 kr. køb + 29 kr. salg
  const grossProfit = targetSellTotal - buyCost;
  const netProfit = grossProfit - brokerageFee;
  const netProfitPct = buyCost > 0 ? (netProfit / buyCost) * 100 : 0;

  const stopLossPrice = Math.round(calcPrice * (1 - stopLossPct / 100));
  const stopLossTotal = stopLossPrice * calcShares;
  const stopLossLoss = buyCost - stopLossTotal + brokerageFee;

  // Referencekurs difference
  const refPrice = alertConfig.referencePrice || currentPrice;
  const diffFromRef = currentPrice - refPrice;
  const diffFromRefPct = refPrice > 0 ? (diffFromRef / refPrice) * 100 : 0;

  // Interaktiv 90-dages SVG graf
  const dataPoints = MAERSK_DAILY_DATA_90D;
  const minPrice = Math.min(...dataPoints.map(d => d.low));
  const maxPrice = Math.max(...dataPoints.map(d => d.high));
  const range = maxPrice - minPrice || 1;

  const svgWidth = 360;
  const svgHeight = 150;
  const padX = 12;
  const padY = 16;
  const effW = svgWidth - padX * 2;
  const effH = svgHeight - padY * 2;

  const coords = dataPoints.map((d, i) => {
    const x = padX + (i / (dataPoints.length - 1)) * effW;
    const y = padY + effH - ((d.close - minPrice) / range) * effH;
    return { x, y, ...d };
  });

  const linePath = coords.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pt.x},${pt.y}`;
  }, "");

  return (
    <div className="px-4 py-3 space-y-4 animate-fade-in">
      {/* Hero Kort: Mærsk B Oversigt */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-950/40 via-[var(--bg-card)] to-[var(--bg-card-elevated)] border border-blue-500/30 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-700/30">
              <Anchor className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-extrabold text-base text-white">Mærsk B</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  OMXC25
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">A.P. Møller - Mærsk B (MAERSK-B)</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Live synkroniser knap */}
            <button
              onClick={handleLiveSync}
              disabled={isSyncing}
              className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 flex items-center gap-1 text-xs font-semibold active:scale-95 transition-all"
              title="Hent seneste lukkekurs / livekurs fra Nasdaq Copenhagen"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-blue-400" : ""}`} />
              <span className="hidden xs:inline">{isSyncing ? "Henter..." : "Live Sync"}</span>
            </button>

            {/* Alarm aktiv badge */}
            <button
              onClick={() => {
                requestNotificationPermission();
                onUpdateAlertConfig({ ...alertConfig, isEnabled: !alertConfig.isEnabled });
              }}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
                alertConfig.isEnabled
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/20"
                  : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-muted)]"
              }`}
            >
              {alertConfig.isEnabled ? (
                <>
                  <BellRing className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                  <span>Overvåger</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Slået fra</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Datakilde status bar */}
        <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-blue-950/40 border border-blue-500/20 text-[10px] text-blue-300/90 font-medium">
          <span className="truncate">📡 {dataSourceInfo}</span>
          <span className="font-mono text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Verificeret kurs
          </span>
        </div>

        {/* Kursdisplay & bevægelse fra reference */}
        <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-medium">
              <span>Børskurs (Nasdaq CPH)</span>
              <button
                onClick={() => {
                  setEditPriceInput(currentPrice);
                  setIsEditingPrice(e => !e);
                }}
                className="text-blue-400 hover:text-white"
                title="Tilpas kurs manuelt hvis din mægler viser en anden kurs"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>

            {isEditingPrice ? (
              <form onSubmit={handleSaveCustomPrice} className="flex items-center gap-1.5 mt-1">
                <input
                  type="number"
                  step="10"
                  value={editPriceInput}
                  onChange={(e) => setEditPriceInput(e.target.value)}
                  className="w-28 px-2 py-1 rounded-lg bg-[var(--bg-input)] border border-blue-500 text-sm font-mono font-bold text-white"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold"
                >
                  Gem
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPrice(false)}
                  className="px-2 py-1 text-xs text-[var(--text-muted)]"
                >
                  Annuller
                </button>
              </form>
            ) : (
              <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                {currentPrice.toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr.
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-[11px] text-[var(--text-muted)] font-medium">Fra din reference ({refPrice} kr.)</div>
            <div 
              className="text-sm font-bold font-mono tabular-nums flex items-center justify-end gap-1 mt-0.5"
              style={{ color: diffFromRef >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}
            >
              {diffFromRef >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{diffFromRef >= 0 ? "+" : ""}{diffFromRef.toFixed(0)} kr. ({formatPercent(diffFromRefPct)})</span>
            </div>
          </div>
        </div>

        {/* Nulstil referencekurs knap */}
        <div className="flex items-center justify-between mt-3 pt-2 text-xs border-t border-[var(--border-subtle)]">
          <span className="text-[var(--text-muted)] text-[11px]">Referencekurs til 2-3% alarmer</span>
          <button
            onClick={() => onUpdateAlertConfig({ ...alertConfig, referencePrice: currentPrice })}
            className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 active:scale-95 transition-transform"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Sæt reference til nuværende ({currentPrice} kr.)</span>
          </button>
        </div>
      </div>

      {/* Faner: Kalkulator / 3 Måneders Analyse / Alarmopsætning */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs font-bold">
        <button
          onClick={() => setActiveTab("calculator")}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "calculator"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-[var(--text-muted)] hover:text-white"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>2-3% Handel</span>
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
          <span>3 Mdr. Data</span>
        </button>

        <button
          onClick={() => setActiveTab("alerts")}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "alerts"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-[var(--text-muted)] hover:text-white"
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>Alarmer</span>
        </button>
      </div>

      {/* 1. KALKULATOR FANE */}
      {activeTab === "calculator" && (
        <div className="space-y-3 animate-fade-in">
          <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>2-3% Dip-Køb & Profit-Salg Kalkulator</span>
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
                  step="10"
                  value={calcPrice}
                  onChange={(e) => setCalcPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] focus:border-blue-500 font-mono text-sm font-bold text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Antal aktier (stk.)
                </label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCalcShares(s => Math.max(1, s - 1))}
                    className="w-8 h-8 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] text-white font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={calcShares}
                    onChange={(e) => setCalcShares(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] text-center font-mono text-sm font-bold text-white"
                  />
                  <button
                    onClick={() => setCalcShares(s => s + 1)}
                    className="w-8 h-8 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] text-white font-bold"
                  >
                    +
                  </button>
                </div>
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
                  {targetSellPrice.toLocaleString("da-DK")} kr.
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
                  {stopLossPrice.toLocaleString("da-DK")} kr.
                </div>
              </div>
              <div className="text-right">
                <span className="text-[var(--text-muted)]">Maks risiko:</span>
                <div className="text-rose-400 font-mono font-bold mt-0.5">
                  -{stopLossLoss.toLocaleString("da-DK", { maximumFractionDigits: 0 })} kr.
                </div>
              </div>
            </div>

            {/* Handling: Udfør handel med disse værdier */}
            <button
              onClick={() => onOpenTradeModal("maersk", "BUY")}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 active:scale-98 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Gå til Køb af Mærsk B</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. 3-MÅNEDERS ANALYSE FANE */}
      {activeTab === "analysis" && (
        <div className="space-y-3 animate-fade-in">
          {/* Volatilitets-statistik grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Gns. Dagsspænd</div>
              <div className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5">
                {MAERSK_STATISTICS.avgDailySpreadPct}%
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Ca. 295 kr. sving/dag</div>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Ugentlig Svingning</div>
              <div className="text-lg font-extrabold text-blue-400 font-mono mt-0.5">
                {MAERSK_STATISTICS.avgWeeklySwingPct}%
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Ca. 550 kr. sving/uge</div>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Dage med &gt;2% Spænd</div>
              <div className="text-lg font-extrabold text-amber-400 font-mono mt-0.5">
                90%
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">46 ud af 51 handelsdage</div>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">2-3% Muligheder</div>
              <div className="text-lg font-extrabold text-purple-400 font-mono mt-0.5">
                14 gange
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Over de seneste 3 mdr.</div>
            </div>
          </div>

          {/* 90-Dages Historisk Graf */}
          <div className="p-3.5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Mærsk B Kursforløb (Sidste 90 Dage)</span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">Juli – September 2026</span>
            </div>

            <div className="w-full h-[150px]">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="maersk-90d-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Støtte & Modstandslinjer */}
                <line
                  x1={padX}
                  y1={padY + effH - ((MAERSK_STATISTICS.resistanceLevel - minPrice) / range) * effH}
                  x2={svgWidth - padX}
                  y2={padY + effH - ((MAERSK_STATISTICS.resistanceLevel - minPrice) / range) * effH}
                  stroke="rgba(244, 63, 94, 0.35)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <line
                  x1={padX}
                  y1={padY + effH - ((MAERSK_STATISTICS.supportLevel - minPrice) / range) * effH}
                  x2={svgWidth - padX}
                  y2={padY + effH - ((MAERSK_STATISTICS.supportLevel - minPrice) / range) * effH}
                  stroke="rgba(16, 185, 129, 0.35)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />

                <path
                  d={`${linePath} L ${coords[coords.length - 1].x},${svgHeight} L ${coords[0].x},${svgHeight} Z`}
                  fill="url(#maersk-90d-grad)"
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
              <span className="text-emerald-400">Støtte: {MAERSK_STATISTICS.supportLevel} kr.</span>
              <span>Aktuel: {currentPrice} kr.</span>
              <span className="text-rose-400">Modstand: {MAERSK_STATISTICS.resistanceLevel} kr.</span>
            </div>
          </div>

          {/* Konklusion */}
          <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/25 text-xs text-slate-300 space-y-1.5">
            <div className="font-bold text-blue-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Konklusion på din 2-3% strategi</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Mærsk B er en af de mest volatile aktier på C25. Med et gennemsnitligt dagsspænd på <strong className="text-white">2,58%</strong> er der statistisk set potentiale for en fuldført 2-3% gevinstcyklus næsten hver eneste uge.
            </p>
          </div>
        </div>
      )}

      {/* 3. ALARM INDSTILLINGER FANE */}
      {activeTab === "alerts" && (
        <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-emerald-400" />
              <span>Mærsk B Kursalarm Regler</span>
            </div>
            <button
              onClick={() => playAlertChime("buy")}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
              title="Test notifikationslyd"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Test Lyd</span>
            </button>
          </div>

          {/* Fald-alarm (Købssignal) */}
          <div className="p-3.5 rounded-2xl bg-blue-950/25 border border-blue-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-300 flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-blue-400" />
                <span>Købssignal: Alarm ved fald</span>
              </span>
              <span className="font-mono font-bold text-blue-300">
                {(refPrice * (1 - alertConfig.dropPctThreshold / 100)).toFixed(0)} kr.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={alertConfig.dropPctThreshold}
                onChange={(e) => onUpdateAlertConfig({ ...alertConfig, dropPctThreshold: Number(e.target.value) })}
                className="flex-1 accent-blue-500"
              />
              <span className="w-14 text-right font-mono font-extrabold text-sm text-white">
                -{alertConfig.dropPctThreshold.toFixed(1)}%
              </span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              Giver besked, når Mærsk B falder {alertConfig.dropPctThreshold}% under referencekursen ({refPrice} kr.).
            </div>
          </div>

          {/* Stignings-alarm (Salgs-signal) */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-300 flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Salgssignal: Alarm ved stigning</span>
              </span>
              <span className="font-mono font-bold text-emerald-300">
                {(refPrice * (1 + alertConfig.risePctThreshold / 100)).toFixed(0)} kr.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1.0"
                max="6.0"
                step="0.5"
                value={alertConfig.risePctThreshold}
                onChange={(e) => onUpdateAlertConfig({ ...alertConfig, risePctThreshold: Number(e.target.value) })}
                className="flex-1 accent-emerald-500"
              />
              <span className="w-14 text-right font-mono font-extrabold text-sm text-white">
                +{alertConfig.risePctThreshold.toFixed(1)}%
              </span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              Giver besked, når Mærsk B stiger {alertConfig.risePctThreshold}% over referencekursen ({refPrice} kr.).
            </div>
          </div>

          {/* Lyd & Browser Notification Toggles */}
          <div className="space-y-2 pt-1 border-t border-[var(--border-subtle)] text-xs">
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-slate-300">Afspil lyd ved alarm</span>
              <input
                type="checkbox"
                checked={alertConfig.soundEnabled}
                onChange={(e) => onUpdateAlertConfig({ ...alertConfig, soundEnabled: e.target.checked })}
                className="w-4 h-4 accent-blue-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-slate-300">Browser push-notifikation</span>
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20"
              >
                Giv Tilladelse
              </button>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
