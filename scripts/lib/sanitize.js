// Normaliza sanitizacao HTML via DOMPurify; atualize versao conforme politica de seguranca.
// [codex-edit] Novo helper centralizado para uso em tooltips/comentarios controlados.

const DEFAULT_DOMPURIFY_SRC = 'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js';
let loadPromise = null;
let hooksInstalled = false;

function getPurifierOrThrow() {
  const purifier = window.DOMPurify;
  if (!purifier) {
    throw new Error('DOMPurify nao foi carregado. Use loadDOMPurify() antes de sanitizar.');
  }
  return purifier;
}

export function loadDOMPurify(src = DEFAULT_DOMPURIFY_SRC) {
  if (window.DOMPurify) return Promise.resolve(window.DOMPurify);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (window.DOMPurify) {
        resolve(window.DOMPurify);
      } else {
        reject(new Error('DOMPurify nao disponivel apos carregar o script.'));
      }
    };
    script.onerror = () => reject(new Error('Falha ao carregar DOMPurify a partir de ' + src));
    document.head.appendChild(script);
  });

  return loadPromise;
}

const DEFAULT_CONFIG = {
  ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel|sms|geo):/i,
  ALLOWED_TAGS: ['a', 'abbr', 'b', 'code', 'em', 'i', 'span', 'strong', 'small', 'u', 'ul', 'ol', 'li', 'p', 'br'],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'aria-label'],
  FORCE_BODY: true,
};

function ensureHooks(purifier) {
  if (hooksInstalled) return;
  purifier.addHook('afterSanitizeAttributes', (node) => {
    if (!node || typeof node.nodeName !== 'string') return;
    if (node.nodeName.toLowerCase() !== 'a') return;
    const target = node.getAttribute('target');
    if (!target) return;
    if (target.toLowerCase() === '_blank') {
      const rel = node.getAttribute('rel');
      const relTokens = rel ? rel.split(/\s+/).filter(Boolean) : [];
      if (!relTokens.includes('noopener')) relTokens.push('noopener');
      if (!relTokens.includes('noreferrer')) relTokens.push('noreferrer');
      node.setAttribute('rel', relTokens.join(' '));
    }
  });
  hooksInstalled = true;
}

export function sanitize(input, config = {}) {
  const purifier = getPurifierOrThrow();
  ensureHooks(purifier);
  const value = input == null ? '' : String(input);
  return purifier.sanitize(value, { ...DEFAULT_CONFIG, ...config });
}

export function sanitizeHtml(input, config = {}) {
  return sanitize(input, config);
}

export function sanitizeToFragment(input, config) {
  const clean = sanitize(input, config);
  const template = document.createElement('template');
  template.innerHTML = clean;
  return template.content.cloneNode(true);
}

export function addSanitizeHook(name, callback) {
  const purifier = getPurifierOrThrow();
  purifier.addHook(name, callback);
}
