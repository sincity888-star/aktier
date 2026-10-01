import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { StockRadar } from "./components/StockRadar";
import { MobileStockRadar } from "./components/MobileStockRadar";
import { AlertBanner } from "./components/AlertBanner";
import { LoginScreen } from "./components/LoginScreen";
import { INITIAL_STOCKS } from "./data/mockData";
import { getDanishMarketStatus } from "./utils/calculations";
import { fetchLiveStockData } from "./utils/stockApi";
import { auth, onAuthStateChanged } from "./utils/firebase";

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

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
      const market = getDanishMarketStatus();
      if (!market.isOpen) {
        return INITIAL_STOCKS.map(init => {
          const existing = parsed.find(p => p.id === init.id);
          return existing ? { ...existing, ...init } : init;
        });
      }
      return parsed;
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

  return (
    <div className={`app-container-wrapper ${isPhoneMode ? "phone-mode" : "full-width"}`}>
      <main className="app-screen">
        <Header
          activeTab="radar"
          onGoBack={() => {}}
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
          <div className="animate-fade-in h-full">
            <MobileStockRadar
              stocks={stocks}
              onAddNewStock={() => {}}
              currency="DKK"
              alertConfigs={alertConfigs}
              onUpdateAlertConfig={handleUpdateAlertConfig}
              onUpdateStockPrice={handleUpdateStockPrice}
              onGoBack={() => {}}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
