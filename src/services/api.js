// 离线汇率数据（断网时使用）— 1 CNY = RATES[currency]
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

// 欧洲央行每日汇率 XML（免费、无需注册、无需 API Key）
// 提供 40+ 种货币的 EUR 基准汇率
const ECB_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

let cachedRates = null;
let cacheDate = null;

// 从 ECB XML 抓取实时汇率，失败则回退到离线数据
async function getRates() {
  try {
    const response = await fetch(ECB_URL, {
      headers: { 'Accept': 'application/xml' },
    });
    if (!response.ok) throw new Error('ECB 请求失败');
    const xml = await response.text();

    // 解析 XML：提取所有 <Cube currency="XXX" rate="X.XXX"/>
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

    // 提取日期
    const dateMatch = xml.match(/time="([\d-]+)"/);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);

    if (!rateMap.EUR || !rateMap.CNY) {
      throw new Error('ECB 数据缺少 EUR 或 CNY');
    }

    // ECB 数据以 EUR 为基准，转换为 CNY 基准
    // eurRate = rateMap[currency] = N 表示 1 EUR = N currency
    // 所以 1 EUR = rateMap.CNY CNY → 1 CNY = rateMap.EUR / rateMap.CNY EUR
    // 1 CNY = (1 / rateMap.CNY) EUR → 1 CNY = rateMap[currency] / rateMap.CNY units
    const cnyRate = rateMap.CNY; // 1 EUR = cnyRate CNY
    const cnyBased = {};
    for (const [code, eurVal] of Object.entries(rateMap)) {
      cnyBased[code] = eurVal / cnyRate;
    }

    cachedRates = cnyBased;
    cacheDate = date;
    return { rates: cnyBased, date };
  } catch {
    // 网络失败 → 使用缓存或离线数据
    if (cachedRates) {
      return { rates: cachedRates, date: cacheDate };
    }
    const rates = {};
    for (const [code, rate] of Object.entries(OFFLINE_RATES)) {
      rates[code] = rate;
    }
    return { rates, date: '2026-05-23' };
  }
}

let ratesPromise = null;

function ensureRates() {
  if (!ratesPromise) {
    ratesPromise = getRates();
  }
  return ratesPromise;
}

// 以指定货币为基准，返回所有货币的汇率
export async function fetchLatestRates(baseCurrency = 'CNY') {
  const { rates: allRates, date } = await ensureRates();
  // 每次请求都尝试刷新（后台更新缓存），但不阻塞返回
  ratesPromise = getRates();

  const baseRate = allRates[baseCurrency];
  if (!baseRate) throw new Error('不支持的货币: ' + baseCurrency);

  const rebased = {};
  for (const [code, rate] of Object.entries(allRates)) {
    rebased[code] = rate / baseRate;
  }
  return { rates: rebased, date };
}

// 本地计算货币转换（优先用实时汇率）
export async function convertCurrency(amount, from, to) {
  const { rates: allRates } = await ensureRates();
  // 后台刷新
  ratesPromise = getRates();

  const fromRate = allRates[from];
  const toRate = allRates[to];
  if (!fromRate) throw new Error('不支持的货币: ' + from);
  if (!toRate) throw new Error('不支持的货币: ' + to);

  const converted = (parseFloat(amount) / fromRate) * toRate;
  return { rates: { [to]: converted } };
}

// 强制刷新汇率（下拉刷新时调用）
export async function refreshRates() {
  ratesPromise = null;
  return ensureRates();
}

// 自动定时刷新
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

// 常用的货币列表（中文标签 + 国旗）
export const POPULAR_CURRENCIES = [
  { code: 'CNY', label: '人民币 (CNY)', flag: '🇨🇳' },
  { code: 'USD', label: '美元 (USD)', flag: '🇺🇸' },
  { code: 'EUR', label: '欧元 (EUR)', flag: '🇪🇺' },
  { code: 'JPY', label: '日元 (JPY)', flag: '🇯🇵' },
  { code: 'GBP', label: '英镑 (GBP)', flag: '🇬🇧' },
  { code: 'HKD', label: '港币 (HKD)', flag: '🇭🇰' },
  { code: 'KRW', label: '韩元 (KRW)', flag: '🇰🇷' },
  { code: 'AUD', label: '澳元 (AUD)', flag: '🇦🇺' },
  { code: 'CAD', label: '加元 (CAD)', flag: '🇨🇦' },
  { code: 'CHF', label: '瑞士法郎 (CHF)', flag: '🇨🇭' },
  { code: 'SGD', label: '新加坡元 (SGD)', flag: '🇸🇬' },
  { code: 'THB', label: '泰铢 (THB)', flag: '🇹🇭' },
  { code: 'TWD', label: '新台币 (TWD)', flag: '🇹🇼' },
  { code: 'MYR', label: '马来西亚林吉特 (MYR)', flag: '🇲🇾' },
  { code: 'INR', label: '印度卢比 (INR)', flag: '🇮🇳' },
  { code: 'RUB', label: '卢布 (RUB)', flag: '🇷🇺' },
  { code: 'BRL', label: '巴西雷亚尔 (BRL)', flag: '🇧🇷' },
  { code: 'MXN', label: '墨西哥比索 (MXN)', flag: '🇲🇽' },
];
