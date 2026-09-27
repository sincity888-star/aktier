import React from "react";
import { TrendingUp, RefreshCw, Smartphone, Monitor, Plus, ArrowLeft, Sun, Moon } from "lucide-react";

export function Header({
  activeTab,
  onGoBack,
  currency,
  onToggleCurrency,
  theme,
  onToggleTheme,
  isPhoneMode,
  onTogglePhoneMode,
  onOpenAddModal,
  onResetData,
  isLiveUpdating,
  onToggleLive
}) {
  const isSubPage = activeTab !== "dashboard";

  return (
    <header className="px-4 pt-3 pb-3 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/90 backdrop-blur-md sticky top-0 z-30">
      {/* Brand & Market status ELLER Tilbage-knap */}
      <div className="flex items-center gap-2.5">
        {isSubPage ? (
          <button
            onClick={onGoBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 active:scale-95 transition-all shadow-sm"
            title="Gå tilbage til Overblik"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400 stroke-[2.5]" />
            <span>← Tilbage</span>
          </button>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
        )}

        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-tight text-white">
              {isSubPage ? (activeTab === "radar" ? "Sincity Radar" : activeTab === "holdings" ? "Beholdning" : activeTab === "market" ? "Marked" : activeTab === "dividends" ? "Udbytte" : "Historik") : "Sincity Aktie Radar"}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">PRO</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
            <span 
              className={`w-1.5 h-1.5 rounded-full ${isLiveUpdating ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} 
            />
            <button 
              onClick={onToggleLive}
              title="Slå live kurs-simulering til/fra"
              className="hover:text-[var(--text-secondary)] transition-colors flex items-center gap-1"
            >
              <span>{isLiveUpdating ? "Live børskurser" : "Kurser frosset"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Valuta vælger */}
        <button
          onClick={onToggleCurrency}
          className="flex items-center px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs font-semibold hover:border-slate-600 transition-all active:scale-95"
          title="Skift mellem DKK og USD"
        >
          <span className={currency === "DKK" ? "text-blue-400 font-bold" : "text-[var(--text-muted)]"}>DKK</span>
          <span className="mx-0.5 text-[var(--text-faint)]">/</span>
          <span className={currency === "USD" ? "text-emerald-400 font-bold" : "text-[var(--text-muted)]"}>USD</span>
        </button>

        {/* Lyst / Mørkt tema skifter */}
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white items-center justify-center transition-all flex active:scale-90 shadow-sm"
          title={theme === "light" ? "Skift til mørkt tema" : "Skift til lyst tema"}
        >
          {theme === "light" ? (
            <Moon className="w-4 h-4 text-blue-600" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Hurtig Tilføj knap i top på desktop */}
        <button
          onClick={onOpenAddModal}
          className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-600/30 transition-transform active:scale-90"
          title="Tilføj ny handel"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Desktop Device Mode Toggle */}
        <button
          onClick={onTogglePhoneMode}
          className="hidden sm:flex w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white items-center justify-center transition-colors"
          title={isPhoneMode ? "Skift til bred visning" : "Skift til mobilformat"}
        >
          {isPhoneMode ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
        </button>

        {/* Nulstil demo-data */}
        <button
          onClick={onResetData}
          className="w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-rose-400 items-center justify-center transition-colors flex"
          title="Nulstil til standard porteføljedata"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
