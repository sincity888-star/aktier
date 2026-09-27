import React from "react";
import { formatCurrency, formatPercent } from "../utils/calculations";
import { DollarSign, Calendar, TrendingUp, Sparkles, AlertCircle, ArrowLeft } from "lucide-react";

export function DividendView({ summary, currency, onGoBack }) {
  const { totalAnnualDividend, overallDividendYield, holdingMetrics, totalCost } = summary;

  // Filtrer aktier med udbytte
  const dividendHoldings = (holdingMetrics || [])
    .filter(item => item.annualDividend > 0)
    .sort((a, b) => b.annualDividend - a.annualDividend);

  // Samlet yield on cost
  const overallYieldOnCost = totalCost > 0 ? (totalAnnualDividend / totalCost) * 100 : 0;
  const monthlyAverage = totalAnnualDividend / 12;

  return (
    <div className="px-4 py-3 space-y-4">
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
          <span className="text-[11px] font-semibold text-amber-400">Udbytte & Passiv Indkomst</span>
        </div>
      )}

      {/* Stor Udbytte Opsummering */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-950/30 via-[var(--bg-card)] to-[var(--bg-card-elevated)] border border-amber-500/20 shadow-lg">
        <div className="flex items-center justify-between text-xs text-amber-400/90 font-semibold mb-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Årligt Forventet Udbytte</span>
          </div>
          <span className="bg-amber-400/10 border border-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
            Passiv Indkomst
          </span>
        </div>

        <div className="text-3xl font-extrabold text-white font-mono tabular-nums mt-1">
          {formatCurrency(totalAnnualDividend, currency, 0)}
        </div>

        <div className="text-xs text-[var(--text-muted)] font-mono mt-1">
          Svarer til ca. <span className="text-emerald-400 font-bold">{formatCurrency(monthlyAverage, currency, 0)}</span> / måned
        </div>

        {/* Nøgletal for udbytte */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[var(--border-subtle)]">
          <div>
            <div className="text-[11px] text-[var(--text-muted)]">Direkte Afkast (Forward Yield)</div>
            <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">
              {overallDividendYield.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-muted)]">Yield on Cost (købskurs)</div>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
              {overallYieldOnCost.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Kommende udbetalinger */}
      <div>
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 px-1 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span>Kommende Udbyttedatoer</span>
        </h4>

        <div className="space-y-2">
          {dividendHoldings.map(item => {
            const stock = item.stock;
            return (
              <div
                key={item.stockId}
                className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white"
                    style={{ backgroundColor: stock.logoBg || "#1e293b" }}
                  >
                    {stock.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-100">{stock.symbol}</div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                      <span>{stock.dividendYield}% afkast</span>
                      <span>·</span>
                      <span className="text-amber-400/90 font-mono">
                        {stock.nextDividendDate ? stock.nextDividendDate : "Dato tba"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-sm text-amber-400 font-mono tabular-nums">
                    +{formatCurrency(item.annualDividend, currency, 0)}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono">
                    {item.shares} aktier × {stock.dividendPerShare} {stock.currency}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
