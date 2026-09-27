import React, { useState } from "react";
import { X, ArrowUpRight, ArrowDownRight, Plus, Minus, Calendar, ShieldCheck, Tag, Building2, TrendingUp, Trash2 } from "lucide-react";
import { formatCurrency, formatPercent } from "../utils/calculations";
import { InteractivePortfolioChart } from "./InteractivePortfolioChart";

export function HoldingDetailModal({
  holdingMetric,
  currency,
  onClose,
  onOpenTradeModal,
  onDeleteHolding
}) {
  const [period, setPeriod] = useState("1M");

  if (!holdingMetric) return null;
  const { stock, shares, avgBuyPrice, currentValue, totalCost, totalProfit, profitPercent, dayChange, dayChangePercent, annualDividend, yieldOnCost } = holdingMetric;

  const isDayPositive = (stock.change || 0) >= 0;
  const isProfit = totalProfit >= 0;

  // Format chart data format for the stock
  const chartDataMap = {};
  if (stock.history) {
    Object.keys(stock.history).forEach(key => {
      const arr = stock.history[key];
      chartDataMap[key] = arr.map((val, idx) => ({
        label: `#${idx + 1}`,
        value: val
      }));
    });
  }

  // 52-ugers spænd position
  const yearRange = (stock.yearHigh - stock.yearLow) || 1;
  const yearPct = Math.max(0, Math.min(100, ((stock.currentPrice - stock.yearLow) / yearRange) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-sm"
              style={{ backgroundColor: stock.logoBg || "#1e293b" }}
            >
              {stock.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-base text-white">{stock.symbol}</h3>
                <span className="text-xs text-[var(--text-muted)] font-medium">· {stock.country === "DK" ? "København" : "New York"}</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] truncate max-w-[200px]">{stock.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 active:scale-95 transition-all shadow-sm"
          >
            <span>← Tilbage</span>
          </button>
        </div>

        {/* Modal Rulle-indhold */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {/* Kurs & Dagsudvikling */}
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs text-[var(--text-muted)] font-medium">Aktuel Børskurs</div>
              <div className="text-2xl font-extrabold text-white font-mono tabular-nums mt-0.5">
                {stock.currentPrice.toLocaleString("da-DK", { minimumFractionDigits: 2 })} {stock.currency}
              </div>
            </div>

            <div 
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono tabular-nums border"
              style={{
                backgroundColor: isDayPositive ? "var(--color-profit-bg)" : "var(--color-loss-bg)",
                color: isDayPositive ? "var(--color-profit)" : "var(--color-loss)",
                borderColor: isDayPositive ? "var(--color-profit-border)" : "var(--color-loss-border)"
              }}
            >
              {isDayPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{isDayPositive ? "+" : ""}{stock.change.toFixed(2)} ({formatPercent(stock.changePercent)})</span>
            </div>
          </div>

          {/* Interaktiv Kursgraf */}
          {chartDataMap["1M"] && (
            <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <InteractivePortfolioChart
                dataMap={chartDataMap}
                currentValue={stock.currentPrice}
                currency={stock.currency}
                period={period}
                onPeriodChange={setPeriod}
              />
            </div>
          )}

          {/* Min Beholdning sektion */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-card-elevated)] border border-[var(--border-subtle)]">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Din Position</span>
              <span className="text-blue-400 font-mono font-medium">{shares} aktier</span>
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[var(--text-muted)]">Samlet værdi</div>
                <div className="text-base font-extrabold text-white font-mono mt-0.5">
                  {formatCurrency(currentValue, currency, 2)}
                </div>
              </div>

              <div>
                <div className="text-[var(--text-muted)]">Gevinst / Tab</div>
                <div 
                  className="text-base font-extrabold font-mono mt-0.5"
                  style={{ color: isProfit ? "var(--color-profit)" : "var(--color-loss)" }}
                >
                  {isProfit ? "+" : ""}{formatCurrency(totalProfit, currency, 2)}
                  <span className="text-xs ml-1">({formatPercent(profitPercent)})</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <div className="text-[var(--text-muted)]">Gennemsnitskøbspris (GAK)</div>
                <div className="font-semibold text-slate-200 font-mono mt-0.5">
                  {avgBuyPrice} {stock.currency}
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <div className="text-[var(--text-muted)]">Årligt udbytte</div>
                <div className="font-semibold text-amber-400 font-mono mt-0.5">
                  {formatCurrency(annualDividend, currency, 0)} ({yieldOnCost.toFixed(2)}% YoC)
                </div>
              </div>
            </div>
          </div>

          {/* 52-Ugers Bar */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[var(--text-muted)]">52-ugers lav</span>
              <span className="text-xs font-bold text-slate-200">52-ugers interval</span>
              <span className="text-[var(--text-muted)]">52-ugers høj</span>
            </div>
            <div className="flex items-center justify-between font-mono text-xs text-slate-300 mb-1">
              <span>{stock.yearLow} {stock.currency}</span>
              <span>{stock.yearHigh} {stock.currency}</span>
            </div>
            <div className="relative w-full h-2 rounded-full bg-[var(--bg-app)] overflow-hidden">
              <div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                style={{ width: `${yearPct}%` }}
              />
            </div>
          </div>

          {/* Nøgletal Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">P/E Værdi</div>
              <div className="text-xs font-bold text-slate-200 font-mono mt-1">{stock.peRatio || "-"}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Direkte Afkast</div>
              <div className="text-xs font-bold text-amber-400 font-mono mt-1">{stock.dividendYield}%</div>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Børsværdi</div>
              <div className="text-xs font-bold text-slate-200 truncate mt-1">{stock.marketCap}</div>
            </div>
          </div>
        </div>

        {/* Modal Knap-handlinger i bunden */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center gap-2">
          <button
            onClick={() => onOpenTradeModal(stock.id, "BUY")}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Køb mere</span>
          </button>

          <button
            onClick={() => onOpenTradeModal(stock.id, "SELL")}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-rose-400 border border-rose-500/20 font-bold text-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <Minus className="w-4 h-4" />
            <span>Sælg aktier</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm(`Er du sikker på, at du vil slette ${stock.name} fra din portefølje?`)) {
                onDeleteHolding(stock.id);
                onClose();
              }
            }}
            title="Fjern fra portefølje"
            className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
