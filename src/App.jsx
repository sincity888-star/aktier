import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { PortfolioSummary } from "./components/PortfolioSummary";
import { AssetAllocation } from "./components/AssetAllocation";
import { HoldingCard } from "./components/HoldingCard";
import { HoldingDetailModal } from "./components/HoldingDetailModal";
import { AddTransactionModal } from "./components/AddTransactionModal";
import { EditHoldingsModal } from "./components/EditHoldingsModal";
import { WatchlistView } from "./components/WatchlistView";
import { DividendView } from "./components/DividendView";
import { TransactionsView } from "./components/TransactionsView";
import { StockRadar } from "./components/StockRadar";
import { AlertBanner } from "./components/AlertBanner";
import { BottomNav } from "./components/BottomNav";
import {
  INITIAL_STOCKS,
  INITIAL_HOLDINGS,
  INITIAL_TRANSACTIONS,
  USD_TO_DKK
} from "./data/mockData";
import { getPortfolioSummary } from "./utils/calculations";
import { playAlertChime, sendBrowserNotification } from "./utils/audioAlert";
import { sendStockAlertEmail } from "./utils/emailAlert";
import { savePortfolioToCloud, subscribeToCloudPortfolio } from "./utils/firebase";
import { History, Plus, Target, BellRing, ArrowRight, ArrowLeft, Edit, Cloud, ShieldCheck } from "lucide-react";

