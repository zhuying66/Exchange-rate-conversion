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

const TIMEOUT_MS = 8000;

function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

// --- API sources (ordered by priority) ---

const API_SOURCES = [
  {
    name: 'Frankfurter',
    label: 'Frankfurter',
    fetch: async () => {
      const res = await fetchWithTimeout('https://api.frankfurter.app/latest?from=CNY');
      if (!res.ok) throw new Error('Frankfurter failed');
      const data = await res.json();
      if (!data.rates || !data.date) throw new Error('Missing rates');
      return { rates: { CNY: 1, ...data.rates }, date: data.date };
    },
  },
  {
    name: 'OpenER',
    label: 'open.er-api.com',
    fetch: async () => {
      const res = await fetchWithTimeout('https://open.er-api.com/v6/latest/CNY');
      if (!res.ok) throw new Error('OpenER failed');
      const data = await res.json();
      if (data.result !== 'success' || !data.rates) throw new Error('Missing rates');
      // Extract date from time_last_update_utc or time_last_update_unix
      let date = null;
      if (data.time_last_update_unix) {
        date = new Date(data.time_last_update_unix * 1000).toISOString().slice(0, 10);
      }
      return { rates: { CNY: 1, ...data.rates }, date: date || new Date().toISOString().slice(0, 10) };
    },
  },
  {
    name: 'ExRateFun',
    label: 'exchangerate.fun',
    fetch: async () => {
      const res = await fetchWithTimeout('https://api.exchangerate.fun/latest?base=CNY');
      if (!res.ok) throw new Error('ExRateFun failed');
      const data = await res.json();
      if (!data.rates) throw new Error('Missing rates');
      return { rates: { CNY: 1, ...data.rates }, date: data.date || new Date().toISOString().slice(0, 10) };
    },
  },
];

const REQUIRED_CURRENCIES = [
  'CNY','USD','EUR','JPY','GBP','HKD','KRW','AUD','CAD',
  'CHF','SGD','THB','TWD','MYR','INR','RUB','BRL','MXN',
];

// ... existing CURRENCIES export ...

// --- Cache ---
let cachedRates = null;
let cacheDate = null;

async function getRates() {
  for (const source of API_SOURCES) {
    try {
      const data = await source.fetch();
      // Verify all required currencies are present
      const missing = REQUIRED_CURRENCIES.filter(c => !(c in data.rates));
      if (missing.length > 0) {
        console.log(`[api] ${source.name} missing:`, missing.join(', '));
        throw new Error(`${source.name} missing currencies: ${missing.join(',')}`);
      }
      cachedRates = data.rates;
      cacheDate = data.date;
      return { ...data, source: source.name };
    } catch (e) {
      console.log(`[api] ${source.name} failed:`, e.message);
    }
  }

  // All APIs failed — use cache or offline
  if (cachedRates) {
    return { rates: cachedRates, date: cacheDate, source: 'cache' };
  }
  const rates = {};
  for (const [code, rate] of Object.entries(OFFLINE_RATES)) {
    rates[code] = rate;
  }
  return { rates, date: '2026-05-23', source: 'offline' };
}

// --- Exported interface ---

let ratesPromise = null;

function ensureRates() {
  if (!ratesPromise) {
    ratesPromise = getRates();
  }
  return ratesPromise;
}

export async function fetchLatestRates(baseCurrency = 'CNY') {
  const { rates: allRates, date, source } = await ensureRates();
  // Background refresh for next call
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

// --- Auto-refresh ---

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

// --- Source label helper ---

export function getSourceLabel(source) {
  const map = {
    Frankfurter: 'Frankfurter',
    OpenER: 'open.er-api.com',
    ExRateFun: 'exchangerate.fun',
    cache: 'cache',
    offline: 'offline',
  };
  return map[source] || source;
}

// --- Currencies ---

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
