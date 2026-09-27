import React from "react";
import { formatCurrency } from "../utils/calculations";
import { ArrowDownLeft, ArrowUpRight, DollarSign, Trash2, ArrowLeft } from "lucide-react";

export function TransactionsView({
  transactions,
  stocks,
  currency,
  onDeleteTransaction,
  onGoBack
}) {
  const stockMap = new Map(stocks.map(s => [s.id, s]));

  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

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
          <span className="text-[11px] font-semibold text-slate-400">Handelshistorik</span>
        </div>
      )}

      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Transaktionshistorik ({transactions.length})
        </h4>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)] text-sm">
          Ingen transaktioner registreret endnu.
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(tx => {
            const stock = stockMap.get(tx.stockId);
            const isBuy = tx.type === "BUY";
            const isDividend = tx.type === "DIVIDEND";

            return (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isBuy
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                        : isDividend
                        ? "bg-amber-600/20 text-amber-400 border border-amber-500/20"
                        : "bg-rose-600/20 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {isBuy ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : isDividend ? (
                      <DollarSign className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-100">
                        {isBuy ? "Køb" : isDividend ? "Udbytte" : "Salg"} · {stock ? stock.symbol : tx.stockId}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] font-mono">
                      <span>{tx.date}</span>
                      <span className="mx-1">·</span>
                      <span>{tx.shares} stk. @ {tx.price} {tx.currency}</span>
                      {tx.fee > 0 && <span className="ml-1 text-[10px] text-slate-500">(kurtage {tx.fee} {tx.currency})</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-extrabold text-sm text-slate-100 font-mono tabular-nums">
                      {isBuy ? "-" : "+"}{tx.total.toLocaleString("da-DK", { minimumFractionDigits: 2 })} {tx.currency}
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteTransaction(tx.id)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 active:scale-90 transition-colors"
                    title="Slet transaktion"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
