import React from "react";
import { LayoutDashboard, Briefcase, Plus, Search, DollarSign, History, Target } from "lucide-react";

export function BottomNav({ activeTab, onSelectTab, onOpenAddModal }) {
  const tabs = [
    { id: "dashboard", label: "Overblik", icon: LayoutDashboard },
    { id: "radar", label: "Radar", icon: Target },
    { id: "add", label: "Handel", isAction: true },
    { id: "market", label: "Marked", icon: Search },
    { id: "dividends", label: "Udbytte", icon: DollarSign },
  ];

  return (
    <nav className="sticky bottom-0 z-40 w-full mt-auto">
      <div className="glass-nav px-3 pt-2 pb-[calc(var(--safe-bottom)+6px)] flex items-center justify-around border-t border-[var(--border-subtle)] shadow-2xl">
        {tabs.map((tab) => {
          if (tab.isAction) {
            return (
              <button
                key="action-add"
                onClick={onOpenAddModal}
                className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 active:scale-90 transition-transform"
                title="Tilføj ny handel"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            );
          }

          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                isActive
                  ? "text-blue-400 scale-105"
                  : "text-[var(--text-muted)] hover:text-slate-200"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className={`text-[10px] font-semibold tracking-tight ${isActive ? "font-bold text-white" : ""}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
