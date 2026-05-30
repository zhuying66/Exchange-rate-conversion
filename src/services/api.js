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

// Frankfurter API — free, no key, ECB-sourced, JSON
const API_BASE = 'https://api.frankfurter.app';

let cachedRates = null;
let cacheDate = null;

async function getRates() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`${API_BASE}/latest?from=CNY`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();

    if (!data.rates || !data.date) {
      throw new Error('API response missing rates or date');
    }

    const cnyBased = { CNY: 1, ...data.rates };
    cachedRates = cnyBased;
    cacheDate = data.date;
    return { rates: cnyBased, date: data.date, source: 'live' };
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

export async function fetchLatestRates(baseCurrency = 'CNY') {
  const { rates: allRates, date, source } = await ensureRates();
  ratesPromise = getRates();

  const baseRate = allRates[baseCurrency];
  if (!baseRate) throw new Error('Unsupported currency: ' + baseCurrency);

  const rebased = {};
  for (const [code, rate] of Object.entries(allRates)) {
    rebased[code] = rate / baseRate;
  }
  return { rates: rebased, date, source };
}

export async function convertCurrency(amount, from, to) {
  const { rates: allRates } = await ensureRates();
  ratesPromise = getRates();

  const fromRate = allRates[from];
  const toRate = allRates[to];
  if (!fromRate) throw new Error('Unsupported currency: ' + from);
  if (!toRate) throw new Error('Unsupported currency: ' + to);

  const converted = (parseFloat(amount) / fromRate) * toRate;
  return { rates: { [to]: converted } };
}

export async function refreshRates() {
  ratesPromise = null;
  return ensureRates();
}

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
