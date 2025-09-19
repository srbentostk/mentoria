// Captura leads da landing: anexa parâmetros UTM, envia para Hotmart e salva no Firestore.
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from './firebase-init.js';
import { formConfig } from './config.js';

const leadForm = document.getElementById('lead-form');
const utmContainer = document.getElementById('utm-hidden-fields');

if (leadForm && formConfig.leadFormAction && !formConfig.leadFormAction.includes('{')) {
  leadForm.setAttribute('action', formConfig.leadFormAction);
}

function collectUtm() {
  const params = new URLSearchParams(window.location.search);
  const map = {};
  params.forEach((value, key) => {
    if (!key.toLowerCase().startsWith('utm_')) return;
    map[key] = value;
    if (utmContainer && leadForm && !leadForm.querySelector('[name="' + key + '"]')) {
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = key;
      hidden.value = value;
      utmContainer.appendChild(hidden);
    }
  });
  return map;
}

const utm = collectUtm();

async function handleSubmit(event) {
  if (!leadForm) return;
  event.preventDefault();
  const feedback = leadForm.querySelector('.form__feedback');
  const formData = new FormData(leadForm);
  const payload = {
    firstName: String(formData.get('firstName') || ''),
    email: String(formData.get('email') || ''),
    phone: String(formData.get('phone') || ''),
    utm,
    createdAt: serverTimestamp(),
  };
  try {
    await addDoc(collection(db, 'leads'), payload);
    const action = formConfig.leadFormAction && !formConfig.leadFormAction.includes('{')
      ? formConfig.leadFormAction
      : leadForm.getAttribute('action');
    if (action && formConfig.leadFormAction && !formConfig.leadFormAction.includes('{')) {
      leadForm.setAttribute('action', formConfig.leadFormAction);
    }
    if (action && !action.includes('{')) {
      const method = (leadForm.getAttribute('method') || 'post').toUpperCase();
      await fetch(action, {
        method,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          firstName: payload.firstName,
          email: payload.email,
          phone: payload.phone,
          ...utm,
        }),
      }).catch((error) => console.warn('Erro no webhook externo', error));
    }
    if (feedback) {
      feedback.textContent = 'Cadastro enviado! Confira seu e-mail.';
      feedback.dataset.type = 'success';
    }
    leadForm.reset();
  } catch (error) {
    console.error('Erro ao salvar lead', error);
    if (feedback) {
      feedback.textContent = 'Não foi possível enviar seus dados.';
      feedback.dataset.type = 'error';
    }
  }
}

if (leadForm) leadForm.addEventListener('submit', handleSubmit);
