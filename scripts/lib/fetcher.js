ï»¿// Implementa camada de fetch resiliente (timeout + backoff); atualize junto com politicas Q-Branch.


// [codex-edit] Novo helper para requisoes seguras com parse JSON com guardas.





const DEFAULT_TIMEOUT = 8000;


const DEFAULT_RETRIES = 3;


const DEFAULT_BACKOFF_STEP = 300;


const DEFAULT_RETRY_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);


const DEFAULT_RETRY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);





function wait(ms) {


  return new Promise((resolve) => setTimeout(resolve, ms));


}





function createTimeoutError() {


  if (typeof DOMException === 'function') {


    return new DOMException('safeFetch timeout', 'TimeoutError');


  }


  const error = new Error('safeFetch timeout');


  error.name = 'TimeoutError';


  return error;


}





function createAbortError() {


  if (typeof DOMException === 'function') {


    return new DOMException('Aborted', 'AbortError');


  }


  const error = new Error('Aborted');


  error.name = 'AbortError';


  return error;


}





function createTimeoutController(timeout, externalSignals = []) {


  const controller = new AbortController();


  let timeoutId = null;





  const abort = (reason) => {


    if (!controller.signal.aborted) {


      controller.abort(reason);


    }


  };





  if (typeof timeout === 'number' && timeout > 0) {


    timeoutId = setTimeout(() => {


      abort(createTimeoutError());


    }, timeout);


  }





  externalSignals.forEach((externalSignal) => {


    if (!externalSignal) return;


    if (externalSignal.aborted) {


      abort(externalSignal.reason || createAbortError());


    } else {


      externalSignal.addEventListener(


        'abort',


        () => abort(externalSignal.reason || createAbortError()),


        { once: true },


      );


    }


  });





  return {


    signal: controller.signal,


    dispose() {


      if (timeoutId) clearTimeout(timeoutId);


    },


  };


}





function shouldRetry(response, method, retryStatus) {


  if (!response) return false;


  if (!retryStatus.has(response.status)) return false;


  return DEFAULT_RETRY_METHODS.has(method);


}





function hasExternalAbort(signals) {


  return signals.some((signal) => signal?.aborted);


}





export async function safeFetch(input, init = {}, config = {}) {


  const {


    timeout = DEFAULT_TIMEOUT,


    retries = DEFAULT_RETRIES,


    backoffStep = DEFAULT_BACKOFF_STEP,


    retryStatus = DEFAULT_RETRY_STATUS,


    signal: overrideSignal,


  } = config;





  const method = (init.method || 'GET').toUpperCase();


  const externalSignals = [init.signal, overrideSignal].filter(Boolean);


  let lastError = null;





  for (let attempt = 0; attempt <= retries; attempt += 1) {


    const { signal, dispose } = createTimeoutController(timeout, externalSignals);


    try {


      const response = await fetch(input, { ...init, signal });


      if (!shouldRetry(response, method, retryStatus)) {


        dispose();


        return response;


      }


      lastError = new Error(`safeFetch retryable status ${response.status}`);


    } catch (error) {


      lastError = error;


      const abortedExternally = error?.name === 'AbortError' && hasExternalAbort(externalSignals);


      if (abortedExternally) {


        dispose();


        throw error;


      }


    } finally {


      dispose();


    }





    if (attempt === retries) {


      break;


    }





    const delayBase = Math.max(0, Number(backoffStep) || 0);


    const delay = delayBase * (attempt + 1);


    if (delay > 0) {


      await wait(delay);


    }


  }





  throw lastError ?? new Error('safeFetch failed');


}





export async function safeJson(response) {


  if (!response) throw new TypeError('safeJson: response obrigÃ¡tÃ³rio');


  const contentType = response.headers?.get?.('content-type') || '';


  const isJson = /application\/[\w.+-]*json/i.test(contentType);


  if (isJson) {


    return response.json();


  }





  const bodyText = await response.text();


  if (!contentType || contentType.toLowerCase().startsWith('text/')) {


    try {


      return JSON.parse(bodyText);


    } catch (error) {


      throw new TypeError(`safeJson: resposta nÃ£o pÃ´de ser convertida para JSON (${error.message || error})`);


    }


  }





  throw new TypeError(`safeJson: content-type inesperado "${contentType}"`);


}





}





export async function fetchJson(input, init, config) {


  const response = await safeFetch(input, init, config);


  return safeJson(response);


}


