import React from "react";
import { formatCurrency, formatPercent } from "../utils/calculations";
import { PieChart } from "lucide-react";

const SECTOR_COLORS = {
  "Sundhed & Pharma": "#3b82f6", // Blue
  "Teknologi": "#8b5cf6",        // Purple
  "Halvledere & AI": "#06b6d4",   // Cyan
  "Grøn Energi": "#10b981",       // Emerald
  "Transport & Logistik": "#6366f1", // Indigo
  "Software & Cloud": "#f59e0b",  // Amber
  "Finans & Bank": "#14b8a6",     // Teal
  "Shipping & Logistik": "#0284c7", // Light Blue
  "Biler & Grøn Tech": "#ec4899",  // Pink
  "Forbrugsgoder": "#84cc16"      // Lime
};

export function AssetAllocation({ holdingMetrics, totalValue, currency }) {
  if (!holdingMetrics || holdingMetrics.length === 0 || totalValue <= 0) return null;

  // Gruppér beholdninger efter sektor
  const sectorMap = {};
  for (const item of holdingMetrics) {
    const sec = item.stock?.sector || "Øvrige";
    if (!sectorMap[sec]) {
      sectorMap[sec] = { sector: sec, value: 0, count: 0 };
    }
    sectorMap[sec].value += item.currentValue;
    sectorMap[sec].count += 1;
  }

  const sectors = Object.values(sectorMap)
    .map(s => ({
      ...s,
      percent: (s.value / totalValue) * 100,
      color: SECTOR_COLORS[s.sector] || "#94a3b8"
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="px-4 py-3">
      <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <PieChart className="w-3.5 h-3.5 text-blue-400" />
            <span>Sektorfordeling</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">
            {sectors.length} sektorer
          </span>
        </div>

        {/* Multi-segment progress bar */}
        <div className="w-full h-3 rounded-full bg-[var(--bg-app)] flex overflow-hidden p-0.5 gap-0.5">
          {sectors.map((s, i) => (
            <div
              key={s.sector}
              className="h-full rounded-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${s.percent}%`,
                backgroundColor: s.color,
                minWidth: "4px"
              }}
              title={`${s.sector}: ${s.percent.toFixed(1)}%`}
            />
          ))}
        </div>

        {/* Sector legends */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
          {sectors.slice(0, 5).map(s => (
            <div key={s.sector} className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-[var(--text-secondary)]">{s.sector}</span>
              <span className="font-semibold text-slate-300 font-mono tabular-nums">{s.percent.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
