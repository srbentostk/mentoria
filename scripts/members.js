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
import { setAvatarUser, updateAvatarUI } from './avatar.js';

console.log('[members] Script carregado');

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

console.log('[members] Elementos iniciais', {
  hasGreeting: Boolean(greeting),
  hasLogoutButton: Boolean(logoutButton),
  hasProofForm: Boolean(proofForm),
});

let currentUser = null;
let signingOut = false;
let logoutRedirect = null;

function setTextById(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function requireAuth(user) {
  if (!user) {
    currentUser = null;
    signingOut = false;
    const target = logoutRedirect || './auth.html#login';
    logoutRedirect = null;
    console.log('[members] Usuário não autenticado, redirecionando para', target);
    setAvatarUser(null);
    window.location.href = target;
    return false;
  }
  console.log('[members] Usuário autenticado detectado', user.uid);
  return true;
}

function renderProfile(user, userDoc) {
  if (greeting) {
    const name = userDoc.displayName || user.displayName || user.email || 'Agente';
    greeting.textContent = 'Bem-vindo, ' + name;
  }
  const profileUid = document.getElementById('profile-uid');
  if (profileUid) profileUid.textContent = user.uid;
  const profileDisplayName = document.getElementById('profile-display-name');
  if (profileDisplayName) profileDisplayName.textContent = userDoc.displayName || user.displayName || '—';
  const profileEmail = document.getElementById('profile-email');
  if (profileEmail) profileEmail.textContent = user.email || '—';
  const profileEmailVerified = document.getElementById('profile-email-verified');
  if (profileEmailVerified) profileEmailVerified.textContent = user.emailVerified ? 'Verificado' : 'Pendente';
  const profilePlayfab = document.getElementById('profile-playfab');
  if (profilePlayfab) profilePlayfab.textContent = userDoc.playFabId || '—';
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
  updateAvatarUI(userDoc);
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
    setTextById('onboarding-status', 'Status: ' + (data.status || 'active'));
    updateProgressUI(data);
    if (data.dueAt) startTimer(typeof data.dueAt === 'number' ? data.dueAt : Date.parse(data.dueAt));
  } else {
    setTextById('onboarding-status', 'Aceite o desafio para iniciar.');
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
  setTextById('onboarding-status', 'Lembretes ativados!');
}

async function handleLogout() {
  if (!logoutButton || signingOut) return;
  const originalLabel = logoutButton.textContent;
  signingOut = true;
  logoutRedirect = './index.html';
  console.log('[members] Logout iniciado');
  logoutButton.disabled = true;
  logoutButton.setAttribute('aria-busy', 'true');
  logoutButton.textContent = 'Saindo...';
  try {
    console.log('[members] Chamando signOut');
    await signOut(auth);
    console.log('[members] signOut concluído, aguardando onAuthStateChanged');
  } catch (error) {
    console.error('Erro ao sair do Firebase', error);
    logoutButton.disabled = false;
    logoutButton.removeAttribute('aria-busy');
    logoutButton.textContent = originalLabel;
    signingOut = false;
    logoutRedirect = null;
  } finally {
    console.log('[members] Estado de logout', { signingOut, logoutRedirect });
    const target = logoutRedirect || './auth.html#login';
    window.setTimeout(() => {
      console.log('[members] Redirecionando manualmente para', target);
      window.location.href = target;
    }, 150);
  }
}

if (startButton) startButton.addEventListener('click', handleStartOnboarding);
if (refreshButton) refreshButton.addEventListener('click', loadState);
if (logoutButton) {
  console.log('[members] Listener de logout registrado');
  logoutButton.addEventListener('click', handleLogout);
} else {
  console.warn('[members] Botão de logout não encontrado');
}

window.__membersDebug = {
  handleLogout,
  get state() {
    return { currentUser, signingOut, logoutRedirect };
  },
};
if (proofForm) proofForm.addEventListener('submit', handleProofSubmit);
if (remindersButton) remindersButton.addEventListener('click', handleReminders);

renderMemberMissions();

onAuthStateChanged(auth, async (user) => {
  console.log('[members] onAuthStateChanged disparado', user ? user.uid : 'sem usuário');
  if (!requireAuth(user)) return;
  currentUser = user;
  signingOut = false;
  logoutRedirect = null;
  setAvatarUser(user);
  await loadState();
});
