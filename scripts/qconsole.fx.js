import { fetchJson } from './lib/fetcher.js';
import { formatMoney, formatRate } from './lib/currency.js';

const SUPPORTED = ['USD', 'BRL', 'ARS'];
const CACHE_TTL = 5 * 60 * 1000;
// Para trocar provedores FX/Cripto, edite data/providers.json conforme necessidade.
const DEFAULT_CONFIG = {
  fx: 'frankfurter',
  fx_base_url: 'https://api.frankfurter.dev',
  crypto: 'coingecko',
  crypto_base_url: 'https://api.coingecko.com/api/v3',
};

const PROVIDER_DEFAULTS = {
  frankfurter: 'https://api.frankfurter.dev',
  'exchangerate.host': 'https://api.exchangerate.host',
};

const cache = new Map();
let providers = null;
let latest = null;

function normalizeSymbols(symbols) {
  if (!Array.isArray(symbols)) return SUPPORTED;
  return symbols.filter(Boolean);
}

function getBaseUrl(name, explicit) {
  if (explicit) return explicit.replace(/\/$/, '');
  return (name && PROVIDER_DEFAULTS[name]) || PROVIDER_DEFAULTS.frankfurter;
}

async function loadProviders() {
  if (providers) return providers;
  try {
    const data = await fetchJson('./data/providers.json');
    providers = { ...DEFAULT_CONFIG, ...data };
  } catch (error) {
    console.warn('[qconsole.fx] Não foi possível carregar providers.json, usando padrão.', error);
    providers = { ...DEFAULT_CONFIG };
  }
  return providers;
}

async function requestRates(providerName, baseUrl, base, symbols) {
  const urlBase = getBaseUrl(providerName, baseUrl);
  const params = new URLSearchParams();
  if (providerName === 'frankfurter') {
    params.set('from', base);
    params.set('to', symbols.join(','));
    params.set('amount', '1');
    const url = `${urlBase}/latest?${params.toString()}`;
    const response = await fetchJson(url);
    if (!response?.rates) throw new Error('Resposta sem rates do provedor frankfurter');
    return {
      provider: providerName,
      base: response.base || base,
      rates: response.rates,
      fetchedAt: new Date().toISOString(),
    };
  }

  if (providerName === 'exchangerate.host') {
    params.set('base', base);
    params.set('symbols', symbols.join(','));
    const url = `${urlBase}/latest?${params.toString()}`;
    const response = await fetchJson(url);
    if (!response?.rates) throw new Error('Resposta sem rates do provedor exchangerate.host');
    return {
      provider: providerName,
      base: response.base || base,
      rates: response.rates,
      fetchedAt: response.date ? new Date(response.date).toISOString() : new Date().toISOString(),
    };
  }

  throw new Error(`Provedor FX não suportado: ${providerName}`);
}

