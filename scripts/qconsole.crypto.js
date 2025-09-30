ï»¿import { fetchJson } from './lib/fetcher.js';


import { formatMoney } from './lib/currency.js';





const REFRESH_INTERVAL = 60_000;


const SUPPORTED_COINS = [


  { id: 'bitcoin', label: 'Bitcoin (BTC)' },


  { id: 'ethereum', label: 'Ethereum (ETH)' },


];


const TARGET_CURRENCIES = ['usd', 'brl', 'ars'];





function getBaseUrl(config) {


  const base = config?.crypto_base_url || 'https://api.coingecko.com/api/v3';


  return base.replace(/\/$/, '');


}





export function initCrypto({ gridElement, updatedElement, refreshButton, providersConfig } = {}) {


  let timer = null;


  let lastUpdated = null;


  const config = providersConfig || {};





  async function loadPrices() {


    const baseUrl = getBaseUrl(config);


    const url = `${baseUrl}/simple/price?ids=${SUPPORTED_COINS.map((coin) => coin.id).join(',')}&vs_currencies=${


      TARGET_CURRENCIES.join(',')


    }`;


    return fetchJson(url);


  }





  function render(data) {


    if (!gridElement) return;


    gridElement.innerHTML = '';


    SUPPORTED_COINS.forEach((coin) => {


      const prices = data?.[coin.id];


      const card = document.createElement('article');


      card.className = 'crypto-card';


      const heading = document.createElement('h3');


      heading.textContent = coin.label;


      card.appendChild(heading);





      if (prices) {


        const list = document.createElement('dl');


        TARGET_CURRENCIES.forEach((currency) => {


          const key = currency.toLowerCase();


          if (!(key in prices)) return;


          const dt = document.createElement('dt');


          const currencyCode = currency.toUpperCase();


          dt.textContent = currencyCode;


          const dd = document.createElement('dd');


          dd.textContent = formatMoney(prices[key], currencyCode);


          list.append(dt, dd);


        });


        card.appendChild(list);


      } else {


        const paragraph = document.createElement('p');


        paragraph.textContent = 'IndisponÃÂ­vel no momento.';


        card.appendChild(paragraph);


      }


      gridElement.appendChild(card);


    });


  }





  async function refresh({ silent = false } = {}) {


    try {


      const data = await loadPrices();


      render(data);


      lastUpdated = new Date();


      if (updatedElement) {


        updatedElement.textContent = lastUpdated.toLocaleString('pt-BR');


        updatedElement.dateTime = lastUpdated.toISOString();


      }


    } catch (error) {


      console.error('[qconsole.crypto] Falha ao obter preÃÂ§os de cripto', error);


      if (!silent && gridElement) {


        gridElement.innerHTML = '<article class="crypto-card"><p>NÃ£o foi possÃ­vel atualizar o painel agora.</p><p class="panel-note">Confirme a conectividade com o provedor configurado em <code>data/providers.json</code>. CoinGecko funciona sem chave mas pode ter rate limit local.</p></article>';


      }


    }


  }





  function startTimer() {


    if (timer) clearInterval(timer);


    timer = setInterval(() => {


      refresh({ silent: true });


    }, REFRESH_INTERVAL);


  }





  if (refreshButton) {


    refreshButton.addEventListener('click', () => refresh());


  }





  refresh();


  startTimer();





  return {


    refresh,


    stop() {


      if (timer) clearInterval(timer);


      timer = null;


    },


  };


}











