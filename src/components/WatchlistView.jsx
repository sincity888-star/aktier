import React, { useState } from "react";
import { Search, Star, ArrowUpRight, ArrowDownRight, Plus, SlidersHorizontal, ArrowLeft } from "lucide-react";
import { formatPercent } from "../utils/calculations";

export function WatchlistView({
  stocks,
  watchlistIds,
  onToggleWatchlist,
  onSelectStock,
  onOpenTradeModal,
  onGoBack
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredStocks = stocks.filter(stock => {
    // Søgefilter
    const matchesSearch = stock.name.toLowerCase().includes(search.toLowerCase()) ||
                          stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
                          stock.sector.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // Kategori-filter
    if (filter === "watchlist") return watchlistIds.includes(stock.id);
    if (filter === "dk") return stock.country === "DK";
    if (filter === "us") return stock.country === "US";
    if (filter === "dividend") return stock.dividendYield >= 2.0;

    return true;
  });

  const categories = [
    { key: "all", label: "Alle" },
    { key: "watchlist", label: `⭐ Watchlist (${watchlistIds.length})` },
    { key: "dk", label: "🇩🇰 Danmark" },
    { key: "us", label: "🇺🇸 USA" },
    { key: "dividend", label: "💰 Udbytte" },
  ];

  return (
    <div className="px-4 py-3 space-y-3">
      {/* Tilbage knap */}
      {onGoBack && (
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={onGoBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span>← Tilbage til Overblik</span>
          </button>
          <span className="text-[11px] font-semibold text-slate-400">Marked & Watchlist</span>
        </div>
      )}

      {/* Søgefelt */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Søg efter aktie, ticker eller sektor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-blue-500 text-sm text-white placeholder-[var(--text-faint)] transition-all"
        />
      </div>

      {/* Filter Faner */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
              filter === cat.key
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-white border border-[var(--border-subtle)]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Aktieliste */}
      <div className="space-y-2">
        {filteredStocks.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-muted)] text-sm">
            Ingen aktier fundet med den valgte filtrering.
          </div>
        ) : (
          filteredStocks.map(stock => {
            const isStarred = watchlistIds.includes(stock.id);
            const isDayUp = (stock.change || 0) >= 0;

            return (
              <div
                key={stock.id}
                onClick={() => onSelectStock(stock)}
                className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-slate-700 transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                {/* Logo & Symbol */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-xs text-white shadow-inner"
                    style={{ backgroundColor: stock.logoBg || "#1e293b" }}
                  >
                    {stock.symbol.slice(0, 3)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-100">{stock.symbol}</span>
                      <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[110px]">
                        {stock.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      <span>{stock.sector}</span>
                      {stock.dividendYield > 0 && (
                        <span className="ml-1.5 text-amber-400 font-mono">
                          · {stock.dividendYield}% udbytte
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Kurs & handling */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-sm text-slate-100 font-mono tabular-nums">
                      {stock.currentPrice.toLocaleString("da-DK", { minimumFractionDigits: 2 })} {stock.currency}
                    </div>
                    <div 
                      className="text-xs font-semibold font-mono tabular-nums flex items-center justify-end"
                      style={{ color: isDayUp ? "var(--color-profit)" : "var(--color-loss)" }}
                    >
                      {isDayUp ? "+" : ""}{stock.change.toFixed(2)} ({formatPercent(stock.changePercent)})
                    </div>
                  </div>

                  {/* Stjerne til Watchlist */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatchlist(stock.id);
                    }}
                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-amber-400 active:scale-90 transition-transform"
                    title={isStarred ? "Fjern fra Watchlist" : "Tilføj til Watchlist"}
                  >
                    <Star className={`w-4 h-4 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
