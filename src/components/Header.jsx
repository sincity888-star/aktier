import React from "react";
import { TrendingUp, RefreshCw, Smartphone, Monitor, Plus, ArrowLeft, Sun, Moon, LogOut } from "lucide-react";

export function Header({
  activeTab,
  onGoBack,
  onSelectTab,
  currency,
  onToggleCurrency,
  theme,
  onToggleTheme,
  isPhoneMode,
  onTogglePhoneMode,
  onOpenAddModal,
  onResetData,
  marketStatus,
  isLiveUpdating,
  onToggleLive
}) {
  const isSubPage = activeTab !== "dashboard";

  const navItems = [
    { id: "dashboard", label: "Overblik" },
    { id: "radar", label: "🎯 Radar (2-3%)" },
    { id: "market", label: "Marked" },
    { id: "dividends", label: "Udbytte" },
    { id: "history", label: "Historik" }
  ];

  return (
    <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/95 backdrop-blur-md sticky top-0 z-30 shadow-sm">
      {/* Top Bar */}
      <div className="px-3 pt-2.5 pb-2 flex items-center justify-between">
        {/* Brand & Market status ELLER Tilbage-knap */}
        <div className="flex items-center gap-2">
          {isSubPage ? (
            <button
              type="button"
              onClick={onGoBack}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 active:scale-95 transition-all shadow-sm cursor-pointer"
              title="Gå tilbage til Overblik"
            >
              <ArrowLeft className="w-4 h-4 text-blue-400 stroke-[2.5]" />
              <span>Tilbage</span>
            </button>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-[var(--text-main)]">
                {isSubPage ? (activeTab === "radar" ? "Sincity Radar" : activeTab === "holdings" ? "Beholdning" : activeTab === "market" ? "Marked" : activeTab === "dividends" ? "Udbytte" : "Historik") : "Sincity Aktie Radar"}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">PRO</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
              <span 
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isLiveUpdating 
                    ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" 
                    : (marketStatus?.isOpen ? "bg-emerald-500" : "bg-rose-500")
                }`} 
              />
              <button 
                type="button"
                onClick={onToggleLive}
                title="Klik for at slå test-simulering til eller fra"
                className="hover:text-[var(--text-secondary)] transition-colors flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>
                  {isLiveUpdating 
                    ? "🧪 Test-simulering aktiv" 
                    : (marketStatus?.message || "Børs lukket (Kurser frosset)")}
                </span>
                <span className="text-[9px] text-blue-400 underline ml-0.5">
                  {isLiveUpdating ? "(stop)" : "(test)"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          {/* Valuta vælger */}
          <button
            type="button"
            onClick={onToggleCurrency}
            className="flex items-center px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[11px] font-semibold hover:border-slate-600 transition-all active:scale-95 cursor-pointer"
            title="Skift mellem DKK og USD"
          >
            <span className={currency === "DKK" ? "text-blue-500 font-bold" : "text-[var(--text-muted)]"}>DKK</span>
            <span className="mx-0.5 text-[var(--text-faint)]">/</span>
            <span className={currency === "USD" ? "text-emerald-500 font-bold" : "text-[var(--text-muted)]"}>USD</span>
          </button>

          {/* Lyst / Mørkt tema skifter */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-7 h-7 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white items-center justify-center transition-all flex active:scale-90 shadow-sm cursor-pointer"
            title={theme === "light" ? "Skift til mørkt tema" : "Skift til lyst tema"}
          >
            {theme === "light" ? (
              <Moon className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>

          {/* Log Ud knap */}
          <button
            type="button"
            onClick={() => {
              import('../utils/firebase').then(({ auth, signOut }) => {
                signOut(auth).catch(err => console.error("Logout fejl:", err));
              });
            }}
            className="w-7 h-7 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/10 items-center justify-center transition-all flex active:scale-90 shadow-sm cursor-pointer ml-1"
            title="Log ud"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

          {/* Hurtig Tilføj knap */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-600/30 transition-transform active:scale-90 cursor-pointer"
            title="Tilføj ny handel"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Desktop Device Mode Toggle */}
          <button
            type="button"
            onClick={onTogglePhoneMode}
            className="hidden sm:flex w-7 h-7 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white items-center justify-center transition-colors cursor-pointer"
            title={isPhoneMode ? "Skift til bred visning" : "Skift til mobilformat"}
          >
            {isPhoneMode ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          </button>

          {/* Nulstil demo-data */}
          <button
            type="button"
            onClick={onResetData}
            className="w-7 h-7 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-rose-400 items-center justify-center transition-colors flex cursor-pointer"
            title="Nulstil til standard porteføljedata"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Hurtig Menu Tab-Strip i toppen (altid synlig på mobil) */}
      {onSelectTab && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-card)]/50 border-t border-[var(--border-subtle)] overflow-x-auto no-scrollbar">
          {navItems.map(item => {
            const isItemActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`top-tab-${item.id}`}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer select-none active:scale-95 ${
                  isItemActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-[var(--bg-card)] text-slate-700 dark:text-slate-300 hover:text-blue-500 border border-[var(--border-subtle)]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
