// Gerencia o resgate de códigos na landing: busca arquivo local ou webhook e reproduz som.
import { webhookConfig } from './config.js';

const form = document.getElementById('reward-form');
const input = document.getElementById('codeInput');
const message = document.getElementById('reward-message');
const output = document.getElementById('reward-output');
const audio = document.getElementById('reward-audio');
const rewardWebhook = webhookConfig.reward;

function setMessage(text, type = 'info') {
  if (message) {
    message.textContent = text;
    message.dataset.type = type;
  }
}

function playReward() {
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => undefined);
}

function animateOutput() {
  if (!output) return;
  output.classList.add('reward__output--active');
  setTimeout(() => output.classList.remove('reward__output--active'), 600);
}

async function fetchLocal(code) {
  try {
    const response = await fetch('./codes/' + code + '.json', { cache: 'no-store' });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.warn('Código local não disponível', error);
    return null;
  }
}

async function fetchRemote(code) {
  if (!rewardWebhook || rewardWebhook.includes('{')) return null;
  try {
    const response = await fetch(rewardWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!response.ok) throw new Error('Webhook indisponível');
    return response.json();
  } catch (error) {
    console.warn('Erro no webhook de recompensa', error);
    return null;
  }
}

function renderReward(data) {
  if (!output) return;
  output.innerHTML = '';
  if (!data) {
    output.textContent = '';
    return;
  }
  if (typeof data === 'string') {
    output.textContent = data;
  } else if (data.html) {
    output.innerHTML = data.html;
  } else if (data.message) {
    output.textContent = data.message;
  } else {
    output.textContent = JSON.stringify(data, null, 2);
  }
  animateOutput();
  playReward();
}

async function handleSubmit(event) {
  event.preventDefault();
  if (!input) return;
  const raw = input.value.trim().toLowerCase();
  if (!raw) {
    setMessage('Informe um código válido.', 'error');
    return;
  }
  setMessage('Validando código...', 'info');
  const local = await fetchLocal(raw);
  const reward = local || (await fetchRemote(raw));
  if (!reward) {
    setMessage('Código não encontrado.', 'error');
    renderReward(null);
    return;
  }
  setMessage('Recompensa desbloqueada!', 'success');
  renderReward(reward);
}

if (form) form.addEventListener('submit', handleSubmit);
