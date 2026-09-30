import React from "react";
import { TrendingUp, Sun, Moon, LogOut } from "lucide-react";
import { signOut, auth } from "../utils/firebase";

export function Header({
  theme,
  onToggleTheme,
  user
}) {
  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/95 backdrop-blur-md sticky top-0 z-30 shadow-sm">
      <div className="px-3 pt-2.5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-[var(--text-main)]">
                Sincity Radar V2
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">PRO</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-7 h-7 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white items-center justify-center transition-all flex active:scale-90 shadow-sm cursor-pointer"
            title={theme === "light" ? "Skift til mørkt tema" : "Skift til lyst tema"}
          >
            {theme === "light" ? (
              <Moon className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>
          
          {user && (
            <button
              onClick={handleLogout}
              className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 items-center justify-center transition-all flex active:scale-90 shadow-sm"
              title="Log ud"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
