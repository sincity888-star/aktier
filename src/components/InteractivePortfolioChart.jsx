import React, { useState, useRef } from "react";
import { formatCurrency, formatPercent } from "../utils/calculations";

export function InteractivePortfolioChart({
  dataMap,
  currentValue,
  currency,
  period,
  onPeriodChange
}) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const containerRef = useRef(null);

  const points = dataMap[period] || dataMap["1D"];
  if (!points || points.length === 0) return null;

  const values = points.map(p => p.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // Afgør om kurven er grøn eller rød baseret på start vs slut punkt
  const firstVal = values[0];
  const lastVal = values[values.length - 1];
  const isPositive = lastVal >= firstVal;

  const strokeColor = isPositive ? "var(--color-profit)" : "var(--color-loss)";
  const gradientId = `chart-gradient-${period}-${isPositive ? "up" : "down"}`;

  // SVG Dimensioner
  const width = 360;
  const height = 140;
  const paddingX = 10;
  const paddingTop = 15;
  const paddingBottom = 15;

  const effectiveWidth = width - paddingX * 2;
  const effectiveHeight = height - paddingTop - paddingBottom;

  // Beregn koordinater for hvert punkt
  const coords = points.map((p, i) => {
    const x = paddingX + (i / (points.length - 1)) * effectiveWidth;
    const y = paddingTop + effectiveHeight - ((p.value - minVal) / range) * effectiveHeight;
    return { x, y, ...p };
  });

  // Skab en glat SVG-kurve (Catmull-Rom eller kubisk bezier)
  const linePath = coords.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pt.x},${pt.y}`;
  }, "");

  const areaPath = `${linePath} L ${coords[coords.length - 1].x},${height} L ${coords[0].x},${height} Z`;

  // Håndter touch/mus scrub
  const handlePointerMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const relativeX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, relativeX / rect.width));
    const index = Math.round(ratio * (points.length - 1));
    setHoverIndex(index);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  const activePoint = hoverIndex !== null ? coords[hoverIndex] : null;
  const displayedVal = activePoint ? activePoint.value : currentValue;
  const periodDiff = activePoint ? activePoint.value - firstVal : lastVal - firstVal;
  const periodDiffPct = firstVal > 0 ? (periodDiff / firstVal) * 100 : 0;

  const periods = [
    { key: "1D", label: "1D" },
    { key: "1U", label: "1U" },
    { key: "1M", label: "1M" },
    { key: "1Å", label: "1Å" },
    { key: "MAX", label: "MAX" },
  ];

  return (
    <div className="w-full select-none">
      {/* Værdi over grafen (opdateres når man scrubber) */}
      <div className="flex items-baseline justify-between px-1 mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-[var(--text-muted)] font-medium">
            {activePoint ? `Historisk (${activePoint.label}):` : "Portefølje:"}
          </span>
          <span className="text-sm font-semibold text-[var(--text-secondary)] font-mono tabular-nums">
            {formatCurrency(displayedVal, currency, 0)}
          </span>
        </div>
        <div className="text-xs font-mono font-medium tabular-nums flex items-center gap-1" style={{ color: periodDiff >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
          <span>{periodDiff >= 0 ? "+" : ""}{formatCurrency(periodDiff, currency, 0)}</span>
          <span>({formatPercent(periodDiffPct)})</span>
        </div>
      </div>

      {/* SVG Graf beholder */}
      <div 
        ref={containerRef}
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerLeave}
        className="relative w-full h-[140px] cursor-crosshair touch-none"
      >
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.30" />
              <stop offset="70%" stopColor={strokeColor} stopOpacity="0.05" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Fyld-gradient */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Kurvelinje */}
          <path 
            d={linePath} 
            fill="none" 
            stroke={strokeColor} 
            strokeWidth="2.5" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Scrub lodret linje og indikator-cirkel */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={0}
                x2={activePoint.x}
                y2={height}
                stroke="rgba(255, 255, 255, 0.25)"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="5"
                fill={strokeColor}
                stroke="#080c14"
                strokeWidth="2.5"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="9"
                fill={strokeColor}
                opacity="0.3"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Tidsperiode knapper */}
      <div className="flex items-center justify-between gap-1 mt-2.5 px-1 py-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
        {periods.map(p => (
          <button
            key={p.key}
            onClick={() => onPeriodChange(p.key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              period === p.key
                ? "bg-[var(--bg-card-elevated)] text-white shadow-sm border border-[var(--border-subtle)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
