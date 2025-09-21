import { qs, qsa, on } from './lib/dom.js';
import { loadDOMPurify } from './lib/sanitize.js';
import { initFX } from './qconsole.fx.js';
import { initCrypto } from './qconsole.crypto.js';
import { initModelDirectory } from './qconsole.models.js';
import { initAdvancedThemeControls } from './lib/theme.js';

const TAB_SELECTOR = ".qconsole__tabs [role='tab']";
const PANEL_SELECTOR = '.qconsole__panel';

function setupTabs() {
  const tabs = qsa(TAB_SELECTOR);
  const panels = qsa(PANEL_SELECTOR);
  if (!tabs.length || !panels.length) return;

  function activateTab(targetTab) {
    const tab = typeof targetTab === 'string' ? qs(`#${targetTab}`) : targetTab;
    if (!tab) return;
    const panelId = tab.getAttribute('aria-controls');
    const panel = panelId ? qs(`#${panelId}`) : null;
    tabs.forEach((button) => {
      const isActive = button === tab;
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.tabIndex = isActive ? 0 : -1;
      const buttonPanelId = button.getAttribute('aria-controls');
      const buttonPanel = buttonPanelId ? qs(`#${buttonPanelId}`) : null;
      if (buttonPanel) {
        buttonPanel.hidden = !isActive;
      }
    });
    if (panel) {
      panel.hidden = false;
      panel.focus?.({ preventScroll: false });
    }
  }

  tabs.forEach((tab, index) => {
    on(tab, 'click', () => activateTab(tab));
    on(tab, 'keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (index + direction + tabs.length) % tabs.length;
        const nextTab = tabs[nextIndex];
        nextTab.focus();
        activateTab(nextTab);
      }
    });
  });
}

function renderArsenal(grid) {
  if (!grid) return;
  const arsenal = [
    {
      tool: 'n8n',
      description: 'Playbooks automatizados para fluxos encadeados e checkpoints de segurança.',
      assistants: [
        {
          name: 'Blueprint Architect',
          blurb: 'Mapeia fluxos multi-guilda, garante versionamento e checkpoints acionáveis.',
        },
        {
          name: 'Protocol Officer',
          blurb: 'Valida integrações sensíveis e cuida de logs para auditorias futuras.',
        },
        {
          name: 'Signal Weaver',
          blurb: 'Coordena webhooks, filas e triggers externos mantendo a missão estável.',
        },
      ],
    },
    {
      tool: 'Make.com',
      description: 'Cadeias visuais com monitoramento em tempo real e protocolos de fallback.',
      assistants: [
        {
          name: 'Scenario Sentinel',
          blurb: 'Cuida dos cenários críticos, com alertas instantâneos para cada falha.',
        },
        {
          name: 'Red Team Scout',
          blurb: 'Simula ataques e gargalos para deixar o fluxo blindado antes da produção.',
        },
        {
          name: 'Pulse Keeper',
          blurb: 'Mantém métricas de throughput, sugerindo upgrades e otimizações.',
        },
      ],
    },
    {
      tool: 'ChatGPT',
      description: 'Operações de atendimento e prototipagem guiada com inteligência contextual.',
      assistants: [
        {
          name: 'Briefing Whisperer',
          blurb: 'Consolida requisitos e transforma em roteiros prontos para interação.',
        },
        {
          name: 'UX Liaison',
          blurb: 'Garante tom e experiência consistente com a operação do agente.',
        },
        {
          name: 'Continuity Keeper',
          blurb: 'Monitora histórico, identifica lacunas e cria follow-ups acionáveis.',
        },
      ],
    },
    {
      tool: 'n8n — Q&A',
      description: 'Constelação focada em triagens rápidas e respostas auditáveis nos fluxos n8n.',
      assistants: [
        {
          name: 'Knowledge Cipher',
          blurb: 'Decodifica bases de conhecimento para respostas consistentes.',
        },
        {
          name: 'Field Analyst',
          blurb: 'Cruza contexto do lead com dados internos antes de responder.',
        },
        {
          name: 'Echo Auditor',
          blurb: 'Registra cada resposta com trilha de auditoria e tags de confiança.',
        },
      ],
    },
    {
      tool: 'Make — Q&A',
      description: 'Respostas velozes com checkpoints visuais para squads em Make.',
      assistants: [
        {
          name: 'Signal Cartographer',
          blurb: 'Desenha mapas de roteamento para dúvidas recorrentes.',
        },
        {
          name: 'Trust Inspector',
          blurb: 'Confere origem dos dados e classifica confiabilidade das fontes.',
        },
        {
          name: 'Tempo Herald',
          blurb: 'Calcula SLA previsto e alerta o time quando algo foge do padrão.',
        },
      ],
    },
    {
      tool: 'ChatGPT — Q&A',
      description: 'Equipe de prontidão para bases dinâmicas e scripts de atendimento.',
      assistants: [
        {
          name: 'Signal Archivist',
          blurb: 'Organiza snippets e garante consistência nas respostas.',
        },
        {
          name: 'Delta Watch',
          blurb: 'Detecta mudanças críticas e avisa sobre necessidade de revisão.',
        },
        {
          name: 'Pulse Strategist',
          blurb: 'Orienta reuso de respostas e otimiza tempo médio por interação.',
        },
      ],
    },
  ];

  grid.innerHTML = '';
  arsenal.forEach((column) => {
    const columnEl = document.createElement('section');
    columnEl.className = 'arsenal__column';
    columnEl.innerHTML = `
      <div>
        <h3>${column.tool}</h3>
        <p class="panel-note">${column.description}</p>
      </div>
    `;
    const list = document.createElement('div');
    list.className = 'arsenal__assistants';
    column.assistants.forEach((assistant) => {
      const card = document.createElement('article');
      card.className = 'assistant-card';
      card.innerHTML = `
        <h4>${assistant.name}</h4>
        <p>${assistant.blurb}</p>
      `;
      list.appendChild(card);
    });
    columnEl.appendChild(list);
    grid.appendChild(columnEl);
  });
  grid.dataset.active = 'false';
}

async function bootstrap() {
  setupTabs();
  await loadDOMPurify();

  const fxModule = await initFX({
    ratesContainer: qs('#fx-rates'),
    providerElement: qs('#fx-provider'),
    updatedElement: qs('#fx-updated'),
    resultsElement: qs('#fx-results'),
    amountInput: qs('#fx-amount'),
    fromSelect: qs('#fx-from'),
    converterForm: qs('#fx-converter'),
    refreshButton: qs('#fx-refresh'),
  });

  initCrypto({
    gridElement: qs('#crypto-grid'),
    updatedElement: qs('#crypto-updated'),
    refreshButton: qs('#crypto-refresh'),
    providersConfig: fxModule.providers,
  });

  await initModelDirectory({
    container: qs('#model-groups'),
    drawer: qs('#model-drawer'),
    fx: fxModule,
  });

  const arsenalGrid = qs('#arsenal-grid');
  renderArsenal(arsenalGrid);

  await initAdvancedThemeControls({
    toggle: qs('#advanced-toggle'),
    statusElement: qs('#advanced-status'),
    arsenalGrid,
  });
}

bootstrap().catch((error) => {
  console.error('[qconsole] Falha ao iniciar Q-Branch // AEGIS', error);
});