export default function App() {
  // Gemte data (v2 version for at rydde gamle demoaktier)
  const [stocks, setStocks] = useState(() => {
    const saved = localStorage.getItem("nordic_stocks_v2");
    return saved ? JSON.parse(saved) : INITIAL_STOCKS;
  });

  const [holdings, setHoldings] = useState(() => {
    const saved = localStorage.getItem("nordic_holdings_v2");
    return saved ? JSON.parse(saved) : INITIAL_HOLDINGS;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("nordic_transactions_v2");
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [watchlistIds, setWatchlistIds] = useState(() => {
    const saved = localStorage.getItem("nordic_watchlist_v2");
    return saved ? JSON.parse(saved) : ["zealand", "maersk", "ambu"];
  });

  // UI tilstande
  const [currency, setCurrency] = useState("DKK");
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("sincity_theme");
    return saved || "light"; // Standard: Lyst og venligt tema
  });
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'radar' | 'holdings' | 'market' | 'dividends' | 'history'
  const [isPhoneMode, setIsPhoneMode] = useState(true);
  const [isLiveUpdating, setIsLiveUpdating] = useState(true);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // Anvend tema-klasse på dokumentet
  useEffect(() => {
    localStorage.setItem("sincity_theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  }, [theme]);

  // Modaler
  const [selectedHoldingMetric, setSelectedHoldingMetric] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditHoldingsOpen, setIsEditHoldingsOpen] = useState(false);
  const [tradeModalStockId, setTradeModalStockId] = useState(null);
  const [tradeModalType, setTradeModalType] = useState("BUY");

  // Flash ticks effekter for kurser
  const [flashingStockIds, setFlashingStockIds] = useState({});

  // Multipel aktie-alarm konfiguration
  const [alertConfigs, setAlertConfigs] = useState(() => {
    const saved = localStorage.getItem("nordic_multi_alert_configs");
    return saved ? JSON.parse(saved) : {
      zealand: { isEnabled: true, referencePrice: 272.70, dropPctThreshold: 2.0, risePctThreshold: 3.0, soundEnabled: true },
      maersk: { isEnabled: true, referencePrice: 23240.00, dropPctThreshold: 2.0, risePctThreshold: 3.0, soundEnabled: true },
      ambu: { isEnabled: true, referencePrice: 68.20, dropPctThreshold: 2.0, risePctThreshold: 3.0, soundEnabled: true }
    };
  });

  const [activeAlert, setActiveAlert] = useState(null);
  const lastEmailSentRef = useRef({});

  // Synkroniser til LocalStorage & Firebase Cloud
  useEffect(() => {
    localStorage.setItem("nordic_stocks_v2", JSON.stringify(stocks));
  }, [stocks]);

  useEffect(() => {
    localStorage.setItem("nordic_holdings_v2", JSON.stringify(holdings));
    localStorage.setItem("nordic_transactions_v2", JSON.stringify(transactions));
    localStorage.setItem("nordic_multi_alert_configs", JSON.stringify(alertConfigs));
    localStorage.setItem("nordic_watchlist_v2", JSON.stringify(watchlistIds));

    // Cloud backup via Firebase Firestore
    savePortfolioToCloud("user_portfolio", {
      holdings,
      transactions,
      alertConfigs
    }).then(ok => {
      if (ok) setIsCloudSynced(true);
    });
  }, [holdings, transactions, alertConfigs, watchlistIds]);

  // Lyt til realtime cloud ændringer (hvis f.eks. redigeret på en anden enhed)
  useEffect(() => {
    const unsubscribe = subscribeToCloudPortfolio("user_portfolio", (cloudData) => {
      if (cloudData && cloudData.holdings) {
        setIsCloudSynced(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Simuleret Live Børskurs bevægelse (hvis slået til)
  useEffect(() => {
    if (!isLiveUpdating) return;

    const interval = setInterval(() => {
      setStocks(prevStocks => {
        const randomIndex = Math.floor(Math.random() * prevStocks.length);
        const target = prevStocks[randomIndex];

        // Lille kursændring (-0.4% til +0.4%)
        const deltaPct = (Math.random() * 0.8 - 0.39) / 100;
        const newPrice = Number((target.currentPrice * (1 + deltaPct)).toFixed(target.currentPrice > 500 ? 0 : 2));
        const newChange = Number((newPrice - target.previousClose).toFixed(2));
        const newChangePct = Number(((newChange / target.previousClose) * 100).toFixed(2));

        const isUp = deltaPct >= 0;

        setFlashingStockIds(prev => ({ ...prev, [target.id]: isUp ? "up" : "down" }));
        setTimeout(() => {
          setFlashingStockIds(prev => {
            const next = { ...prev };
            delete next[target.id];
            return next;
          });
        }, 1200);

        return prevStocks.map((s, idx) => {
          if (idx !== randomIndex) return s;
          const updatedSparkline = [...s.sparkline.slice(1), newPrice];
          return {
            ...s,
            currentPrice: newPrice,
            change: newChange,
            changePercent: newChangePct,
            dayHigh: Math.max(s.dayHigh, newPrice),
            dayLow: Math.min(s.dayLow, newPrice),
            sparkline: updatedSparkline
          };
        });
      });
    }, 4200);

    return () => clearInterval(interval);
  }, [isLiveUpdating]);

  // Overvåg kurser for ALLE aktier med aktiv alarm (Zealand, Mærsk, Ambu)
  useEffect(() => {
    for (const stock of stocks) {
      const config = alertConfigs[stock.id];
      if (!config || !config.isEnabled) continue;

      const ref = config.referencePrice || stock.currentPrice;
      const current = stock.currentPrice;
      const diffPct = ((current - ref) / ref) * 100;

      if (diffPct <= -config.dropPctThreshold) {
        const alertObj = {
          stockId: stock.id,
          type: "BUY_SIGNAL",
          diffPct,
          currentPrice: current,
          message: `${stock.name} er faldet ${Math.abs(diffPct).toFixed(1)}% (under dit -${config.dropPctThreshold}% dip-købsmål).`
        };
        setActiveAlert(alertObj);
        if (config.soundEnabled) playAlertChime("buy");
        sendBrowserNotification(`Købssignal: ${stock.symbol}`, alertObj.message);

        // Send e-mail notifikation hvis slået til (maks 1 mail pr. 10 min pr. aktie)
        const emailAlertsEnabled = localStorage.getItem("sincity_email_alerts_enabled") !== "false";
        const userEmail = localStorage.getItem("sincity_alert_email") || "sincity888@gmail.com";
        const emailKey = `${stock.id}_buy`;
        const lastSent = lastEmailSentRef.current[emailKey] || 0;
        if (emailAlertsEnabled && userEmail && (Date.now() - lastSent > 10 * 60 * 1000)) {
          lastEmailSentRef.current[emailKey] = Date.now();
          sendStockAlertEmail({
            toEmail: userEmail,
            stockName: stock.name,
            symbol: stock.symbol,
            type: "BUY_SIGNAL",
            currentPrice: current,
            diffPct,
            referencePrice: ref,
            targetPrice: Math.round(ref * (1 + config.risePctThreshold / 100))
          });
        }
        break;
      } else if (diffPct >= config.risePctThreshold) {
        const alertObj = {
          stockId: stock.id,
          type: "SELL_SIGNAL",
          diffPct,
          currentPrice: current,
          message: `${stock.name} er steget ${diffPct.toFixed(1)}% (over dit +${config.risePctThreshold}% profit-mål).`
        };
        setActiveAlert(alertObj);
        if (config.soundEnabled) playAlertChime("sell");
        sendBrowserNotification(`Profit-mål nået: ${stock.symbol}`, alertObj.message);

        // Send e-mail notifikation hvis slået til (maks 1 mail pr. 10 min pr. aktie)
        const emailAlertsEnabled = localStorage.getItem("sincity_email_alerts_enabled") !== "false";
        const userEmail = localStorage.getItem("sincity_alert_email") || "sincity888@gmail.com";
        const emailKey = `${stock.id}_sell`;
        const lastSent = lastEmailSentRef.current[emailKey] || 0;
        if (emailAlertsEnabled && userEmail && (Date.now() - lastSent > 10 * 60 * 1000)) {
          lastEmailSentRef.current[emailKey] = Date.now();
          sendStockAlertEmail({
            toEmail: userEmail,
            stockName: stock.name,
            symbol: stock.symbol,
            type: "SELL_SIGNAL",
            currentPrice: current,
            diffPct,
            referencePrice: ref,
            targetPrice: Math.round(ref * (1 + config.risePctThreshold / 100))
          });
        }
        break;
      }
    }
  }, [stocks, alertConfigs]);

  // Beregn portefølje-nøgletal
  const portfolioSummary = getPortfolioSummary(holdings, stocks, currency, USD_TO_DKK);

  // Synkroniser aktivt valgt holding metric
  useEffect(() => {
    if (selectedHoldingMetric) {
      const updated = portfolioSummary.holdingMetrics.find(
        m => m.stockId === selectedHoldingMetric.stockId
      );
      if (updated) setSelectedHoldingMetric(updated);
    }
  }, [stocks, holdings, currency]);

  // Nulstil til ren Zealand, Mærsk, Ambu data
  const handleResetData = () => {
    if (window.confirm("Vil du nulstille til dine standard 3 aktier (Zealand, Mærsk, Ambu)?")) {
      setStocks(INITIAL_STOCKS);
      setHoldings(INITIAL_HOLDINGS);
      setTransactions(INITIAL_TRANSACTIONS);
      setWatchlistIds(["zealand", "maersk", "ambu"]);
      localStorage.clear();
    }
  };

  // Tilføj ny handel
  const handleAddTransaction = (newTx) => {
    const txWithId = { ...newTx, id: `tx-${Date.now()}` };
    setTransactions(prev => [txWithId, ...prev]);

    setHoldings(prevHoldings => {
      const existingIndex = prevHoldings.findIndex(h => h.stockId === newTx.stockId);

      if (newTx.type === "BUY") {
        if (existingIndex >= 0) {
          const current = prevHoldings[existingIndex];
          const totalShares = current.shares + newTx.shares;
          const newAvgBuyPrice = Number(
            ((current.shares * current.avgBuyPrice + newTx.shares * newTx.price) / totalShares).toFixed(2)
          );

          const updated = [...prevHoldings];
          updated[existingIndex] = {
            ...current,
            shares: totalShares,
            avgBuyPrice: newAvgBuyPrice
          };
          return updated;
        } else {
          return [
            ...prevHoldings,
            {
              stockId: newTx.stockId,
              shares: newTx.shares,
              avgBuyPrice: newTx.price,
              notes: newTx.notes || ""
            }
          ];
        }
      } else if (newTx.type === "SELL") {
        if (existingIndex >= 0) {
          const current = prevHoldings[existingIndex];
          const remainingShares = current.shares - newTx.shares;
          if (remainingShares <= 0) {
            return prevHoldings.filter(h => h.stockId !== newTx.stockId);
          } else {
            const updated = [...prevHoldings];
            updated[existingIndex] = { ...current, shares: remainingShares };
            return updated;
          }
        }
      }
      return prevHoldings;
    });
  };

  // Opdater kurs fra live synkronisering eller brugerinput
  const handleUpdateStockPrice = (stockId, newPrice) => {
    setStocks(prev => prev.map(s => s.id === stockId ? {
      ...s,
      currentPrice: newPrice,
      change: Number((newPrice - s.previousClose).toFixed(2)),
      changePercent: Number((((newPrice - s.previousClose) / s.previousClose) * 100).toFixed(2)),
      dayHigh: Math.max(s.dayHigh, newPrice),
      dayLow: Math.min(s.dayLow, newPrice)
    } : s));
  };

  // Tilføj en helt ny aktie til systemet
  const handleAddNewStock = (newStock) => {
    setStocks(prev => {
      if (prev.some(s => s.id === newStock.id)) return prev;
      return [...prev, newStock];
    });
    setAlertConfigs(prev => ({
      ...prev,
      [newStock.id]: {
        isEnabled: true,
        referencePrice: newStock.currentPrice,
        dropPctThreshold: 2.0,
        risePctThreshold: 3.0,
        soundEnabled: true
      }
    }));
  };

  const handleUpdateAlertConfig = (stockId, newConfig) => {
    setAlertConfigs(prev => ({
      ...prev,
      [stockId]: newConfig
    }));
  };

  const handleDeleteHolding = (stockId) => {
    setHoldings(prev => prev.filter(h => h.stockId !== stockId));
  };

  const handleDeleteTransaction = (txId) => {
    setTransactions(prev => prev.filter(t => t.id !== txId));
  };

  const handleToggleWatchlist = (stockId) => {
    setWatchlistIds(prev => 
      prev.includes(stockId) ? prev.filter(id => id !== stockId) : [...prev, stockId]
    );
  };

  const handleOpenTradeForStock = (stockId, type = "BUY") => {
    setTradeModalStockId(stockId);
    setTradeModalType(type);
    setIsAddModalOpen(true);
  };

  return (
    <div className={`app-container-wrapper ${isPhoneMode ? "phone-mode" : "full-width"}`}>
      <main className="app-screen">
        {/* Header */}
        <Header
          activeTab={activeTab}
          onGoBack={() => setActiveTab("dashboard")}
          onSelectTab={setActiveTab}
          currency={currency}
          onToggleCurrency={() => setCurrency(c => c === "DKK" ? "USD" : "DKK")}
          theme={theme}
          onToggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")}
          isPhoneMode={isPhoneMode}
          onTogglePhoneMode={() => setIsPhoneMode(m => !m)}
          onOpenAddModal={() => {
            setTradeModalStockId(null);
            setTradeModalType("BUY");
            setIsAddModalOpen(true);
          }}
          onResetData={handleResetData}
          isLiveUpdating={isLiveUpdating}
          onToggleLive={() => setIsLiveUpdating(v => !v)}
        />

        {/* Kursalarm banner hvis udløst */}
        {activeAlert && (
          <AlertBanner
            alert={activeAlert}
            onDismiss={() => setActiveAlert(null)}
            onTrade={() => {
              const tradeType = activeAlert.type === "BUY_SIGNAL" ? "BUY" : "SELL";
              const targetStockId = activeAlert.stockId;
              setActiveAlert(null);
              handleOpenTradeForStock(targetStockId, tradeType);
            }}
          />
        )}

        {/* Hovedindhold baseret på valgt fane */}
        <div className="flex-1 pb-28 sm:pb-8 overflow-y-auto">
          {activeTab === "dashboard" && (
            <div className="animate-fade-in">
              <PortfolioSummary summary={portfolioSummary} currency={currency} />

              {/* 2-3% Aktie Radar Spotlight Banner */}
              <div className="px-4 py-1.5">
                <div 
                  onClick={() => setActiveTab("radar")}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/40 hover:border-blue-400 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between shadow-lg shadow-blue-950/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
                      <Target className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-white">Aktie Radar & Alarmer</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          2-3% OVERVÅGNING
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        🔔 Hold øje med sving (klik for at indstille procenter)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-blue-400 font-bold bg-blue-500/10 px-2.5 py-1.5 rounded-xl border border-blue-500/20">
                    <span>Indstil %</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <AssetAllocation
                holdingMetrics={portfolioSummary.holdingMetrics}
                totalValue={portfolioSummary.totalValue}
                currency={currency}
              />

              {/* Dine Aktier med "Indtast Min Beholdning" knap */}
              <div className="px-4 py-2">
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Dine Aktier ({portfolioSummary.holdingMetrics.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditHoldingsOpen(true)}
                      className="text-xs text-blue-400 hover:text-white font-bold flex items-center gap-1 bg-blue-500/10 px-2.5 py-1 rounded-xl border border-blue-500/20 transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Indtast Beholdning</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("holdings")}
                      className="text-xs text-slate-400 font-semibold hover:underline"
                    >
                      Se alle
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {portfolioSummary.holdingMetrics.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
                      <p>Du har ikke indtastet dine aktier endnu.</p>
                      <button
                        onClick={() => setIsEditHoldingsOpen(true)}
                        className="mt-2 text-blue-400 font-bold underline"
                      >
                        Tryk her for at indtaste antal & købskurs
                      </button>
                    </div>
                  ) : (
                    portfolioSummary.holdingMetrics.map(item => (
                      <HoldingCard
                        key={item.stockId}
                        item={item}
                        currency={currency}
                        onClick={() => setSelectedHoldingMetric(item)}
                        isFlashingUp={flashingStockIds[item.stockId] === "up"}
                        isFlashingDown={flashingStockIds[item.stockId] === "down"}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "radar" && (
            <div className="animate-fade-in">
              <StockRadar
                stocks={stocks}
                onAddNewStock={handleAddNewStock}
                currency={currency}
                alertConfigs={alertConfigs}
                onUpdateAlertConfig={handleUpdateAlertConfig}
                onOpenTradeModal={handleOpenTradeForStock}
                onUpdateStockPrice={handleUpdateStockPrice}
                onGoBack={() => setActiveTab("dashboard")}
              />
            </div>
          )}

          {activeTab === "holdings" && (
            <div className="px-4 py-3 animate-fade-in space-y-3">
              {/* Fremtrædende Tilbage-knap for Beholdning */}
              <div className="flex items-center justify-between pb-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 active:scale-95 transition-all shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4 text-blue-400" />
                  <span>← Tilbage til Overblik</span>
                </button>
                <span className="text-[11px] font-semibold text-slate-400">Min Beholdning</span>
              </div>

              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-slate-200">
                  Aktiebeholdning ({portfolioSummary.holdingMetrics.length})
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditHoldingsOpen(true)}
                    className="flex items-center gap-1 text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Rediger</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("history")}
                    className="flex items-center gap-1 text-xs text-slate-400 font-semibold hover:underline"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Historik</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {portfolioSummary.holdingMetrics.map(item => (
                  <HoldingCard
                    key={item.stockId}
                    item={item}
                    currency={currency}
                    onClick={() => setSelectedHoldingMetric(item)}
                    isFlashingUp={flashingStockIds[item.stockId] === "up"}
                    isFlashingDown={flashingStockIds[item.stockId] === "down"}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "market" && (
            <div className="animate-fade-in">
              <WatchlistView
                stocks={stocks}
                watchlistIds={watchlistIds}
                onToggleWatchlist={handleToggleWatchlist}
                onSelectStock={(stk) => {
                  const metric = portfolioSummary.holdingMetrics.find(m => m.stockId === stk.id);
                  if (metric) {
                    setSelectedHoldingMetric(metric);
                  } else {
                    setSelectedHoldingMetric({
                      stockId: stk.id,
                      shares: 0,
                      avgBuyPrice: stk.currentPrice,
                      currentValue: 0,
                      totalCost: 0,
                      totalProfit: 0,
                      profitPercent: 0,
                      dayChange: 0,
                      dayChangePercent: stk.changePercent,
                      annualDividend: 0,
                      yieldOnCost: 0,
                      stock: stk
                    });
                  }
                }}
                onOpenTradeModal={handleOpenTradeForStock}
                onGoBack={() => setActiveTab("dashboard")}
              />
            </div>
          )}

          {activeTab === "dividends" && (
            <div className="animate-fade-in">
              <DividendView
                summary={portfolioSummary}
                currency={currency}
                onGoBack={() => setActiveTab("dashboard")}
              />
            </div>
          )}

          {activeTab === "history" && (
            <div className="animate-fade-in">
              <TransactionsView
                transactions={transactions}
                stocks={stocks}
                currency={currency}
                onDeleteTransaction={handleDeleteTransaction}
                onGoBack={() => setActiveTab("dashboard")}
              />
            </div>
          )}
        </div>

        {/* Mobil Bundnavigation */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenAddModal={() => {
            setTradeModalStockId(null);
            setTradeModalType("BUY");
            setIsAddModalOpen(true);
          }}
        />

        {/* Indtast Min Beholdning Modal */}
        {isEditHoldingsOpen && (
          <EditHoldingsModal
            stocks={stocks}
            holdings={holdings}
            onSaveHoldings={(newHoldings) => setHoldings(newHoldings)}
            onClose={() => setIsEditHoldingsOpen(false)}
          />
        )}

        {/* Tilføj Handel Modal */}
        {!isEditHoldingsOpen && isAddModalOpen && (
          <AddTransactionModal
            stocks={stocks}
            preselectedStockId={tradeModalStockId}
            initialType={tradeModalType}
            onClose={() => setIsAddModalOpen(false)}
            onSubmitTransaction={handleAddTransaction}
          />
        )}

        {/* Aktiedetalje Modal */}
        {!isEditHoldingsOpen && !isAddModalOpen && selectedHoldingMetric && (
          <HoldingDetailModal
            holdingMetric={selectedHoldingMetric}
            currency={currency}
            onClose={() => setSelectedHoldingMetric(null)}
            onOpenTradeModal={handleOpenTradeForStock}
            onDeleteHolding={handleDeleteHolding}
          />
        )}
      </main>
    </div>
  );
}
