// Manual QA q-console:


// a) Abrir a página -> ver FX e BTC/ETH com valores


// b) Trocar amount -> ver conversões -> ver timestamp


// c) Abrir Modelos -> ver grupos, tooltips e drawer 'Quando eu uso?'


// d) Ativar Modo Avançado -> UI muda para tom vinho, persiste após reload


// e) Trocar provedor em data/providers.json -> recarregar -> verificar


import { qs, qsa, on } from './lib/dom.js';


import { loadDOMPurify } from './lib/sanitize.js';


import { initFX } from './qconsole.fx.js';


import { initCrypto } from './qconsole.crypto.js';


import { initModelDirectory } from './qconsole.models.js';


import { initAdvancedThemeControls } from './lib/theme.js';


import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';


import { auth } from './firebase-init.js';





const TAB_SELECTOR = ".qconsole__tabs [role='tab']";


const PANEL_SELECTOR = '.qconsole__panel';





const guard = qs('#qconsole-guard');


const guardTitle = guard?.querySelector('h1') ?? null;


const guardMessage = qs('#qconsole-guard-message');


const guardAction = qs('#qconsole-guard-action');


const header = qs('.qconsole-header');


const consoleShell = qs('#console');


const drawer = qs('#model-drawer');


const shellElements = [header, consoleShell, drawer];





if (guardAction) {


  guardAction.setAttribute('hidden', '');


}





let bootstrapStarted = false;


let redirectTimer = null;





function hideGuard() {


  if (!guard) return;


  guard.setAttribute('hidden', '');


  if (guardAction) {


    guardAction.setAttribute('hidden', '');


  }


}





function showGuard(title, description, { showAction = false } = {}) {


  if (!guard) return;


  if (title && guardTitle) {


    guardTitle.textContent = title;


  }


  if (description && guardMessage) {


    guardMessage.textContent = description;


  }


  if (showAction && guardAction) {


    guardAction.removeAttribute('hidden');


  } else if (guardAction) {


    guardAction.setAttribute('hidden', '');


  }


  guard.removeAttribute('hidden');


}





function hideConsoleShell() {


  shellElements.forEach((element) => {


    if (element) {


      element.setAttribute('hidden', '');


    }


  });


}





function showConsoleShell() {


  shellElements.forEach((element) => {


    if (element) {


      element.removeAttribute('hidden');


    }


  });


}





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


      description: 'Playbooks automatizados para fluxos encadeados e checkpoints de seguranÃ§a.',


      assistants: [


        {


          name: 'Blueprint Architect',


          blurb: 'Mapeia fluxos multi-guilda, garante versionamento e checkpoints acionÃ¡veis.',


        },


        {


          name: 'Protocol Officer',


          blurb: 'Valida integraÃ§Ãµes sensÃ­veis e cuida de logs para auditorias futuras.',


        },


        {


          name: 'Signal Weaver',


          blurb: 'Coordena webhooks, filas e triggers externos mantendo a missÃ£o estÃ¡vel.',


        },


      ],


    },


    {


      tool: 'Make.com',


      description: 'Cadeias visuais com monitoramento em tempo real e protocolos de fallback.',


      assistants: [


        {


          name: 'Scenario Sentinel',


          blurb: 'Cuida dos cenÃ¡rios crÃ­ticos, com alertas instantÃ¢neos para cada falha.',


        },


        {


          name: 'Red Team Scout',


          blurb: 'Simula ataques e gargalos para deixar o fluxo blindado antes da produÃ§Ã£o.',


        },


        {


          name: 'Pulse Keeper',


          blurb: 'MantÃ©m mÃ©tricas de throughput, sugerindo upgrades e otimizaÃ§Ãµes.',


        },


      ],


    },


    {


      tool: 'ChatGPT',


      description: 'OperaÃ§Ãµes de atendimento e prototipagem guiada com inteligÃªncia contextual.',


      assistants: [


        {


          name: 'Briefing Whisperer',


          blurb: 'Consolida requisitos e transforma em roteiros prontos para interaÃ§Ã£o.',


        },


        {


          name: 'UX Liaison',


          blurb: 'Garante tom e experiÃªncia consistente com a operaÃ§Ã£o do agente.',


        },


        {


          name: 'Continuity Keeper',


          blurb: 'Monitora histÃ³rico, identifica lacunas e cria follow-ups acionÃ¡veis.',


        },


      ],


    },


    {


      tool: 'n8n â€” Q&A',


      description: 'ConstelaÃ§Ã£o focada em triagens rÃ¡pidas e respostas auditÃ¡veis nos fluxos n8n.',


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


          blurb: 'Registra cada resposta com trilha de auditoria e tags de confianÃ§a.',


        },


      ],


    },


    {


      tool: 'Make â€” Q&A',


      description: 'Respostas velozes com checkpoints visuais para squads em Make.',


      assistants: [


        {


          name: 'Signal Cartographer',


          blurb: 'Desenha mapas de roteamento para dÃºvidas recorrentes.',


        },


        {


          name: 'Trust Inspector',


          blurb: 'Confere origem dos dados e classifica confiabilidade das fontes.',


        },


        {


          name: 'Tempo Herald',


          blurb: 'Calcula SLA previsto e alerta o time quando algo foge do padrÃ£o.',


        },


      ],


    },


    {


      tool: 'ChatGPT â€” Q&A',


      description: 'Equipe de prontidÃ£o para bases dinÃ¢micas e scripts de atendimento.',


      assistants: [


        {


          name: 'Signal Archivist',


          blurb: 'Organiza snippets e garante consistÃªncia nas respostas.',


        },


        {


          name: 'Delta Watch',


          blurb: 'Detecta mudanÃ§as crÃ­ticas e avisa sobre necessidade de revisÃ£o.',


        },


        {


          name: 'Pulse Strategist',


          blurb: 'Orienta reuso de respostas e otimiza tempo mÃ©dio por interaÃ§Ã£o.',


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





async function startConsole() {


  if (bootstrapStarted) return;


  bootstrapStarted = true;


  try {


    await bootstrap();


  } catch (error) {


    console.error('[qconsole] Falha ao iniciar Q-Branch // AEGIS', error);


    bootstrapStarted = false;


    hideConsoleShell();


    showGuard('Falha ao carregar o console', 'Tente novamente em instantes.', { showAction: false });


  }


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





onAuthStateChanged(auth, (user) => {


  if (!user) {


    bootstrapStarted = false;


    hideConsoleShell();


    showGuard('Acesso restrito', 'Faça login com sua conta para acessar o console tático.', { showAction: true });


    if (redirectTimer === null) {


      redirectTimer = window.setTimeout(() => {


        window.location.replace('./auth.html#login');


      }, 1200);


    }


    return;


  }





  if (redirectTimer !== null) {


    window.clearTimeout(redirectTimer);


    redirectTimer = null;


  }


  hideGuard();


  showConsoleShell();


  startConsole();


});





