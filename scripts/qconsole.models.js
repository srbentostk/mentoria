import { fetchJson } from './lib/fetcher.js';
import { qs, delegate } from './lib/dom.js';
import { sanitize, sanitizeToFragment } from './lib/sanitize.js';
import { formatMoney } from './lib/currency.js';

const GROUP_ORDER = ['reasoning', 'multimodal', 'cheap-fast', 'long-context', 'image-audio'];
const GROUP_LABELS = {
  reasoning: 'RaciocÃ­nio/Agentes',
  multimodal: 'Multimodal',
  'cheap-fast': 'Texto rÃ¡pido/custo baixo',
  'long-context': 'Contexto grande',
  'image-audio': 'Imagem/Ãudio',
};
const TOKENS_PER_PAGE = 750; // AproximaÃ§Ã£o: pÃ¡gina de Word com ~500 palavras.

function formatPerPage(value, fx) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  const usd = (value / 1_000_000) * TOKENS_PER_PAGE;
  try {
    const brl = fx ? fx.convert(usd, 'USD', 'BRL') : null;
    const ars = fx ? fx.convert(usd, 'USD', 'ARS') : null;
    return {
      usd,
      brl,
      ars,
    };
  } catch (error) {
    console.warn('[qconsole.models] Falha ao converter custo por pÃ¡gina', error);
    return {
      usd,
      brl: null,
      ars: null,
    };
  }
}

function formatAudioPerMinute(value, fx) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  try {
    const brl = fx ? fx.convert(value, 'USD', 'BRL') : null;
    const ars = fx ? fx.convert(value, 'USD', 'ARS') : null;
    return {
      usd: value,
      brl,
      ars,
    };
  } catch (error) {
    console.warn('[qconsole.models] Falha ao converter custo por minuto', error);
    return {
      usd: value,
      brl: null,
      ars: null,
    };
  }
}

function createTooltip(button, tooltipId, content) {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.id = tooltipId;
  tooltip.setAttribute('role', 'tooltip');
  tooltip.dataset.visible = 'false';
  tooltip.innerHTML = sanitize(content);
  button.setAttribute('aria-describedby', tooltipId);
  button.addEventListener('mouseenter', () => {
    tooltip.dataset.visible = 'true';
  });
  button.addEventListener('mouseleave', () => {
    tooltip.dataset.visible = 'false';
  });
  button.addEventListener('focus', () => {
    tooltip.dataset.visible = 'true';
  });
  button.addEventListener('blur', () => {
    tooltip.dataset.visible = 'false';
  });
  return tooltip;
}

function createPricingBlock(model, fx) {
  const wrapper = document.createElement('div');
  wrapper.className = 'model-card__pricing';
  const usdInput = model?.usd?.input_per_million;
  const usdOutput = model?.usd?.output_per_million;
  const audioMinute = model?.usd?.audio_per_minute;

  if (typeof usdInput === 'number' || typeof usdOutput === 'number') {
    const line = document.createElement('p');
    const parts = [];
    if (typeof usdInput === 'number') parts.push(`Entrada: ${formatMoney(usdInput, 'USD')} / 1M tokens`);
    if (typeof usdOutput === 'number') parts.push(`SaÃ­da: ${formatMoney(usdOutput, 'USD')} / 1M tokens`);
    line.textContent = parts.join(' | ');
    wrapper.appendChild(line);
  }

  if (typeof usdInput === 'number') {
    const perPage = formatPerPage(usdInput, fx);
    if (perPage) {
      const item = document.createElement('p');
      const values = [
        `Entrada (~pÃ¡gina): ${formatMoney(perPage.usd, 'USD')}`,
        perPage.brl != null ? formatMoney(perPage.brl, 'BRL') : null,
        perPage.ars != null ? formatMoney(perPage.ars, 'ARS') : null,
      ].filter(Boolean);
      item.textContent = values.join(' â€¢ ');
      wrapper.appendChild(item);
    }
  }

  if (typeof usdOutput === 'number') {
    const perPage = formatPerPage(usdOutput, fx);
    if (perPage) {
      const item = document.createElement('p');
      const values = [
        `SaÃ­da (~pÃ¡gina): ${formatMoney(perPage.usd, 'USD')}`,
        perPage.brl != null ? formatMoney(perPage.brl, 'BRL') : null,
        perPage.ars != null ? formatMoney(perPage.ars, 'ARS') : null,
      ].filter(Boolean);
      item.textContent = values.join(' â€¢ ');
      wrapper.appendChild(item);
    }
  }

  if (typeof audioMinute === 'number') {
    const audioCost = formatAudioPerMinute(audioMinute, fx);
    if (audioCost) {
      const item = document.createElement('p');
      const values = [
        `Ãudio/min: ${formatMoney(audioCost.usd, 'USD')}`,
        audioCost.brl != null ? formatMoney(audioCost.brl, 'BRL') : null,
        audioCost.ars != null ? formatMoney(audioCost.ars, 'ARS') : null,
      ].filter(Boolean);
      item.textContent = values.join(' â€¢ ');
      wrapper.appendChild(item);
    }
  }

  if (!wrapper.childElementCount) {
    const empty = document.createElement('p');
    empty.textContent = 'Custos nÃ£o informados.';
    wrapper.appendChild(empty);
  }

  return wrapper;
}

