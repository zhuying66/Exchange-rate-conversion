// Offline exchange rates (fallback) — 1 CNY = RATES[currency]
const OFFLINE_RATES = {
  CNY: 1,
  USD: 0.138,
  EUR: 0.128,
  JPY: 21.5,
  GBP: 0.110,
  HKD: 1.08,
  KRW: 191,
  AUD: 0.212,
  CAD: 0.189,
  CHF: 0.124,
  SGD: 0.186,
  THB: 4.85,
  TWD: 4.45,
  MYR: 0.648,
  INR: 11.7,
  RUB: 13.5,
  BRL: 0.70,
  MXN: 2.35,
};

// European Central Bank daily exchange rate XML (free, no API key required)
// Provides EUR-based rates for 40+ currencies
const ECB_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

let cachedRates = null;
let cacheDate = null;

// Fetch rates from ECB XML, fall back to offline data on failure
async function getRates() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(ECB_URL, {
      headers: { 'Accept': 'application/xml' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error('ECB request failed');
    const xml = await response.text();

    // Parse XML: extract all <Cube currency="XXX" rate="X.XXX"/>
    const rateMap = {};
    const currencyRe = /currency="(\w+)"/g;
    const rateRe = /rate="([\d.]+)"/g;

    const currencies = [];
    const rates = [];
    let m;
    while ((m = currencyRe.exec(xml)) !== null) currencies.push(m[1]);
    while ((m = rateRe.exec(xml)) !== null) rates.push(parseFloat(m[1]));

    for (let i = 0; i < currencies.length; i++) {
      rateMap[currencies[i]] = rates[i];
    }

    const dateMatch = xml.match(/time="([\d-]+)"/);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);

    if (!rateMap.EUR || !rateMap.CNY) {
      throw new Error('ECB data missing EUR or CNY');
    }

    const cnyRate = rateMap.CNY;
    const cnyBased = {};
    for (const [code, eurVal] of Object.entries(rateMap)) {
      cnyBased[code] = eurVal / cnyRate;
    }

    cachedRates = cnyBased;
    cacheDate = date;
    return { rates: cnyBased, date, source: 'live' };
  } catch {
    if (cachedRates) {
      return { rates: cachedRates, date: cacheDate, source: 'cache' };
    }
    const rates = {};
    for (const [code, rate] of Object.entries(OFFLINE_RATES)) {
      rates[code] = rate;
    }
    return { rates, date: '2026-05-23', source: 'offline' };
  }
}

let ratesPromise = null;

function ensureRates() {
  if (!ratesPromise) {
    ratesPromise = getRates();
  }
  return ratesPromise;
}

// Return all currency rates rebased to the specified base currency
export async function fetchLatestRates(baseCurrency = 'CNY') {
  const { rates: allRates, date, source } = await ensureRates();
  // Trigger background refresh without blocking the current response
  ratesPromise = getRates();

  const baseRate = allRates[baseCurrency];
  if (!baseRate) throw new Error('Unsupported currency: ' + baseCurrency);

  const rebased = {};
  for (const [code, rate] of Object.entries(allRates)) {
    rebased[code] = rate / baseRate;
  }
  return { rates: rebased, date, source };
}

// Convert an amount between two currencies
export async function convertCurrency(amount, from, to) {
  const { rates: allRates } = await ensureRates();
  // Background refresh
  ratesPromise = getRates();

  const fromRate = allRates[from];
  const toRate = allRates[to];
  if (!fromRate) throw new Error('Unsupported currency: ' + from);
  if (!toRate) throw new Error('Unsupported currency: ' + to);

  const converted = (parseFloat(amount) / fromRate) * toRate;
  return { rates: { [to]: converted } };
}

// Force refresh rates (called on pull-to-refresh)
export async function refreshRates() {
  ratesPromise = null;
  return ensureRates();
}

// Auto-refresh timer
let autoRefreshTimer = null;

export function startAutoRefresh(intervalMs, onRefresh) {
  stopAutoRefresh();
  autoRefreshTimer = setInterval(async () => {
    try {
      await refreshRates();
      if (onRefresh) onRefresh();
    } catch {}
  }, intervalMs);
}

export function stopAutoRefresh() {
  if (autoRefreshTimer !== null) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

export const CURRENCIES = [
  { code: 'CNY', flag: '🇨🇳' },
  { code: 'USD', flag: '🇺🇸' },
  { code: 'EUR', flag: '🇪🇺' },
  { code: 'JPY', flag: '🇯🇵' },
  { code: 'GBP', flag: '🇬🇧' },
  { code: 'HKD', flag: '🇭🇰' },
  { code: 'KRW', flag: '🇰🇷' },
  { code: 'AUD', flag: '🇦🇺' },
  { code: 'CAD', flag: '🇨🇦' },
  { code: 'CHF', flag: '🇨🇭' },
  { code: 'SGD', flag: '🇸🇬' },
  { code: 'THB', flag: '🇹🇭' },
  { code: 'TWD', flag: '🇹🇼' },
  { code: 'MYR', flag: '🇲🇾' },
  { code: 'INR', flag: '🇮🇳' },
  { code: 'RUB', flag: '🇷🇺' },
  { code: 'BRL', flag: '🇧🇷' },
  { code: 'MXN', flag: '🇲🇽' },
];
