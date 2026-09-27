import React, { useState, useEffect } from "react";
import { X, Plus, Minus, Check, ArrowRightLeft, DollarSign, Calendar } from "lucide-react";
import { formatCurrency } from "../utils/calculations";

export function AddTransactionModal({
  stocks,
  preselectedStockId,
  initialType = "BUY",
  onClose,
  onSubmitTransaction
}) {
  const [stockId, setStockId] = useState(preselectedStockId || (stocks[0] ? stocks[0].id : ""));
  const [type, setType] = useState(initialType);
  const [shares, setShares] = useState(10);
  const [price, setPrice] = useState(0);
  const [fee, setFee] = useState(29);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const currentStock = stocks.find(s => s.id === stockId) || stocks[0];

  // Auto-fill price when stock changes
  useEffect(() => {
    if (currentStock) {
      setPrice(currentStock.currentPrice);
      setFee(currentStock.currency === "USD" ? 3.5 : 29);
    }
  }, [stockId]);

  const currency = currentStock ? currentStock.currency : "DKK";

  // Beregn samlet beløb
  const subtotal = (Number(shares) || 0) * (Number(price) || 0);
  const total = type === "BUY" ? subtotal + (Number(fee) || 0) : Math.max(0, subtotal - (Number(fee) || 0));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!stockId || shares <= 0 || price <= 0) return;

    onSubmitTransaction({
      stockId,
      type,
      shares: Number(shares),
      price: Number(price),
      currency,
      fee: Number(fee) || 0,
      total,
      date,
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-white">Registrer Handel</h3>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 active:scale-95 transition-all shadow-sm"
          >
            <span>← Tilbage</span>
          </button>
        </div>

        {/* Formular */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Type vælger: Køb / Salg / Udbytte */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setType("BUY")}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                type === "BUY"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-[var(--text-muted)] hover:text-white"
              }`}
            >
              Køb Aktie
            </button>
            <button
              type="button"
              onClick={() => setType("SELL")}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                type === "SELL"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "text-[var(--text-muted)] hover:text-white"
              }`}
            >
              Sælg Aktie
            </button>
            <button
              type="button"
              onClick={() => setType("DIVIDEND")}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                type === "DIVIDEND"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "text-[var(--text-muted)] hover:text-white"
              }`}
            >
              Udbytte
            </button>
          </div>

          {/* Vælg Aktie */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Vælg Aktie
            </label>
            <select
              value={stockId}
              onChange={(e) => setStockId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-blue-500 text-sm font-semibold text-white appearance-none"
            >
              {stocks.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.symbol} — {s.name} ({s.currentPrice} {s.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Antal aktier med Stepper */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              {type === "DIVIDEND" ? "Antal aktier ejet" : "Antal aktier (stk.)"}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShares(prev => Math.max(1, Number(prev) - 1))}
                className="w-11 h-11 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-white flex items-center justify-center active:scale-95 text-lg font-bold"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                step="1"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-blue-500 text-center text-base font-extrabold font-mono text-white"
              />
              <button
                type="button"
                onClick={() => setShares(prev => Number(prev) + 1)}
                className="w-11 h-11 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-white flex items-center justify-center active:scale-95 text-lg font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Kurs pr. aktie */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center justify-between">
              <span>{type === "DIVIDEND" ? `Udbytte pr. aktie (${currency})` : `Handelskurs (${currency})`}</span>
              <button
                type="button"
                onClick={() => currentStock && setPrice(currentStock.currentPrice)}
                className="text-[10px] text-blue-400 hover:underline"
              >
                Brug aktuel kurs
              </button>
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-blue-500 text-sm font-semibold font-mono text-white"
            />
          </div>

          {/* Kurtage & Dato i grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Kurtage ({currency})
              </label>
              <input
                type="number"
                step="0.1"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-blue-500 text-sm font-semibold font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Handelsdato
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-blue-500 text-xs font-medium text-white"
              />
            </div>
          </div>

          {/* Samlet estimat boks */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-card-elevated)] border border-blue-500/20 flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Samlet beløb:</span>
            <span className="text-base font-extrabold text-white font-mono tabular-nums">
              {total.toLocaleString("da-DK", { minimumFractionDigits: 2 })} {currency}
            </span>
          </div>

          {/* Gem knap */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Bekræft og Gem Handel</span>
          </button>
        </form>
      </div>
    </div>
  );
}
