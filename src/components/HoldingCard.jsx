import React from "react";
import { formatCurrency, formatPercent } from "../utils/calculations";
import { MiniSparkline } from "./MiniSparkline";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function HoldingCard({ item, currency, onClick, isFlashingUp, isFlashingDown }) {
  const { stock, shares, avgBuyPrice, currentValue, totalProfit, profitPercent, dayChange, dayChangePercent } = item;
  if (!stock) return null;

  const isProfit = totalProfit >= 0;
  const isDayUp = (stock.change || 0) >= 0;

  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-slate-700/80 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm ${
        isFlashingUp ? "tick-flash-up" : ""
      } ${isFlashingDown ? "tick-flash-down" : ""}`}
    >
      {/* Venstre side: Avatar & Navn */}
      <div className="flex items-center gap-3 min-w-0">
        <div 
          className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-xs text-white shadow-inner relative"
          style={{ backgroundColor: stock.logoBg || "#1e293b" }}
        >
          <span>{stock.symbol.slice(0, 3)}</span>
          <span className="absolute -bottom-1 -right-1 text-[10px] bg-slate-900/90 rounded-full px-1 border border-slate-700">
            {stock.country === "DK" ? "🇩🇰" : "🇺🇸"}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-slate-100 truncate">{stock.symbol}</span>
            <span className="text-[10px] text-[var(--text-muted)] font-medium truncate max-w-[90px]">
              {stock.name}
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
            <span>{shares} stk.</span>
            <span className="mx-1">·</span>
            <span>GAK {avgBuyPrice} {stock.currency}</span>
          </div>
        </div>
      </div>

      {/* Midte: Mini Sparkline */}
      <div className="hidden xs:block flex-shrink-0">
        <MiniSparkline data={stock.sparkline} isPositive={isDayUp} />
      </div>

      {/* Højre side: Samlet værdi & Afkast */}
      <div className="text-right flex-shrink-0">
        <div className="font-extrabold text-sm text-slate-100 font-mono tabular-nums">
          {formatCurrency(currentValue, currency, 0)}
        </div>

        {/* Total profit og % */}
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <span
            className="text-xs font-semibold font-mono tabular-nums flex items-center"
            style={{ color: isProfit ? "var(--color-profit)" : "var(--color-loss)" }}
          >
            {isProfit ? "+" : ""}{formatCurrency(totalProfit, currency, 0)}
            <span className="text-[10px] ml-1">({formatPercent(profitPercent)})</span>
          </span>
        </div>
      </div>
    </div>
  );
}
