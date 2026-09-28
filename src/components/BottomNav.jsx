import React from "react";
import { LayoutDashboard, Target, Plus, Search, DollarSign } from "lucide-react";

export function BottomNav({ activeTab, onSelectTab, onOpenAddModal }) {
  const tabs = [
    { id: "radar", label: "Radar", icon: Target, badge: "2-3%" },
    { id: "dashboard", label: "Portefølje", icon: LayoutDashboard },
    { id: "add", label: "Handel", isAction: true }
  ];

  return (
    <nav 
      aria-label="Hovednavigation"
      className="bottom-nav-bar fixed bottom-0 left-0 right-0 sm:sticky sm:bottom-0 z-50 w-full max-w-[480px] mx-auto shadow-2xl"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}
    >
      <div className="px-2 pt-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          if (tab.isAction) {
            return (
              <button
                key="action-add"
                id="btn-add-trade"
                type="button"
                onClick={onOpenAddModal}
                className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 active:scale-90 transition-transform cursor-pointer focus:outline-none"
                title="Tilføj ny handel"
                aria-label="Tilføj ny handel"
              >
                <Plus className="w-6 h-6 stroke-[2.8]" />
              </button>
            );
          }

          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-${tab.id}`}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`bottom-nav-btn ${isActive ? "active" : ""}`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative flex items-center justify-center">
                <Icon 
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "stroke-[2.5] scale-110" : "stroke-[1.9]"
                  }`} 
                />
                {tab.badge && !isActive && (
                  <span className="absolute -top-1.5 -right-3.5 px-1 py-0.2 text-[8px] font-bold rounded-full bg-blue-600 text-white leading-tight">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-tight leading-none mt-1">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
