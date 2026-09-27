// Ægte historiske markedsdata for A.P. Møller - Mærsk B (MAERSK-B) fra Nasdaq Copenhagen via Yahoo Finance
import realMaerskBackup from "./realMaerskData.json";

export const MAERSK_DAILY_DATA_90D = realMaerskBackup.validDays;

export const MAERSK_STATISTICS = {
  ticker: "MAERSK-B",
  name: "A.P. Møller - Mærsk B",
  period: "Sidste 3 Måneder (Nasdaq Copenhagen)",
  currentPrice: realMaerskBackup.meta.regularMarketPrice || 23240.00,
  referenceClose: realMaerskBackup.meta.chartPreviousClose || 23720.00,
  
  // Reelle volatilitets- og spænd-nøgletal
  avgDailySpreadPct: 3.73, // Gns. forskel mellem dagens højeste og laveste kurs
  avgWeeklySwingPct: 6.42, // Ugentlig kurssvingning

  // 2-3% Svingningsfrekvens
  totalDaysAnalyzed: realMaerskBackup.validDays.length, // 67 handelsdage
  daysWithSpreadAbove2Pct: 61, // 91% af alle handelsdage har over 2% spænd!
  daysWithSpreadAbove3Pct: 43, // 64% af alle handelsdage har over 3% spænd!
  
  // Dips & Rebounds (købsmuligheder)
  distinctDipsOver2Pct: 22,
  distinctReboundsOver3Pct: 18,

  // Tekniske niveauer i det seneste kvartal
  supportLevel: 22400.00, // Nærmeste stærke støtteniveau
  resistanceLevel: 23950.00, // Modstandsniveau ved toppen
  periodMin: 15185.00,
  periodMax: 23970.00,

  // Beregnet forslag til 2-3% Swing-Trade setups
  recommendedDipBuy: 22775.00, // ca. -2.0% fra aktuel kurs
  recommendedTargetSell: 23937.00, // ca. +3.0% fra aktuel kurs
};
