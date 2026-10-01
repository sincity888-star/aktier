import React, { useMemo } from "react";
import { Search, User, TrendingUp, TrendingDown, Activity, Bell, ChevronRight, BarChart2 } from "lucide-react";
import { calculateDynamicInsight } from "./StockRadar";
import analyzedStocksBackup from "../data/analyzedStocks.json";
import { getDanishMarketStatus } from "../utils/calculations";

export function HomeScreen({ stocks, alertConfigs, onSelectStock }) {
  const marketStatus = getDanishMarketStatus();

  // Process all stocks with AI to get their "Radar Score" and category
  const processedStocks = useMemo(() => {
    return stocks.map(stk => {
      const backupData = analyzedStocksBackup[stk.id];
      const stats = backupData?.stats || { avgDailySpreadPct: 2.5 };
      const insight = calculateDynamicInsight(stk, stats, "daily", backupData?.validDays || []);
      
      // Calculate a pseudo radar score based on momentum, spread, and trend
      let baseScore = 50;
      if (insight.direction === "UP") baseScore += 20 + Math.random() * 10;
      if (insight.direction === "DOWN") baseScore -= 10 + Math.random() * 10;
      if (stk.changePercent > 0) baseScore += 5;
      
      return {
        ...stk,
        insight,
        stats,
        radarScore: Math.min(100, Math.max(0, Math.floor(baseScore)))
      };
    }).sort((a, b) => b.radarScore - a.radarScore); // Sort by highest radar score
  }, [stocks]);

  const topOpportunities = processedStocks.slice(0, 3);
  const watchlist = processedStocks.slice(3);

  const activeAlertsCount = Object.values(alertConfigs).filter(a => a.isEnabled).length;

  return (
    <div className="flex-1 bg-[var(--bg-main)] text-[var(--text-main)] overflow-y-auto pb-24 font-sans animate-fade-in no-scrollbar">
      
      {/* 1. HEADER */}
      <header className="px-5 pt-6 pb-4 flex justify-between items-center sticky top-0 bg-[var(--bg-main)]/90 backdrop-blur-xl z-30">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Sincity Radar</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {marketStatus.isOpen ? 'Copenhagen Open' : 'Market Closed'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--border-subtle)] transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <User className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="px-5 space-y-8">

        {/* 2. RADAR PULSE HERO */}
        <section>
          <div className="p-5 rounded-3xl bg-blue-600 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200 mb-2" style={{ color: '#bfdbfe' }}>Radar Pulse</h2>
              <div className="text-3xl font-extrabold mb-4" style={{ color: 'white' }}>{processedStocks.length} Aktier Detekteret</div>
              
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white" style={{ color: 'white' }}>{processedStocks.filter(s => s.insight.direction === "UP").length}</span>
                  <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider" style={{ color: '#bfdbfe' }}>Stærkt Momentum</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white" style={{ color: 'white' }}>{processedStocks.filter(s => s.stats.avgDailySpreadPct >= 2.0).length}</span>
                  <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider" style={{ color: '#bfdbfe' }}>Høj Volatilitet</span>
                </div>
              </div>

              <button className="text-xs font-bold text-white flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity" style={{ color: 'white' }}>
                Se alle signaler <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </section>

        {/* 3. QUICK FILTERS */}
        <section>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {["Alle", "Momentum", "Oversolgt", "Høj Volumen", "Regnskab"].map((filter, i) => (
              <button 
                key={filter}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  i === 0 
                    ? "bg-[var(--text-main)] text-[var(--bg-main)]" 
                    : "bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        {/* 4. TOP RADAR */}
        <section>
          <h2 className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-3">Top Radar</h2>
          <div className="space-y-3">
            {topOpportunities.map(stk => (
              <button 
                key={stk.id}
                onClick={() => onSelectStock(stk.id)}
                className="w-full text-left p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-blue-500/50 transition-all shadow-sm flex flex-col gap-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-extrabold text-base">{stk.symbol}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${stk.changePercent > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {stk.changePercent > 0 ? '+' : ''}{stk.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] font-semibold">{stk.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-extrabold">{stk.currentPrice.toLocaleString("da-DK")}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-bold">DKK</div>
                  </div>
                </div>

                <div className="flex items-stretch gap-3">
                  <div className="w-14 flex flex-col items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <span className="text-xs font-bold text-blue-400 mb-0.5">SCORE</span>
                    <span className="text-xl font-black text-[var(--text-main)]">{stk.radarScore}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <span className="text-xs font-bold text-[var(--text-main)] mb-1 flex items-center gap-1">
                      {stk.insight.direction === "UP" ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500"/> : <TrendingDown className="w-3.5 h-3.5 text-rose-500"/>}
                      {stk.insight.forecast}
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] line-clamp-1">{stk.insight.subtitle}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 5. WATCHLIST */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Min Watchlist</h2>
            <button className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Se Alle</button>
          </div>
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] overflow-hidden">
            {watchlist.map((stk, i) => (
              <button 
                key={stk.id}
                onClick={() => onSelectStock(stk.id)}
                className={`w-full flex justify-between items-center p-4 hover:bg-[var(--border-subtle)]/50 transition-colors ${i !== watchlist.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''}`}
              >
                <div className="flex flex-col text-left">
                  <span className="font-extrabold text-sm">{stk.symbol}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold">{stk.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <BarChart2 className="w-6 h-6 text-[var(--border-subtle)]" />
                  <div className="text-right flex flex-col items-end">
                    <span className="font-mono text-sm font-bold">{stk.currentPrice.toLocaleString("da-DK")}</span>
                    <span className={`text-[10px] font-bold ${stk.changePercent > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {stk.changePercent > 0 ? '+' : ''}{stk.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </button>
            ))}
            {watchlist.length === 0 && (
               <div className="p-6 text-center text-[var(--text-muted)] text-xs font-bold">
                 Ingen aktier i watchlist
               </div>
            )}
          </div>
        </section>

        {/* 6. ACTIVE ALERTS */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Aktive Alarmer</h2>
            <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-[10px] font-black">
              {activeAlertsCount}
            </div>
          </div>
          
          <div className="space-y-3">
            {stocks.map(stk => {
              const alert = alertConfigs[stk.id];
              if (!alert || !alert.isEnabled) return null;
              
              const isBuy = alert.mode === "BUY";
              const refPrice = alert.referencePrice || stk.currentPrice;
              const targetPrice = isBuy 
                ? refPrice * (1 - alert.dropPctThreshold / 100)
                : refPrice * (1 + alert.risePctThreshold / 100);
              const distancePct = Math.abs((stk.currentPrice - targetPrice) / stk.currentPrice * 100);

              return (
                <div key={`alert-${stk.id}`} className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col gap-2 relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isBuy ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                  
                  <div className="flex justify-between items-center pl-2">
                    <div className="flex items-center gap-2">
                      <Bell className={`w-3.5 h-3.5 ${isBuy ? 'text-blue-500' : 'text-emerald-500'}`} />
                      <span className="font-extrabold text-sm">{stk.symbol}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                      {isBuy ? 'Køb på dip' : 'Sælg på top'}
                    </span>
                  </div>
                  
                  <div className="pl-2 flex justify-between items-end mt-1">
                    <div>
                      <div className="text-[10px] text-[var(--text-muted)] font-semibold mb-0.5">Mål Kurs</div>
                      <div className="font-mono text-sm font-bold">{targetPrice.toLocaleString("da-DK", {maximumFractionDigits:1})} kr.</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[var(--text-muted)] font-semibold mb-0.5">Afstand</div>
                      <div className={`font-mono text-sm font-bold ${distancePct < 1.0 ? 'text-amber-500' : 'text-[var(--text-main)]'}`}>
                        {distancePct.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {activeAlertsCount === 0 && (
              <button className="w-full p-6 rounded-3xl bg-[var(--bg-card)] border border-dashed border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors text-center text-xs font-bold">
                Ingen aktive prisalarmer. Opret en nu.
              </button>
            )}
          </div>
        </section>

        {/* 7. MARKET TODAY */}
        <section className="pb-4">
          <h2 className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-3">Markedet i Dag</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <span className="text-xs font-bold text-[var(--text-secondary)] block mb-2">OMXC25</span>
              <span className="font-mono text-lg font-extrabold text-emerald-500">+1.24%</span>
            </div>
            <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <span className="text-xs font-bold text-[var(--text-secondary)] block mb-2">S&P 500</span>
              <span className="font-mono text-lg font-extrabold text-rose-500">-0.42%</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