function createModelCard(model, index, fx, drawerRegistry) {
  const card = document.createElement('article');
  card.className = 'model-card';
  card.dataset.modelIndex = String(index);

  const header = document.createElement('div');
  header.className = 'model-card__header';

  const titleWrapper = document.createElement('div');
  const vendorLabel = document.createElement('p');
  vendorLabel.className = 'models__vendor';
  vendorLabel.textContent = model.vendor || 'â€”';
  const name = document.createElement('h3');
  name.className = 'model-card__name';
  name.textContent = model.name;
  titleWrapper.append(vendorLabel, name);
  header.appendChild(titleWrapper);

  if (model.link) {
    const link = document.createElement('a');
    link.className = 'model-card__link';
    link.href = model.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.innerHTML = 'Ver preÃ§o oficial <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3z"/><path d="M5 5h5V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-5h-2v5H5z"/></svg>';
    header.appendChild(link);
  }

  const tooltipButton = document.createElement('button');
  tooltipButton.type = 'button';
  tooltipButton.className = 'tooltip-button';
  tooltipButton.textContent = 'Ver briefing';
  const tooltipId = `model-tooltip-${index}`;
  tooltipButton.setAttribute('aria-label', `Resumo do modelo ${model.name}`);
  const tooltipContent = model.hover || 'Resumo nÃ£o informado.';
  const tooltip = createTooltip(tooltipButton, tooltipId, tooltipContent);
  header.appendChild(tooltipButton);
  card.appendChild(header);
  card.appendChild(tooltip);

  const limits = document.createElement('p');
  limits.className = 'model-card__limits';
  const limitsFragment = sanitizeToFragment(`<strong>Limites:</strong> ${model.limits || 'Sem anotaÃ§Ãµes.'}`);
  limits.appendChild(limitsFragment);
  card.appendChild(limits);

  card.appendChild(createPricingBlock(model, fx));

  const drawerButton = document.createElement('button');
  drawerButton.type = 'button';
  drawerButton.className = 'model-card__drawer';
  drawerButton.textContent = 'Quando eu uso esse modelo?';
  drawerButton.dataset.drawerTarget = String(index);
  card.appendChild(drawerButton);

  drawerRegistry.set(String(index), {
    vendor: model.vendor || 'â€”',
    name: model.name,
    whenToUse: model.whenToUse || {},
  });

  return card;
}

function groupModels(models) {
  const map = new Map();
  models.forEach((model) => {
    const groupKey = GROUP_ORDER.includes(model.function) ? model.function : GROUP_ORDER[0];
    if (!map.has(groupKey)) {
      map.set(groupKey, new Map());
    }
    const vendors = map.get(groupKey);
    const vendorKey = model.vendor || 'Outros';
    if (!vendors.has(vendorKey)) vendors.set(vendorKey, []);
    vendors.get(vendorKey).push(model);
  });
  return map;
}

