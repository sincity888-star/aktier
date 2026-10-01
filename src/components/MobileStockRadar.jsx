import React, { useState, useEffect } from "react";
import { 
  TrendingUp, TrendingDown, BellRing, Target, Activity, Check, ChevronDown, RefreshCw, Plus, ArrowLeft, Mail, ChevronRight, X, Settings2
} from "lucide-react";
import { playAlertChime, requestNotificationPermission } from "../utils/audioAlert";
import { fetchLiveStockData } from "../utils/stockApi";
import { sendStockAlertEmail } from "../utils/emailAlert";
import analyzedStocksBackup from "../data/analyzedStocks.json";
import { calculateDynamicInsight } from "./StockRadar"; // Genbrug AI motoren

export function MobileStockRadar({
  stocks,
  onAddNewStock,
  currency,
  alertConfigs,
  onUpdateAlertConfig,
  onUpdateStockPrice,
  onGoBack
}) {
  const [selectedStockId, setSelectedStockId] = useState(() => stocks[0]?.id || "zealand");
  const [activeTab, setActiveTab] = useState("radar"); // 'radar' | 'analyse' | 'alarm'
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Modals
  const [isAddTickerOpen, setIsAddTickerOpen] = useState(false);
  const [newTickerInput, setNewTickerInput] = useState("");

  const currentStock = stocks.find(s => s.id === selectedStockId) || stocks[0];
  const currentPrice = currentStock.currentPrice;
  const currentAlert = alertConfigs[selectedStockId] || { isEnabled: true, dropPctThreshold: 2.0, risePctThreshold: 3.0, mode: "BUY" };
  const backupData = analyzedStocksBackup[selectedStockId];
  const stats = backupData?.stats || { avgDailySpreadPct: 2.5 };
  
  const refPrice = currentAlert.referencePrice || currentPrice;
  const isUp = (currentStock.changePercent || 0) > 0;
  const isDown = (currentStock.changePercent || 0) < 0;

  const handleLiveSync = async () => {
    setIsSyncing(true);
    try {
      const liveData = await fetchLiveStockData(selectedStockId);
      if (liveData) onUpdateStockPrice(selectedStockId, liveData);
    } catch (err) {}
    setIsSyncing(false);
  };

  const aiInsight = calculateDynamicInsight(
    currentStock,
    stats,
    "daily",
    backupData?.validDays || []
  );

  return (
    <div className="flex flex-col h-full bg-[var(--bg-main)] text-[var(--text-main)] max-w-md mx-auto relative overflow-hidden animate-fade-in font-sans">
      
      {/* 1. HORIZONTAL WATCHLIST (SWIPEABLE) */}
      <div className="px-4 pt-4 pb-2">
        {onGoBack && (
          <button onClick={onGoBack} className="flex items-center gap-1.5 text-blue-400 font-bold text-xs mb-3 active:scale-95 transition-all">
            <ArrowLeft className="w-4 h-4" /> Tilbage
          </button>
        )}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {stocks.map(stk => {
            const isSel = stk.id === selectedStockId;
            const pct = stk.changePercent || 0;
            return (
              <button
                key={stk.id}
                onClick={() => setSelectedStockId(stk.id)}
                className={`min-w-[100px] p-3 rounded-2xl flex flex-col gap-1.5 flex-shrink-0 transition-all border ${
                  isSel 
                    ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30 scale-105" 
                    : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-muted)]"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`text-[10px] font-extrabold ${isSel ? 'text-blue-100' : ''}`}>{stk.symbol}</span>
                  <span className={`text-[10px] font-bold ${isSel ? 'text-white' : pct > 0 ? 'text-emerald-400' : pct < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
                  </span>
                </div>
                <span className={`font-mono text-[13px] font-bold self-start ${isSel ? 'text-white' : 'text-[var(--text-main)]'}`}>
                  {stk.currentPrice.toLocaleString("da-DK")}
                </span>
              </button>
            );
          })}
          <button onClick={() => setIsAddTickerOpen(true)} className="min-w-[50px] h-[72px] rounded-2xl bg-[var(--bg-card)] border border-dashed border-[var(--border-subtle)] flex items-center justify-center text-blue-400 hover:bg-blue-500/10 transition-all">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. HERO HEADER */}
      <div className="px-6 py-4 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-extrabold tracking-tight font-mono mb-1">
          {currentStock.currentPrice.toLocaleString("da-DK")}
        </h1>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-semibold text-[var(--text-secondary)]">{currentStock.name}</span>
          <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${isUp ? 'bg-emerald-500/15 text-emerald-400' : isDown ? 'bg-red-500/15 text-red-400' : 'bg-gray-500/15 text-gray-400'}`}>
            {isUp ? '▲' : isDown ? '▼' : '▬'} {Math.abs(currentStock.changePercent || 0).toFixed(2)}%
          </span>
        </div>
        
        {/* Sync & Mini status */}
        <div className="flex items-center gap-3">
          <button onClick={handleLiveSync} disabled={isSyncing} className="p-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-muted)] active:scale-90 transition-all">
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-blue-400" : ""}`} />
          </button>
          <div className="px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center gap-2 text-xs font-bold">
            <div className={`w-2 h-2 rounded-full ${currentAlert.isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className={currentAlert.isEnabled ? 'text-emerald-400' : 'text-[var(--text-muted)]'}>
              {currentAlert.isEnabled ? (currentAlert.mode === "BUY" ? "KØBS-ALARM AKTIV" : "SALGS-ALARM AKTIV") : "ALARM SLUKKET"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. SEGMENTED TABS */}
      <div className="px-4 mb-4">
        <div className="flex p-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] shadow-inner">
          {['radar', 'analyse', 'alarm'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-[var(--text-muted)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 4. TAB CONTENT AREA */}
      <div className="flex-1 px-4 overflow-y-auto pb-20 no-scrollbar">
        
        {/* --- RADAR TAB --- */}
        {activeTab === "radar" && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col items-center justify-center text-center shadow-md">
              <span className="text-[10px] uppercase font-bold text-blue-400 mb-2 tracking-widest">Sincity Radar Score</span>
              <div className="text-5xl font-extrabold text-white bg-clip-text text-transparent bg-gradient-to-br from-blue-400 to-emerald-400 mb-2">
                {aiInsight.direction === "UP" ? "84" : aiInsight.direction === "DOWN" ? "21" : "50"}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${aiInsight.direction === "UP" ? 'bg-emerald-500/20 text-emerald-400' : aiInsight.direction === "DOWN" ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {aiInsight.forecast}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">Momentum</span>
                <span className="font-bold text-sm text-[var(--text-main)]">{aiInsight.direction === "UP" ? "STÆRK ↗" : "SVAG ↘"}</span>
              </div>
              <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">Volatilitet</span>
                <span className="font-bold text-sm text-blue-400">{stats?.avgDailySpreadPct || 2.5}%/dag</span>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <h3 className="text-xs font-extrabold text-blue-400 uppercase mb-2">Konklusion</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {aiInsight.rationale}
              </p>
            </div>
          </div>
        )}

        {/* --- ANALYSE TAB --- */}
        {activeTab === "analyse" && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 rounded-3xl bg-blue-900/10 border border-blue-500/20">
              <h3 className="text-xs font-extrabold text-blue-400 mb-3 flex items-center gap-2"><Activity className="w-4 h-4"/> Kvantitativ Historik (3 Mdr)</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-xs text-[var(--text-muted)]">Gns. Dagsspænd</span>
                  <span className="font-mono text-sm font-bold text-[var(--text-main)]">{stats.avgDailySpreadPct}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-xs text-[var(--text-muted)]">Dage med &gt;2% fald</span>
                  <span className="font-mono text-sm font-bold text-[var(--text-main)]">{stats.distinctDipsOver2Pct} dage</span>
                </div>
                <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-xs text-[var(--text-muted)]">Dage med &gt;3% stigning</span>
                  <span className="font-mono text-sm font-bold text-[var(--text-main)]">{stats.distinctReboundsOver3Pct} dage</span>
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-4 leading-relaxed">
                {currentStock.name} svinger i gennemsnit {stats.avgDailySpreadPct}% pr. dag. Baseret på dette er aktien <strong>{stats.suitabilityText?.toLowerCase() || 'velegnet'}</strong> til swing-trading.
              </p>
            </div>
          </div>
        )}

        {/* --- ALARM TAB --- */}
        {activeTab === "alarm" && (
          <div className="space-y-4 animate-fade-in">
            {/* Mode Switcher */}
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateAlertConfig(selectedStockId, { ...currentAlert, mode: "BUY" })}
                className={`flex-1 py-4 rounded-3xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                  currentAlert.mode !== "SELL" 
                    ? "bg-blue-600/10 border-blue-500 text-blue-400" 
                    : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-muted)]"
                }`}
              >
                <TrendingDown className="w-6 h-6" />
                <span className="font-extrabold text-sm tracking-wide">KØB PÅ DIP</span>
              </button>
              <button
                onClick={() => onUpdateAlertConfig(selectedStockId, { ...currentAlert, mode: "SELL" })}
                className={`flex-1 py-4 rounded-3xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                  currentAlert.mode === "SELL" 
                    ? "bg-emerald-600/10 border-emerald-500 text-emerald-400" 
                    : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-muted)]"
                }`}
              >
                <TrendingUp className="w-6 h-6" />
                <span className="font-extrabold text-sm tracking-wide">SÆLG PÅ TOP</span>
              </button>
            </div>

            {/* Slider Area */}
            <div className={`p-6 rounded-3xl border ${currentAlert.mode !== "SELL" ? "bg-blue-900/10 border-blue-500/20" : "bg-emerald-900/10 border-emerald-500/20"}`}>
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-bold text-[var(--text-main)]">Alarm Grænse</span>
                <span className={`text-2xl font-mono font-extrabold ${currentAlert.mode !== "SELL" ? "text-blue-400" : "text-emerald-400"}`}>
                  {currentAlert.mode !== "SELL" ? "-" : "+"}{currentAlert.mode !== "SELL" ? currentAlert.dropPctThreshold.toFixed(1) : currentAlert.risePctThreshold.toFixed(1)}%
                </span>
              </div>
              
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.1"
                value={currentAlert.mode !== "SELL" ? currentAlert.dropPctThreshold : currentAlert.risePctThreshold}
                onChange={(e) => onUpdateAlertConfig(selectedStockId, { ...currentAlert, [currentAlert.mode !== "SELL" ? "dropPctThreshold" : "risePctThreshold"]: Number(e.target.value) })}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${currentAlert.mode !== "SELL" ? "accent-blue-500 bg-blue-900/30" : "accent-emerald-500 bg-emerald-900/30"}`}
              />

              {/* Quant Warning */}
              {(currentAlert.mode !== "SELL" ? currentAlert.dropPctThreshold : currentAlert.risePctThreshold) > (stats?.avgDailySpreadPct || 2.5) * 1.2 && (
                <div className="mt-4 p-3 rounded-xl bg-amber-900/20 border border-amber-500/30 flex gap-2">
                  <span className="text-amber-500">⚠️</span>
                  <span className="text-[11px] text-amber-300">
                    Historisk dagsspænd er kun {stats?.avgDailySpreadPct || 2.5}%. Dit mål er statistisk usandsynligt i dag.
                  </span>
                </div>
              )}
            </div>

            {/* Enable/Disable Alarm Toggle */}
            <button
              onClick={() => {
                requestNotificationPermission();
                onUpdateAlertConfig(selectedStockId, { ...currentAlert, isEnabled: !currentAlert.isEnabled });
              }}
              className={`w-full py-4 rounded-full font-extrabold tracking-wide flex justify-center items-center gap-2 transition-all shadow-lg ${
                currentAlert.isEnabled 
                  ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30" 
                  : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30"
              }`}
            >
              <BellRing className="w-5 h-5" />
              {currentAlert.isEnabled ? "SLUK ALARM" : "TÆND ALARM"}
            </button>

            {/* Advanced Settings Trigger */}
            <button 
              onClick={() => setIsAdvancedOpen(true)}
              className="w-full py-4 flex items-center justify-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              <Settings2 className="w-4 h-4" />
              Avancerede Indstillinger
            </button>
          </div>
        )}
      </div>

      {/* 5. BOTTOM SHEET: ADVANCED SETTINGS */}
      {isAdvancedOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--bg-main)] w-full rounded-t-3xl border-t border-[var(--border-subtle)] p-6 shadow-2xl overflow-y-auto max-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold">Avancerede Indstillinger</h3>
              <button onClick={() => setIsAdvancedOpen(false)} className="p-2 rounded-full bg-[var(--bg-card)]">
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Reference Price */}
              <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                <h4 className="text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wide">Reference Kurs</h4>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-lg font-bold">{refPrice.toLocaleString("da-DK")} kr.</span>
                  <button 
                    onClick={() => onUpdateAlertConfig(selectedStockId, { ...currentAlert, referencePrice: currentPrice })}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 font-bold text-xs"
                  >
                    Nulstil til live
                  </button>
                </div>
              </div>

              {/* Sound Test */}
              <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                <h4 className="text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wide">System Lyd</h4>
                <button onClick={playAlertChime} className="px-4 py-2 rounded-lg bg-[var(--border-subtle)] text-[var(--text-main)] font-bold text-xs w-full">
                  🔊 Test Alarm Lyd
                </button>
              </div>

              {/* Email could go here, omitting for brevity to keep clean UX */}
              <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                 <h4 className="text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wide">Email Opsætning</h4>
                 <p className="text-[11px] text-[var(--text-secondary)] mb-3">Email pushes styres nu 100% af Ntfy appen via din daemon. Du behøver ikke indtaste app passwords lokalt i V3.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 6. ADD TICKER MODAL */}
      {isAddTickerOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--bg-main)] w-full rounded-t-3xl border-t border-[var(--border-subtle)] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold">Tilføj Aktie</h3>
              <button onClick={() => setIsAddTickerOpen(false)} className="p-2 rounded-full bg-[var(--bg-card)]">
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>
            <input 
              type="text" 
              placeholder="Indtast Ticker (f.eks. DANSKE)" 
              value={newTickerInput}
              onChange={(e) => setNewTickerInput(e.target.value)}
              className="w-full p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] font-mono text-sm mb-4"
            />
            <button 
              onClick={() => {
                if(newTickerInput) onAddNewStock(newTickerInput);
                setIsAddTickerOpen(false);
              }}
              className="w-full py-4 rounded-xl bg-blue-600 text-white font-extrabold text-sm"
            >
              Tilføj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
