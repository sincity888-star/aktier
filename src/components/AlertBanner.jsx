import React from "react";
import { AlertTriangle, TrendingDown, TrendingUp, X, ArrowRight, BellRing } from "lucide-react";

export function AlertBanner({
  alert,
  onDismiss,
  onTrade
}) {
  if (!alert) return null;

  const isBuySignal = alert.type === "BUY_SIGNAL";

  return (
    <div className="mx-4 my-2 p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/90 to-indigo-900/90 border border-blue-400/40 shadow-xl shadow-blue-900/40 animate-slide-up flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <div 
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
            isBuySignal ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
          }`}
        >
          {isBuySignal ? <TrendingDown className="w-5 h-5 text-emerald-400" /> : <TrendingUp className="w-5 h-5 text-emerald-400" />}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-white text-xs tracking-tight">
              {isBuySignal ? "🎯 KØBSSIGNAL PÅ MÆRSK B" : "🚀 PROFIT-MÅL NÅET"}
            </span>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full font-mono text-emerald-300">
              {alert.diffPct > 0 ? "+" : ""}{alert.diffPct.toFixed(1)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-300 truncate mt-0.5">
            {alert.message} (kurs: <span className="font-mono font-bold text-white">{alert.currentPrice} kr.</span>)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onTrade}
          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-1"
        >
          <span>Handl</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onDismiss}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          title="Luk notifikation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
