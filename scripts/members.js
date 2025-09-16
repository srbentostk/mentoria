// Controla a área de membros: verifica login, renderiza perfil e integra com onboarding.
import {
  onAuthStateChanged,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc,
  getDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db } from './firebase-init.js';
import {
  startOnboarding,
  uploadProof,
  activateReminders,
  startTimer,
  updateProgressUI,
} from './onboarding.js';
import { renderMemberMissions } from './missions.js';

const greeting = document.getElementById('member-greeting');
const statsXp = document.getElementById('stats-xp');
const statsCurrency = document.getElementById('stats-currency');
const statsBadges = document.getElementById('stats-badges');
const badgesContainer = document.getElementById('profile-badges');
const startButton = document.getElementById('start-onboarding');
const refreshButton = document.getElementById('refresh-profile');
const logoutButton = document.getElementById('logout');
const proofForm = document.getElementById('proof-form');
const remindersButton = document.getElementById('activate-reminders');

let currentUser = null;

function requireAuth(user) {
  if (!user) {
    window.location.href = './auth.html#login';
    return false;
  }
  return true;
}

function renderProfile(user, userDoc) {
  if (greeting) {
    const name = userDoc.displayName || user.displayName || user.email || 'Agente';
    greeting.textContent = 'Bem-vindo, ' + name;
  }
  document.getElementById('profile-uid')?.textContent = user.uid;
  document.getElementById('profile-display-name')?.textContent = userDoc.displayName || user.displayName || '—';
  document.getElementById('profile-email')?.textContent = user.email || '—';
  document.getElementById('profile-email-verified')?.textContent = user.emailVerified ? 'Verificado' : 'Pendente';
  document.getElementById('profile-playfab')?.textContent = userDoc.playFabId || '—';
  statsXp.textContent = String(userDoc.stats?.xp ?? 0);
  statsCurrency.textContent = String(userDoc.stats?.currency ?? 0);
  const badges = userDoc.badges || {};
  const enabledBadges = Object.keys(badges).filter((key) => badges[key]);
  statsBadges.textContent = String(enabledBadges.length);
  if (badgesContainer) {
    badgesContainer.innerHTML = '';
    enabledBadges.forEach((badge) => {
      const span = document.createElement('span');
      span.textContent = badge;
      badgesContainer.appendChild(span);
    });
  }
}

async function loadState() {
  if (!currentUser) return;
  const userRef = doc(db, 'users', currentUser.uid);
  const userSnap = await getDoc(userRef);
  const userDoc = userSnap.exists() ? userSnap.data() : {};
  renderProfile(currentUser, userDoc);

  const progressRef = doc(db, 'userProgress', currentUser.uid, 'missions', 'onboarding-5v14d');
  const progressSnap = await getDoc(progressRef);
  if (progressSnap.exists()) {
    const data = progressSnap.data();
    document.getElementById('onboarding-status')?.textContent = 'Status: ' + (data.status || 'active');
    updateProgressUI(data);
    if (data.dueAt) startTimer(typeof data.dueAt === 'number' ? data.dueAt : Date.parse(data.dueAt));
  } else {
    document.getElementById('onboarding-status')?.textContent = 'Aceite o desafio para iniciar.';
  }
}

async function handleStartOnboarding() {
  if (!currentUser) return;
  await startOnboarding(currentUser.uid);
  await loadState();
}

async function handleProofSubmit(event) {
  event.preventDefault();
  if (!currentUser || !proofForm) return;
  const file = proofForm.querySelector('input[name="proof"]').files?.[0];
  const notes = proofForm.querySelector('textarea[name="notes"]').value || '';
  const feedback = proofForm.querySelector('.form__feedback');
  try {
    await uploadProof(currentUser.uid, file, notes);
    if (feedback) {
      feedback.textContent = 'Prova enviada! Aguarde validação.';
      feedback.dataset.type = 'success';
    }
    proofForm.reset();
    await loadState();
  } catch (error) {
    console.error('Erro no upload da prova', error);
    if (feedback) {
      feedback.textContent = 'Não foi possível enviar a prova.';
      feedback.dataset.type = 'error';
    }
  }
}

async function handleReminders() {
  if (!currentUser) return;
  const dueText = document.getElementById('onboarding-due')?.textContent || '';
  const dueAt = Date.parse(dueText) || Date.now() + 14 * 24 * 60 * 60 * 1000;
  await activateReminders({ uid: currentUser.uid, email: currentUser.email, dueAt });
  document.getElementById('onboarding-status')?.textContent = 'Lembretes ativados!';
}

if (startButton) startButton.addEventListener('click', handleStartOnboarding);
if (refreshButton) refreshButton.addEventListener('click', loadState);
if (logoutButton) logoutButton.addEventListener('click', () => signOut(auth));
if (proofForm) proofForm.addEventListener('submit', handleProofSubmit);
if (remindersButton) remindersButton.addEventListener('click', handleReminders);

renderMemberMissions();

onAuthStateChanged(auth, async (user) => {
  if (!requireAuth(user)) return;
  currentUser = user;
  await loadState();
});
