// Centraliza utilitarios DOM compartilhados; mantenha funcoes puras e pequenas.
// [codex-edit] Novo modulo Q-Branch para padronizar seletores e eventos.

/**
 * Seleciona o primeiro elemento que casar com o seletor informado.
 * @param {string} selector CSS selector.
 * @param {ParentNode} [root=document] escopo de busca.
 * @returns {Element|null}
 */
export function qs(selector, root = document) {
  if (!selector) throw new TypeError('qs: selector obrigatorio');
  const scope = root ?? document;
  return scope.querySelector(selector);
}

/**
 * Seleciona todos os elementos que casam com o seletor informado.
 * @param {string} selector CSS selector.
 * @param {ParentNode} [root=document] escopo de busca.
 * @returns {Element[]}
 */
export function qsa(selector, root = document) {
  if (!selector) throw new TypeError('qsa: selector obrigatorio');
  const scope = root ?? document;
  return Array.from(scope.querySelectorAll(selector));
}

/**
 * Registra listener e retorna funcao de limpeza padrao.
 * @param {EventTarget} target alvo do evento.
 * @param {string} type tipo de evento.
 * @param {EventListener} handler callback.
 * @param {boolean|AddEventListenerOptions} [options]
 * @returns {() => void}
 */
export function on(target, type, handler, options) {
  if (!target) throw new TypeError('on: target invalido');
  if (!type) throw new TypeError('on: tipo obrigatorio');
  if (typeof handler !== 'function') throw new TypeError('on: handler precisa ser funcao');
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
}

/**
 * Cria listener delegado para elementos que correspondam ao seletor.
 * @param {Element|Document} root elemento pai.
 * @param {string} type tipo de evento.
 * @param {string} selector seletor alvo dentro do root.
 * @param {(event: Event, matched: Element) => void} handler callback.
 * @param {boolean|AddEventListenerOptions} [options]
 * @returns {() => void}
 */
export function delegate(root, type, selector, handler, options) {
  if (!root) throw new TypeError('delegate: root obrigatorio');
  if (!type) throw new TypeError('delegate: tipo obrigatorio');
  if (!selector) throw new TypeError('delegate: selector obrigatorio');
  if (typeof handler !== 'function') throw new TypeError('delegate: handler precisa ser funcao');

  const listener = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const match = target.closest(selector);
    if (match && (root === document || root.contains(match))) {
      handler.call(match, event, match);
    }
  };

  root.addEventListener(type, listener, options);
  return () => root.removeEventListener(type, listener, options);
}
