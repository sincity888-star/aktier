import React, { useState } from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, PieChart, ShieldCheck } from "lucide-react";
import { formatCurrency, formatPercent } from "../utils/calculations";
import { InteractivePortfolioChart } from "./InteractivePortfolioChart";
import { PORTFOLIO_HISTORY } from "../data/mockData";

export function PortfolioSummary({ summary, currency }) {
  const [period, setPeriod] = useState("1D");

  const {
    totalValue,
    totalCost,
    totalProfit,
    totalProfitPercent,
    totalDayChange,
    dayChangePercent,
    totalAnnualDividend,
    overallDividendYield
  } = summary;

  const isDayPositive = totalDayChange >= 0;
  const isTotalPositive = totalProfit >= 0;

  return (
    <div className="px-4 pt-2 pb-4">
      {/* Saldo overskrift */}
      <div className="flex flex-col mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Samlet Portefølje
        </span>
        <div className="flex items-baseline gap-2 mt-0.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono tabular-nums">
            {formatCurrency(totalValue, currency, 2)}
          </h1>
        </div>

        {/* Dagens afkast pill & samlet afkast */}
        <div className="flex items-center flex-wrap gap-2 mt-2">
          {/* Dagens udvikling */}
          <div 
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold font-mono tabular-nums border"
            style={{
              backgroundColor: isDayPositive ? "var(--color-profit-bg)" : "var(--color-loss-bg)",
              color: isDayPositive ? "var(--color-profit)" : "var(--color-loss)",
              borderColor: isDayPositive ? "var(--color-profit-border)" : "var(--color-loss-border)"
            }}
          >
            {isDayPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>I dag: {isDayPositive ? "+" : ""}{formatCurrency(totalDayChange, currency, 0)}</span>
            <span>({formatPercent(dayChangePercent)})</span>
          </div>

          {/* Total afkast */}
          <div 
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium font-mono tabular-nums"
            style={{
              color: isTotalPositive ? "var(--color-profit)" : "var(--color-loss)",
            }}
          >
            <span>Total: {isTotalPositive ? "+" : ""}{formatCurrency(totalProfit, currency, 0)} ({formatPercent(totalProfitPercent)})</span>
          </div>
        </div>
      </div>

      {/* Interaktiv Porteføljegraf */}
      <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm mb-3">
        <InteractivePortfolioChart
          dataMap={PORTFOLIO_HISTORY}
          currentValue={totalValue}
          currency={currency}
          period={period}
          onPeriodChange={setPeriod}
        />
      </div>

      {/* Hurtig nøgletal-bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <div className="text-[11px] text-[var(--text-muted)] font-medium">Investeret</div>
          <div className="text-xs font-bold text-slate-200 mt-1 font-mono tabular-nums">
            {formatCurrency(totalCost, currency, 0)}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <div className="text-[11px] text-[var(--text-muted)] font-medium">Total Gevinst</div>
          <div 
            className="text-xs font-bold mt-1 font-mono tabular-nums"
            style={{ color: isTotalPositive ? "var(--color-profit)" : "var(--color-loss)" }}
          >
            {isTotalPositive ? "+" : ""}{formatCurrency(totalProfit, currency, 0)}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <div className="text-[11px] text-[var(--text-muted)] font-medium">Est. Udbytte</div>
          <div className="text-xs font-bold text-amber-400 mt-1 font-mono tabular-nums flex items-center justify-between">
            <span>{formatCurrency(totalAnnualDividend, currency, 0)}</span>
            <span className="text-[10px] text-[var(--text-muted)] font-normal">({overallDividendYield.toFixed(1)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