function renderGroups(container, models, fx, drawerRegistry) {
  if (!container) return;
  container.innerHTML = '';
  const grouped = groupModels(models);
  GROUP_ORDER.forEach((groupKey) => {
    if (!grouped.has(groupKey)) return;
    const groupSection = document.createElement('section');
    groupSection.className = 'models__group';
    const header = document.createElement('header');
    header.className = 'models__group-header';
    const title = document.createElement('h3');
    title.className = 'models__group-title';
    title.textContent = GROUP_LABELS[groupKey] || groupKey;
    header.appendChild(title);
    groupSection.appendChild(header);

    const vendors = grouped.get(groupKey);
    const vendorNames = Array.from(vendors.keys()).sort((a, b) => a.localeCompare(b));
    vendorNames.forEach((vendor) => {
      const block = document.createElement('section');
      block.className = 'models__vendor-group';
      const vendorTitle = document.createElement('p');
      vendorTitle.className = 'models__vendor';
      vendorTitle.textContent = vendor;
      block.appendChild(vendorTitle);
      const cards = document.createElement('div');
      cards.className = 'models__cards';
      vendors
        .get(vendor)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((model) => {
          const card = createModelCard(model, drawerRegistry.size, fx, drawerRegistry);
          cards.appendChild(card);
        });
      block.appendChild(cards);
      groupSection.appendChild(block);
    });

    container.appendChild(groupSection);
  });
}

export async function initModelDirectory({ container, drawer, fx } = {}) {
  if (!container) return;
  const drawerRegistry = new Map();
  let lastTrigger = null;

  function closeDrawer() {
    if (!drawer) return;
    drawer.dataset.state = 'closed';
    drawer.setAttribute('aria-hidden', 'true');
    const dialog = qs('.drawer__panel', drawer);
    dialog?.setAttribute('tabindex', '-1');
    if (lastTrigger) {
      lastTrigger.focus();
      lastTrigger = null;
    }
  }

  function activateDrawerTab(tab) {
    const tabs = drawer ? drawer.querySelectorAll(".drawer__tabs [role='tab']") : [];
    const panels = drawer ? drawer.querySelectorAll('.drawer__panel-content') : [];
    tabs.forEach((button) => {
      const isActive = button === tab;
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.tabIndex = isActive ? 0 : -1;
      const controls = button.getAttribute('aria-controls');
      const panel = controls ? qs(`#${controls}`, drawer) : null;
      if (panel) {
        panel.hidden = !isActive;
      }
    });
  }

  function fillDrawerContent(modelIndex) {
    if (!drawer) return;
    const state = drawerRegistry.get(modelIndex);
    if (!state) return;
    const vendorEl = qs('#drawer-vendor', drawer);
    const titleEl = qs('#drawer-title', drawer);
    vendorEl.textContent = state.vendor;
    titleEl.textContent = `Quando eu uso ${state.name}?`;

    const panelMapping = [
      { tab: '#drawer-tab-n8n', panel: '#drawer-panel-n8n', key: 'n8n_make' },
      { tab: '#drawer-tab-python', panel: '#drawer-panel-python', key: 'python' },
      { tab: '#drawer-tab-agent', panel: '#drawer-panel-agent', key: 'agent' },
    ];

    panelMapping.forEach(({ panel, key }) => {
      const panelEl = qs(panel, drawer);
      if (!panelEl) return;
      panelEl.innerHTML = '';
      const content = state.whenToUse?.[key];
      const safeContent = sanitizeToFragment(content || 'ConteÃºdo nÃ£o informado.');
      panelEl.appendChild(safeContent);
    });

    activateDrawerTab(qs('#drawer-tab-n8n', drawer));
  }

  function openDrawer(trigger) {
    if (!drawer) return;
    const modelIndex = trigger?.dataset?.drawerTarget;
    if (!modelIndex) return;
    fillDrawerContent(modelIndex);
    drawer.dataset.state = 'open';
    drawer.setAttribute('aria-hidden', 'false');
    const dialog = qs('.drawer__panel', drawer);
    if (dialog) {
      dialog.removeAttribute('tabindex');
      dialog.focus?.();
    }
    lastTrigger = trigger;
  }

  if (drawer) {
    delegate(drawer, 'click', '[data-drawer-dismiss]', () => closeDrawer());
    drawer.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer();
      }
    });
    delegate(drawer, 'click', ".drawer__tabs [role='tab']", (event, target) => {
      event.preventDefault();
      activateDrawerTab(target);
    });
  }

  delegate(container, 'click', '.model-card__drawer', (event, target) => {
    event.preventDefault();
    openDrawer(target);
  });

  try {
    const models = await fetchJson('./data/models.json');
    if (!Array.isArray(models) || !models.length) {
      container.innerHTML = '<p>Nenhum modelo cadastrado ainda.</p>';
      return;
    }
    renderGroups(container, models, fx, drawerRegistry);
  } catch (error) {
    console.error('[qconsole.models] Falha ao carregar catÃ¡logo de modelos', error);
    container.innerHTML = '<p>Não foi possível atualizar agora.</p>';
  }

  return {
    closeDrawer,
  };
}




