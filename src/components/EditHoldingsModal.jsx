import React, { useState } from "react";
import { ArrowLeft, Check, Briefcase, Plus, Minus, Trash2 } from "lucide-react";

export function EditHoldingsModal({
  stocks,
  holdings,
  onSaveHoldings,
  onClose
}) {
  // Gem værdier som strenge så brugeren frit kan slette, redigere og taste
  const [items, setItems] = useState(() => {
    return stocks.map(stock => {
      const existing = holdings.find(h => h.stockId === stock.id);
      return {
        stockId: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: stock.currentPrice,
        currency: stock.currency,
        shares: existing && existing.shares > 0 ? String(existing.shares) : "",
        avgBuyPrice: existing && existing.avgBuyPrice > 0 ? String(existing.avgBuyPrice) : String(stock.currentPrice)
      };
    });
  });

  const handleSharesChange = (stockId, val) => {
    setItems(prev => prev.map(item => item.stockId === stockId ? { ...item, shares: val } : item));
  };

  const handlePriceChange = (stockId, val) => {
    setItems(prev => prev.map(item => item.stockId === stockId ? { ...item, avgBuyPrice: val } : item));
  };

  const adjustShares = (stockId, delta) => {
    setItems(prev => prev.map(item => {
      if (item.stockId !== stockId) return item;
      const current = Number(item.shares) || 0;
      const next = Math.max(0, current + delta);
      return { ...item, shares: next === 0 ? "" : String(next) };
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    const updatedHoldings = items
      .filter(item => Number(item.shares) > 0)
      .map(item => ({
        stockId: item.stockId,
        shares: Number(item.shares),
        avgBuyPrice: Number(item.avgBuyPrice) || item.currentPrice,
        notes: "Brugerens reelle beholdning"
      }));

    onSaveHoldings(updatedHoldings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[var(--bg-app)] border border-slate-700/80 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar med stor tydelig Tilbage-knap */}
        <div className="px-4 pt-3.5 pb-3 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span>← Tilbage</span>
          </button>

          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm text-white">Indtast Beholdning</h3>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-blue-600/30 active:scale-95 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Gem</span>
          </button>
        </div>

        {/* Indhold */}
        <form onSubmit={handleSave} className="p-4 space-y-3.5 overflow-y-auto">
          <div className="text-xs text-slate-200 bg-blue-950/40 p-3 rounded-2xl border border-blue-500/30 leading-relaxed">
            ✏️ Indtast dit <strong>antal aktier</strong> og din <strong>købspris (GAK)</strong> nedenfor. Tallene gemmes straks på din profil.
          </div>

          <div className="space-y-3">
            {items.map(item => {
              const numShares = Number(item.shares) || 0;
              const numPrice = Number(item.avgBuyPrice) || item.currentPrice;
              const totalVal = numShares * item.currentPrice;

              return (
                <div 
                  key={item.stockId}
                  className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-slate-700/80 space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-base text-white">{item.symbol}</span>
                      <span className="text-xs text-[var(--text-muted)] ml-2">{item.name}</span>
                    </div>
                    <div className="text-xs font-mono text-slate-300">
                      Aktuel kurs: <strong className="text-blue-400">{item.currentPrice.toLocaleString("da-DK")} kr.</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Antal aktier */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-white">
                          Antal aktier (stk.)
                        </label>
                        {numShares > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSharesChange(item.stockId, "")}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                          >
                            Nulstil
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => adjustShares(item.stockId, -1)}
                          className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-600 text-white font-bold flex items-center justify-center text-lg active:scale-95 transition-all shadow-sm"
                          title="Træk 1 fra"
                        >
                          <Minus className="w-4 h-4 stroke-[3]" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={item.shares}
                          onChange={(e) => handleSharesChange(item.stockId, e.target.value)}
                          placeholder="0"
                          style={{
                            backgroundColor: "#020617",
                            color: "#ffffff",
                            borderColor: "#3b82f6",
                            fontSize: "18px",
                            fontWeight: "bold"
                          }}
                          className="flex-1 h-11 px-2 rounded-xl text-center font-mono text-white border-2 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/50 shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => adjustShares(item.stockId, 1)}
                          className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-600 text-white font-bold flex items-center justify-center text-lg active:scale-95 transition-all shadow-sm"
                          title="Læg 1 til"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    </div>

                    {/* Købskurs */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-white">
                          Købspris / GAK (kr.)
                        </label>
                        <button
                          type="button"
                          onClick={() => handlePriceChange(item.stockId, String(item.currentPrice))}
                          className="text-[10px] text-blue-400 hover:underline font-semibold"
                        >
                          Aktuel kurs
                        </button>
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.avgBuyPrice}
                        onChange={(e) => handlePriceChange(item.stockId, e.target.value)}
                        placeholder={String(item.currentPrice)}
                        style={{
                          backgroundColor: "#020617",
                          color: "#ffffff",
                          borderColor: "#475569",
                          fontSize: "18px",
                          fontWeight: "bold"
                        }}
                        className="w-full h-11 px-3 rounded-xl font-mono text-white border-2 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/50 shadow-inner"
                      />
                    </div>
                  </div>

                  {numShares > 0 ? (
                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Nuværende værdi ({numShares} stk.):</span>
                      <span className="font-extrabold text-emerald-400 text-sm">
                        {totalVal.toLocaleString("da-DK", { maximumFractionDigits: 0 })} kr.
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">
                      Ikke i beholdning (0 stk.)
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Tilbage</span>
            </button>

            <button
              type="submit"
              className="flex-[2] py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Gem Min Beholdning</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
