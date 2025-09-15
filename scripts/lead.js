// TODO: preencher integração com CRM externo caso necessário.
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from './firebase-init.js';

const leadForm = document.getElementById('lead-form');

async function handleLeadSubmit(event) {
  if (!leadForm) return;
  event.preventDefault();
  const formData = new FormData(leadForm);
  const payload = {
    firstName: String(formData.get('firstName') || ''),
    email: String(formData.get('email') || ''),
    phone: String(formData.get('phone') || ''),
    utm: String(formData.get('utm') || ''),
    createdAt: serverTimestamp(),
  };
  try {
    await addDoc(collection(db, 'leads'), payload);
    const actionUrl = leadForm.getAttribute('action');
    if (actionUrl && !actionUrl.includes('{')) {
      await fetch(actionUrl, {
        method: leadForm.getAttribute('method') || 'post',
        body: new URLSearchParams(payload),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    }
    setFeedback('Cadastro realizado! Confira seu e-mail.', 'success');
    leadForm.reset();
  } catch (error) {
    console.error('Erro ao registrar lead', error);
    setFeedback('Não foi possível enviar seus dados.', 'error');
  }
}

function setFeedback(message, type) {
  const feedback = leadForm.querySelector('.form__feedback');
  if (feedback) {
    feedback.textContent = message;
    feedback.dataset.type = type;
  }
}

if (leadForm) {
  leadForm.addEventListener('submit', handleLeadSubmit);
}
