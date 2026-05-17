// 免费汇率 API，无需注册 key
const BASE_URL = 'https://api.frankfurter.app';

export async function fetchLatestRates(baseCurrency = 'CNY') {
  const response = await fetch(`${BASE_URL}/latest?from=${baseCurrency}`);
  if (!response.ok) throw new Error('获取汇率失败');
  return response.json();
}

export async function convertCurrency(amount, from, to) {
  const response = await fetch(
    `${BASE_URL}/latest?amount=${amount}&from=${from}&to=${to}`
  );
  if (!response.ok) throw new Error('转换失败');
  return response.json();
}

export async function fetchCurrencies() {
  const response = await fetch(`${BASE_URL}/currencies`);
  if (!response.ok) throw new Error('获取货币列表失败');
  return response.json();
}

// 常用的货币列表（中文标签）
export const POPULAR_CURRENCIES = [
  { code: 'CNY', label: '人民币 (CNY)' },
  { code: 'USD', label: '美元 (USD)' },
  { code: 'EUR', label: '欧元 (EUR)' },
  { code: 'JPY', label: '日元 (JPY)' },
  { code: 'GBP', label: '英镑 (GBP)' },
  { code: 'HKD', label: '港币 (HKD)' },
  { code: 'KRW', label: '韩元 (KRW)' },
  { code: 'AUD', label: '澳元 (AUD)' },
  { code: 'CAD', label: '加元 (CAD)' },
  { code: 'CHF', label: '瑞士法郎 (CHF)' },
  { code: 'SGD', label: '新加坡元 (SGD)' },
  { code: 'THB', label: '泰铢 (THB)' },
  { code: 'TWD', label: '新台币 (TWD)' },
  { code: 'MYR', label: '马来西亚林吉特 (MYR)' },
  { code: 'INR', label: '印度卢比 (INR)' },
  { code: 'RUB', label: '卢布 (RUB)' },
  { code: 'BRL', label: '巴西雷亚尔 (BRL)' },
  { code: 'MXN', label: '墨西哥比索 (MXN)' },
];
