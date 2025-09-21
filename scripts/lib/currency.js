const CURRENCY_LOCALES = {
  USD: 'en-US',
  BRL: 'pt-BR',
  ARS: 'es-AR',
};

const formatterCache = new Map();
const DEFAULT_CURRENCY_OPTIONS = {
  style: 'currency',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
};

function getLocale(currency) {
  return CURRENCY_LOCALES[currency] || 'en-US';
}

function getFormatter(currency, options = {}) {
  const key = `${currency}|${JSON.stringify(options)}`;
  if (!formatterCache.has(key)) {
    formatterCache.set(
      key,
      new Intl.NumberFormat(getLocale(currency), {
        ...options,
        currency,
      }),
    );
  }
  return formatterCache.get(key);
}

export function formatMoney(value, currency, overrides = {}) {
  if (value == null) return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  const formatter = getFormatter(currency, { ...DEFAULT_CURRENCY_OPTIONS, ...overrides, style: 'currency' });
  return formatter.format(amount);
}

export function formatRate(value, currency) {
  if (value == null) return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  const formatter = getFormatter(currency, {
    style: 'currency',
    minimumFractionDigits: 3,
    maximumFractionDigits: 6,
  });
  return formatter.format(amount);
}