export async function fetchFX(base = 'USD', symbols = SUPPORTED, options = {}) {
  const list = normalizeSymbols(symbols);
  const cacheKey = `${base}|${list.sort().join(',')}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && !options.force && now - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  const config = await loadProviders();
  const primary = config.fx;
  const baseUrl = config.fx_base_url;

  const providersToTry = [primary];
  if (primary !== 'frankfurter') providersToTry.push('frankfurter');
  if (primary !== 'exchangerate.host') providersToTry.push('exchangerate.host');

  let lastError = null;
  for (const providerName of providersToTry) {
    try {
      const data = await requestRates(providerName, providerName === primary ? baseUrl : undefined, base, list);
      cache.set(cacheKey, { timestamp: now, value: data });
      return data;
    } catch (error) {
      lastError = error;
      console.warn(`[qconsole.fx] Falha ao buscar FX de ${providerName}`, error);
    }
  }
  throw lastError || new Error('Não foi possível obter taxas de câmbio');
}

function ensureRates() {
  if (!latest) throw new Error('Taxas de câmbio indisponíveis');
  return latest;
}

export function convert(amount, from, to) {
  const value = Number(amount);
  if (Number.isNaN(value)) return NaN;
  const { base, rates } = ensureRates();
  if (!rates) return NaN;
  if (from === to) return value;

  const normalizedRates = new Map(Object.entries({ ...rates, [base]: 1 }));
  if (!normalizedRates.has(from) || !normalizedRates.has(to)) {
    throw new Error(`Conversão não suportada: ${from} -> ${to}`);
  }

  const baseAmount = from === base ? value : value / normalizedRates.get(from);
  return to === base ? baseAmount : baseAmount * normalizedRates.get(to);
}

function renderPairs(container) {
  if (!container) return;
  const pairs = [
    ['USD', 'BRL'],
    ['USD', 'ARS'],
    ['BRL', 'ARS'],
  ];
  const ratesData = ensureRates();
  container.innerHTML = '';
  pairs.forEach(([from, to]) => {
    try {
      const direct = convert(1, from, to);
      const inverse = convert(1, to, from);
      const card = document.createElement('article');
      card.className = 'fx-card';
      const heading = document.createElement('h3');
      heading.textContent = `${from} ↔ ${to}`;
      const directText = document.createElement('p');
      directText.innerHTML = `<strong>${formatRate(direct, to)}</strong> 1 ${from}`;
      const inverseText = document.createElement('p');
      inverseText.innerHTML = `<strong>${formatRate(inverse, from)}</strong> 1 ${to}`;
      card.append(heading, directText, inverseText);
      container.appendChild(card);
    } catch (error) {
      console.warn('[qconsole.fx] Erro ao renderizar par', from, to, error);
    }
  });
}

function updateProviderMeta(providerElement, updatedElement) {
  if (providerElement) {
    providerElement.textContent = providers ? String(providers.fx) : '—';
  }
  if (updatedElement && latest?.fetchedAt) {
    const date = new Date(latest.fetchedAt);
    updatedElement.textContent = date.toLocaleString('pt-BR');
    updatedElement.dateTime = date.toISOString();
  }
}

function renderConverterResults(resultsElement, amountInput, fromSelect) {
  if (!resultsElement || !fromSelect) return;
  const value = Number(amountInput?.value);
  if (!value || Number.isNaN(value) || value <= 0) {
    resultsElement.textContent = 'Digite um valor e selecione a moeda de origem para ver as conversões em USD, BRL e ARS.';
    return;
  }

  const from = fromSelect.value;
  const targets = SUPPORTED.filter((currency) => currency !== from);
  const pieces = targets.map((target) => {
    try {
      const converted = convert(value, from, target);
      return `${target}: ${formatMoney(converted, target)}`;
    } catch (error) {
      console.warn('[qconsole.fx] Falha ao converter', from, target, error);
      return `${target}: indisponível`;
    }
  });
  resultsElement.textContent = `${formatMoney(value, from)} equivalem a ${pieces.join(' • ')}`;
}

export async function initFX(options = {}) {
  const {
    ratesContainer,
    providerElement,
    updatedElement,
    resultsElement,
    amountInput,
    fromSelect,
    converterForm,
    refreshButton,
  } = options;

  await loadProviders();

  async function refresh(force = false) {
    try {
      latest = await fetchFX('USD', SUPPORTED.filter((currency) => currency !== 'USD'), { force });
      renderPairs(ratesContainer);
      updateProviderMeta(providerElement, updatedElement);
      renderConverterResults(resultsElement, amountInput, fromSelect);
    } catch (error) {
      console.error('[qconsole.fx] Falha ao atualizar câmbio', error);
      if (ratesContainer) {
        ratesContainer.innerHTML = '<article class="fx-card"><p>Não foi possível atualizar agora.</p></article>';
      }
      if (resultsElement) {
        resultsElement.textContent = 'Não foi possível atualizar agora.';
      }
    }
  }

  if (converterForm && amountInput && fromSelect) {
    converterForm.addEventListener('submit', (event) => {
      event.preventDefault();
      renderConverterResults(resultsElement, amountInput, fromSelect);
    });
    amountInput.addEventListener('input', () => renderConverterResults(resultsElement, amountInput, fromSelect));
    fromSelect.addEventListener('change', () => renderConverterResults(resultsElement, amountInput, fromSelect));
  }

  if (refreshButton) {
    refreshButton.addEventListener('click', () => refresh(true));
  }

  await refresh();

  return {
    providers: Object.freeze({ ...providers }),
    refresh,
    convert,
    getRates: () => (latest ? { ...latest } : null),
  };
}
