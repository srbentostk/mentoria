// Funções utilitárias para controlar a missão onboarding-5v14d.
import {
  doc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  getDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import { db, storage } from './firebase-init.js';
import { webhookConfig } from './config.js';

const MISSION_ID = 'onboarding-5v14d';
const DAYS = 14;
const PROOF_WEBHOOK = webhookConfig.proof;
const REMINDERS_WEBHOOK = webhookConfig.reminders;

let timerInterval = null;

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

export function startTimer(dueAt) {
  if (timerInterval) window.clearInterval(timerInterval);
  const target = typeof dueAt === 'number' ? dueAt : Date.parse(dueAt);
  if (!target) return;
  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) {
      setText('onboarding-timer', 'encerrado');
      window.clearInterval(timerInterval);
      return;
    }
    const minutes = Math.floor(diff / 60000);
    const days = Math.floor(minutes / (60 * 24));
    const hours = Math.floor((minutes % (60 * 24)) / 60);
    const mins = minutes % 60;
    const label = days + 'd ' + hours + 'h ' + mins + 'm';
    setText('onboarding-timer', label);
  };
  tick();
  timerInterval = window.setInterval(tick, 60000);
}

function updateProgressUI(progressDoc) {
  const goal = progressDoc.goal ?? 5;
  const progress = progressDoc.progress ?? 0;
  const percent = Math.min(100, Math.round((progress / goal) * 100));
  const bar = document.getElementById('onboarding-progress');
  if (bar) bar.style.width = percent + '%';
  setText('onboarding-progress-count', progress + ' / ' + goal + ' vendas');
  if (progressDoc.dueAt) {
    const dueTime = typeof progressDoc.dueAt === 'number' ? progressDoc.dueAt : Date.parse(progressDoc.dueAt);
    if (dueTime) {
      setText('onboarding-due', new Date(dueTime).toLocaleDateString());
      startTimer(dueTime);
    }
  }
}

export async function startOnboarding(uid) {
  const dueAt = Date.now() + DAYS * 24 * 60 * 60 * 1000;
  await setDoc(doc(db, 'userProgress', uid, 'missions', MISSION_ID), {
    status: 'active',
    startAt: serverTimestamp(),
    dueAt,
    goal: 5,
    progress: 0,
    score: 0,
    feedback: '',
  }, { merge: true });
  setText('onboarding-status', 'Missão iniciada! Envie suas provas.');
  startTimer(dueAt);
  updateProgressUI({ goal: 5, progress: 0, dueAt });
}

export async function uploadProof(uid, file, notes = '') {
  if (!(file instanceof File)) throw new Error('Arquivo inválido');
  const path = 'proofs/' + uid + '/' + MISSION_ID + '/' + Date.now() + '-' + file.name;
  const storagePath = storageRef(storage, path);
  await uploadBytes(storagePath, file);
  const url = await getDownloadURL(storagePath);
  if (PROOF_WEBHOOK && !PROOF_WEBHOOK.includes('{')) {
    const formData = new FormData();
    formData.append('uid', uid);
    formData.append('missionId', MISSION_ID);
    formData.append('notes', notes);
    formData.append('file', file, file.name);
    formData.append('storageUrl', url);
    try {
      const response = await fetch(PROOF_WEBHOOK, { method: 'POST', body: formData });
      const json = await response.json().catch(() => ({}));
      await onProofValidated(uid, Boolean(json.saleValidated));
      return json;
    } catch (error) {
      console.warn('Webhook de prova falhou', error);
    }
  }
  return { storageUrl: url };
}

export async function onProofValidated(uid, saleValidated) {
  if (!saleValidated) return;
  const ref = doc(db, 'userProgress', uid, 'missions', MISSION_ID);
  await updateDoc(ref, { progress: increment(1) });
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  updateProgressUI(data);
  const goal = data.goal ?? 5;
  const progress = data.progress ?? 0;
  if (progress >= goal) {
    await updateDoc(ref, { status: 'approved' });
    setText('onboarding-status', 'Missão concluída! Recompensas liberadas.');
    document.dispatchEvent(new CustomEvent('reward:stats-update', { detail: { xp: 100, currency: 50 } }));
  }
}

export async function activateReminders(payload) {
  if (!REMINDERS_WEBHOOK || REMINDERS_WEBHOOK.includes('{')) return null;
  const response = await fetch(REMINDERS_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ missionId: MISSION_ID, ...payload }),
  });
  return response.json().catch(() => ({}));
}

export { updateProgressUI };
