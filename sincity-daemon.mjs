import http from 'http';
import fs from 'fs';

const NTFY_TOPIC = "sincity_aktie_radar_23";
const CONFIG_FILE = "daemon-config.json";

// Default configs if file is missing
let alertConfigs = {
  zealand: { isEnabled: true, referencePrice: 272.70, dropPctThreshold: 2.0, risePctThreshold: 3.0, soundEnabled: true, mode: "BUY" },
  maersk: { isEnabled: true, referencePrice: 23240.00, dropPctThreshold: 2.0, risePctThreshold: 3.0, soundEnabled: true, mode: "BUY" },
  ambu: { isEnabled: true, referencePrice: 68.20, dropPctThreshold: 2.0, risePctThreshold: 3.0, soundEnabled: true, mode: "BUY" }
};

// Map of internal IDs to actual Yahoo Finance tickers
const TICKER_MAP = {
  zealand: { symbol: 'ZEAL', label: 'Zealand Pharma' },
  maersk: { symbol: 'MAERSK-B', label: 'Mærsk B' },
  ambu: { symbol: 'AMBU-B', label: 'Ambu B' }
};

// Spam protection state
const lastAlertSent = {}; 

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      alertConfigs = JSON.parse(data);
    }
  } catch (err) {
    console.error("Fejl ved læsning af config:", err.message);
  }
}

function saveConfig(data) {
  try {
    alertConfigs = data;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
    console.log(`[${new Date().toLocaleTimeString()}] ⚙️ Daemon modtog ny Target/Mode fra Appen!`);
  } catch (err) {
    console.error("Fejl ved gem config:", err.message);
  }
}

// HTTP Server so the React App can sync its state to the Daemon
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/update-config') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        saveConfig(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(alertConfigs));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3001, () => {
  console.log(`\n======================================================`);
  console.log(`🔔 SINCITY DAEMON STARTET (FASE 2: MODE-AWARE)`);
  console.log(`======================================================`);
  console.log(`📡 Venter på konfigurationer fra Frontend (Port 3001)`);
  console.log(`📱 Push-notifikationer kører via Ntfy.sh`);
  console.log(`👉 Abonnér på: ${NTFY_TOPIC}`);
  console.log(`======================================================\n`);
  loadConfig();
  checkMarkets();
});

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
    console.error("Kunne ikke sende push-besked", err.message);
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
  const hours = now.getHours();
  const minutes = now.getMinutes();

  if (hours === 0) lastAlertSent['morning_briefing'] = 0;

  // Weekend check
  if (day === 0 || day === 6) {
    console.log(`[${now.toLocaleTimeString()}] 🛑 Børsen er lukket (Weekend). Venter...`);
    return;
  }

  // Morning briefing 08:50 - 09:00
  if (hours === 8 && minutes >= 50 && hours < 9) {
    const lastBriefing = lastAlertSent['morning_briefing'] || 0;
    if (now.getTime() - lastBriefing > 12 * 60 * 60 * 1000) {
      await sendPushNotification(
        "☕ Morgen Briefing",
        "Goddag. Markedet åbner om kort tid. Dine radarer er armeret og klar til action.",
        true
      );
      lastAlertSent['morning_briefing'] = now.getTime();
    }
  }

  // Closed hours check
  if (hours < 9 || hours >= 17) {
    console.log(`[${now.toLocaleTimeString()}] 🛑 Børsen er lukket (Udenfor åbningstid). Venter...`);
    return;
  }

  console.log(`[${now.toLocaleTimeString()}] 🔎 Læser markedet...`);

  for (const [id, config] of Object.entries(alertConfigs)) {
    if (!config.isEnabled) continue;
    
    const stockInfo = TICKER_MAP[id];
    if (!stockInfo) continue;

    const price = await fetchLivePrice(stockInfo.symbol);
    if (!price) continue;

    const buyTarget = config.referencePrice * (1 - config.dropPctThreshold / 100);
    const sellTarget = config.referencePrice * (1 + config.risePctThreshold / 100);

    // MODE LOGIC (The core upgrade)
    if (config.mode !== "SELL") {
      // BUY MODE (Kun fokus på dyk)
      if (price <= buyTarget) {
        const lastSent = lastAlertSent[`${id}_buy`] || 0;
        if (now.getTime() - lastSent > 30 * 60 * 1000) { // Max 1 notifikation pr 30 min
          await sendPushNotification(
            `KØBSSIGNAL: ${stockInfo.label}`,
            `${stockInfo.label} er nede i ${price} kr. (Faldet mere end ${config.dropPctThreshold}%). Klar til KØB!`,
            true
          );
          lastAlertSent[`${id}_buy`] = now.getTime();
        }
      }
    } else {
      // SELL MODE (Kun fokus på stigninger)
      if (price >= sellTarget) {
        const lastSent = lastAlertSent[`${id}_sell`] || 0;
        if (now.getTime() - lastSent > 30 * 60 * 1000) {
          await sendPushNotification(
            `SALGSSIGNAL: ${stockInfo.label}`,
            `${stockInfo.label} er oppe i ${price} kr. (Steget mere end ${config.risePctThreshold}%). Tag profit!`,
            false
          );
          lastAlertSent[`${id}_sell`] = now.getTime();
        }
      }
    }
  }
}

// Check hver 60. sekund (1 minut)
setInterval(checkMarkets, 60 * 1000);
