// Opsætning af din hemmelige notifikations-kanal
// Download appen "ntfy" på din telefon og abonnér på dette præcise emne:
const NTFY_TOPIC = "sincity_aktie_radar_23";
console.log(`\n======================================================`);
console.log(`🔔 SINCITY BAGGRUNDS DAEMON STARTET`);
console.log(`======================================================`);
console.log(`1. Download appen 'ntfy' på din iPhone eller Android.`);
console.log(`2. Tryk på '+' og abonnér på dette emne:\n\n   👉 ${NTFY_TOPIC} 👈\n`);
console.log(`3. Lad dette terminalvindue køre i baggrunden.`);
console.log(`======================================================\n`);

// Konfigurer de aktier, du vil overvåge og dine KØBS/SALGS-mål
const PORTFOLIO_TARGETS = [
  { symbol: 'MAERSK-B', triggerBuyBelow: 9500, triggerSellAbove: 10500, label: "Mærsk B" },
  { symbol: 'ZEAL', triggerBuyBelow: 800, triggerSellAbove: 950, label: "Zealand Pharma" },
  { symbol: 'AMBU-B', triggerBuyBelow: 115, triggerSellAbove: 135, label: "Ambu" }
];

async function sendPushNotification(title, message, isBuy = true) {
  try {
    await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      body: message,
      headers: {
        'Title': title,
        'Tags': isBuy ? 'dart,chart_with_downwards_trend' : 'rocket,chart_with_upwards_trend',
        'Priority': 'default'
      }
    });
    console.log(`[${new Date().toLocaleTimeString()}] 📨 Push-besked sendt!`);
  } catch (err) {
    console.error("Kunne ikke sende push-besked", err);
  }
}

async function fetchLivePrice(ticker) {
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.CO?interval=1d&range=1d`);
    const data = await response.json();
    return data.chart?.result?.[0]?.meta?.regularMarketPrice;
  } catch (err) {
    return null;
  }
}

async function checkMarkets() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  // Kør kun på hverdage (Mandag=1, Fredag=5) mellem kl 09:00 og 17:00
  // if (day === 0 || day === 6 || hour < 9 || hour >= 17) {
  //   console.log(`[${now.toLocaleTimeString()}] Børsen er lukket. Venter...`);
  //   return;
  // }

  console.log(`[${now.toLocaleTimeString()}] 🔎 Tjekker aktiekurser på Nasdaq Copenhagen...`);

  for (const stock of PORTFOLIO_TARGETS) {
    const price = await fetchLivePrice(stock.symbol);
    if (!price) continue;

    console.log(`  - ${stock.label}: ${price} DKK`);

    // Tjek Købssignal
    if (price <= stock.triggerBuyBelow) {
      await sendPushNotification(
        `KØBSSIGNAL: ${stock.label}`,
        `${stock.label} er nede i ${price} DKK. Den er under din købsgrænse på ${stock.triggerBuyBelow}!`,
        true
      );
    }
    // Tjek Salgssignal
    else if (price >= stock.triggerSellAbove) {
      await sendPushNotification(
        `SALGSSIGNAL: ${stock.label}`,
        `${stock.label} har ramt ${price} DKK. Tag profit! (+2-3% målet er nået over ${stock.triggerSellAbove})`,
        false
      );
    }
  }
}

// Kør første tjek med det samme
checkMarkets();

// Kør derefter hvert 15. minut (15 * 60 * 1000 ms)
setInterval(checkMarkets, 15 * 60 * 1000);
