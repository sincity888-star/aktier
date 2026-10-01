import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { StockRadar } from "./components/StockRadar";
import { MobileStockRadar } from "./components/MobileStockRadar";
import { HomeScreen } from "./components/HomeScreen";
import { BottomNav } from "./components/BottomNav";
import { AlertBanner } from "./components/AlertBanner";
import { LoginScreen } from "./components/LoginScreen";
import { INITIAL_STOCKS } from "./data/mockData";
import { getDanishMarketStatus } from "./utils/calculations";
import { fetchLiveStockData } from "./utils/stockApi";
import { auth, onAuthStateChanged } from "./utils/firebase";

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentRoute, setCurrentRoute] = useState("home");
  const [selectedStockId, setSelectedStockId] = useState(null);

  // Lyt til Firebase login-status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const [stocks, setStocks] = useState(() => {
    const saved = localStorage.getItem("nordic_stocks_v2");
    if (!saved) return INITIAL_STOCKS;
    try {
      const parsed = JSON.parse(saved);
      // Sanity check for bad data from previous bug
      const sanitized = parsed.map(p => {
        if (typeof p.currentPrice === 'object') {
          return { ...p, currentPrice: p.currentPrice.currentPrice || INITIAL_STOCKS.find(i => i.id === p.id).currentPrice };
        }
        return p;
      });

      const market = getDanishMarketStatus();
      if (!market.isOpen) {
        return INITIAL_STOCKS.map(init => {
          const existing = sanitized.find(p => p.id === init.id);
          return existing ? { ...existing, ...init } : init;
        });
      }
      return sanitized;
    } catch {
      return INITIAL_STOCKS;
    }
  });

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("sincity_theme");
    return saved || "light";
  });
  const [isPhoneMode, setIsPhoneMode] = useState(true);
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);

  useEffect(() => {
    localStorage.setItem("sincity_theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  }, [theme]);

  const [alertConfigs, setAlertConfigs] = useState(() => {
    const saved = localStorage.getItem("nordic_multi_alert_configs");
    return saved ? JSON.parse(saved) : {
      zealand: { isEnabled: true, referencePrice: 272.70, dropPctThreshold: 2.0, risePctThreshold: 3.0, soundEnabled: true, mode: "BUY" },
      maersk: { isEnabled: true, referencePrice: 23240.00, dropPctThreshold: 2.0, risePctThreshold: 3.0, soundEnabled: true, mode: "BUY" },
      ambu: { isEnabled: true, referencePrice: 68.20, dropPctThreshold: 2.0, risePctThreshold: 3.0, soundEnabled: true, mode: "BUY" }
    };
  });

  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    localStorage.setItem("nordic_stocks_v2", JSON.stringify(stocks));
  }, [stocks]);

  useEffect(() => {
    localStorage.setItem("nordic_multi_alert_configs", JSON.stringify(alertConfigs));
    
    // Sync with the backend daemon running on port 3001
    fetch("http://localhost:3001/update-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alertConfigs)
    }).catch(err => {
      // Daemon might not be running, silently ignore in UI
    });
  }, [alertConfigs]);

  useEffect(() => {
    if (!user) return;
    const market = getDanishMarketStatus();
    if (!market.isOpen) return;

    let isMounted = true;

    const performUpdate = async () => {
      try {
        setIsLiveUpdating(true);
        const activeStockIds = ["zealand", "maersk", "ambu"];
        
        const updatedStocks = await Promise.all(
          stocks.map(async (stk) => {
            if (activeStockIds.includes(stk.id)) {
              try {
                const liveData = await fetchLiveStockData(stk.id);
                if (liveData) {
                  return { ...stk, ...liveData, history: stk.history };
                }
              } catch (e) {
                console.error(`Kunne ikke opdatere ${stk.id}:`, e);
              }
            }
            return stk;
          })
        );
        
        if (isMounted) setStocks(updatedStocks);
      } finally {
        if (isMounted) setIsLiveUpdating(false);
      }
    };

    performUpdate();
    const interval = setInterval(performUpdate, 30000); // Hvert 30. sek
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const handleUpdateAlertConfig = (stockId, config) => {
    setAlertConfigs(prev => ({
      ...prev,
      [stockId]: config
    }));
  };

  const handleUpdateStockPrice = (stockId, newPrice) => {
    setStocks(prev => prev.map(s => 
      s.id === stockId 
        ? { ...s, currentPrice: newPrice, change: newPrice - s.previousClose, changePercent: ((newPrice - s.previousClose) / s.previousClose) * 100 }
        : s
    ));
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm font-semibold text-slate-400">Verificerer adgang...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={(userData) => setUser(userData)} />;
  }

  const handleSelectStock = (id) => {
    setSelectedStockId(id);
    setCurrentRoute("stock");
  };

  return (
    <div className={`app-container-wrapper ${isPhoneMode ? "phone-mode" : "full-width"}`}>
      <main className="app-screen relative">
        <Header
          activeTab="radar"
          onGoBack={currentRoute !== "home" ? () => setCurrentRoute("home") : undefined}
          onSelectTab={() => {}}
          currency="DKK"
          onToggleCurrency={() => {}}
          theme={theme}
          onToggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")}
          isPhoneMode={isPhoneMode}
          onTogglePhoneMode={() => setIsPhoneMode(m => !m)}
          onOpenAddModal={() => {}}
          isLiveUpdating={isLiveUpdating}
          user={user}
        />

        {activeAlert && (
          <AlertBanner
            alert={activeAlert}
            onDismiss={() => setActiveAlert(null)}
            onTrade={() => setActiveAlert(null)}
          />
        )}

        <div className="flex-1 pb-4 sm:pb-8 overflow-y-auto">
          <div className="animate-fade-in h-full flex flex-col">
            {currentRoute === "home" && (
              <HomeScreen 
                stocks={stocks} 
                alertConfigs={alertConfigs} 
                onSelectStock={handleSelectStock} 
              />
            )}
            
            {currentRoute === "stock" && (
              <MobileStockRadar
                stocks={selectedStockId ? [stocks.find(s => s.id === selectedStockId) || stocks[0]] : stocks}
                onAddNewStock={() => {}}
                currency="DKK"
                alertConfigs={alertConfigs}
                onUpdateAlertConfig={handleUpdateAlertConfig}
                onUpdateStockPrice={handleUpdateStockPrice}
                onGoBack={() => setCurrentRoute("home")}
              />
            )}
            
            {["watchlist", "alerts", "more", "radar"].includes(currentRoute) && currentRoute !== "stock" && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full min-h-[60vh]">
                <div className="w-16 h-16 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center mb-4">
                  <span className="text-2xl">🚧</span>
                </div>
                <h2 className="text-lg font-extrabold mb-2 text-[var(--text-main)] capitalize">{currentRoute}</h2>
                <p className="text-sm font-semibold text-[var(--text-muted)]">
                  Denne sektion er under konstruktion. Her kommer der en dedikeret fuldskærms-oplevelse senere.
                </p>
                <button 
                  onClick={() => setCurrentRoute("home")}
                  className="mt-6 px-6 py-2 rounded-full bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                >
                  Gå tilbage til Home
                </button>
              </div>
            )}
          </div>
        </div>

        <BottomNav currentRoute={currentRoute} onNavigate={setCurrentRoute} />
      </main>
    </div>
  );
}
