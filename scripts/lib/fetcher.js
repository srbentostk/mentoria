// Implementa camada de fetch resiliente (timeout + backoff); atualize junto com politicas Q-Branch.
// [codex-edit] Novo helper para requisoes seguras com parse JSON com guardas.

const DEFAULT_TIMEOUT = 8000;
const DEFAULT_RETRIES = 2;
const DEFAULT_BACKOFF_BASE = 2;
const DEFAULT_RETRY_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const DEFAULT_RETRY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createTimeoutController(timeout, externalSignal) {
  const controller = new AbortController();
  let timeoutId = null;
  if (typeof timeout === 'number' && timeout > 0) {
    timeoutId = setTimeout(() => {
      controller.abort(new DOMException('safeFetch timeout', 'TimeoutError'));
    }, timeout);
  }

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener('abort', () => {
        controller.abort(externalSignal.reason);
      }, { once: true });
    }
  }

  return {
    signal: controller.signal,
    dispose() {
      if (timeoutId) clearTimeout(timeoutId);
    },
  };
}

function shouldRetry(response, method, retryStatus) {
  return response && retryStatus.has(response.status) && DEFAULT_RETRY_METHODS.has(method.toUpperCase());
}

export async function safeFetch(input, init = {}, config = {}) {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    backoffBase = DEFAULT_BACKOFF_BASE,
    retryStatus = DEFAULT_RETRY_STATUS,
  } = config;

  const method = (init.method || 'GET').toUpperCase();
  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    const { signal, dispose } = createTimeoutController(timeout, init.signal);
    try {
      const response = await fetch(input, { ...init, signal });
      if (!shouldRetry(response, method, retryStatus)) {
        dispose();
        return response;
      }
      lastError = new Error(`safeFetch retryable status ${response.status}`);
    } catch (error) {
      lastError = error;
      if (error?.name === 'AbortError' && init.signal?.aborted) {
        dispose();
        throw error;
      }
    }

    dispose();

    if (attempt === retries) {
      throw lastError ?? new Error('safeFetch failed');
    }

    const delay = Math.max(100, Math.floor(timeout * Math.pow(backoffBase, attempt)));
    await wait(delay);
    attempt += 1;
  }

  throw lastError ?? new Error('safeFetch exhausted without explicit error');
}

export async function safeJson(response) {
  if (!response) throw new TypeError('safeJson: response obrigatorio');
  const contentType = response.headers?.get?.('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new TypeError(`safeJson: content-type inesperado "${contentType}"`);
  }
  return response.json();
}

export async function fetchJson(input, init, config) {
  const response = await safeFetch(input, init, config);
  return safeJson(response);
}
