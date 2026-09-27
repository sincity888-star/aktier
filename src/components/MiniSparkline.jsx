import React from "react";

export function MiniSparkline({ data, isPositive }) {
  if (!data || data.length < 2) return null;

  const width = 56;
  const height = 24;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  const color = isPositive ? "var(--color-profit)" : "var(--color-loss)";

  return (
    <div className="w-[56px] h-[24px] flex items-center justify-center">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
}
