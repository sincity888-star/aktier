import React from "react";
import { Home, Radar, List, Bell, Menu } from "lucide-react";

export function BottomNav({ currentRoute, onNavigate }) {
  const navItems = [
    { id: "home", label: "HOME", icon: Home },
    { id: "radar", label: "RADAR", icon: Radar },
    { id: "watchlist", label: "WATCHLIST", icon: List },
    { id: "alerts", label: "ALERTS", icon: Bell },
    { id: "more", label: "MORE", icon: Menu },
  ];

  return (
    <div className="bg-[var(--bg-card)]/90 backdrop-blur-xl border-t border-[var(--border-subtle)] pb-safe pt-2 px-6 flex justify-between items-center fixed bottom-0 w-full max-w-md mx-auto z-40 h-[70px]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentRoute === item.id || (currentRoute === "stock" && item.id === "radar");

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 transition-all ${
              isActive ? "text-blue-500 scale-105" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <Icon className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
            <span className={`text-[9px] font-bold tracking-widest ${isActive ? "opacity-100" : "opacity-70"}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
