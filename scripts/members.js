// TODO: preencher métricas adicionais (ex.: dashboards em tempo real com Analytics).
import {
  onAuthStateChanged,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  increment,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import { auth, db, storage } from './firebase-init.js';
import {
  loginWithCustomId,
  updatePlayerStatistics,
  updatePlayerData,
  addCurrency,
  getCachedPlayFabInfo,
} from './playfab.js';
import { fetchMissionCatalog } from './missions.js';

const DEFAULT_MISSION_ID = 'onboarding';
const REMINDERS_WEBHOOK = '{N8N_REMINDERS_WEBHOOK}';
const PROOF_WEBHOOK = '{N8N_PROOF_WEBHOOK}';

const profileFields = {
  uid: document.getElementById('profile-uid'),
  displayName: document.getElementById('profile-display-name'),
  email: document.getElementById('profile-email'),
  emailVerified: document.getElementById('profile-email-verified'),
  playfab: document.getElementById('profile-playfab'),
};
const profileBadges = document.getElementById('profile-badges');
const onboardingStatus = document.getElementById('onboarding-status');
const onboardingProgressBar = document.getElementById('onboarding-progress');
const onboardingProgressCount = document.getElementById('onboarding-progress-count');
const onboardingDue = document.getElementById('onboarding-due');
const startOnboardingButton = document.getElementById('start-onboarding');
const proofForm = document.getElementById('proof-form');
const refreshButton = document.getElementById('refresh-profile');
const logoutButton = document.getElementById('logout');
const statsXp = document.getElementById('stats-xp');
const statsCurrency = document.getElementById('stats-currency');
const statsBadges = document.getElementById('stats-badges');

let currentUser = null;
let onboardingMission = null;

function redirectToAuth() {
  window.location.replace('./auth.html');
}

function renderProfile(userDoc) {
  if (!currentUser) return;
  profileFields.uid.textContent = currentUser.uid;
  profileFields.displayName.textContent = currentUser.displayName || '—';
  profileFields.email.textContent = currentUser.email || '—';
  profileFields.emailVerified.textContent = currentUser.emailVerified ? 'Verificado' : 'Pendente';
  profileFields.playfab.textContent = userDoc.playFabId || '—';
  statsXp.textContent = String(userDoc.stats?.xp ?? 0);
  statsCurrency.textContent = String(userDoc.stats?.currency ?? 0);
  statsBadges.textContent = Array.isArray(userDoc.badgesAwarded)
    ? userDoc.badgesAwarded.join(', ')
    : '—';
  if (profileBadges) {
    profileBadges.innerHTML = '';
    const badgesConfig = userDoc.badges || {};
    Object.keys(badgesConfig).forEach(function (badgeKey) {
      if (badgesConfig[badgeKey]) {
        const span = document.createElement('span');
        span.textContent = badgeKey;
        profileBadges.appendChild(span);
      }
    });
  }
}

function updateProgressUI(progressDoc) {
  if (!progressDoc) return;
  onboardingStatus.textContent = 'Status: ' + (progressDoc.status || 'not_started');
  const goal = progressDoc.goal ?? 5;
  const progressValue = progressDoc.progress ?? 0;
  const percentage = Math.min(100, Math.round((progressValue / goal) * 100));
  onboardingProgressBar.style.width = percentage + '%';
  onboardingProgressCount.textContent = progressValue + ' de ' + goal;
  onboardingDue.textContent = progressDoc.dueAt
    ? new Date(progressDoc.dueAt).toLocaleDateString('pt-BR')
    : 'Prazo não definido';
}

async function fetchOnboardingMission() {
  if (onboardingMission) return onboardingMission;
  const catalog = await fetchMissionCatalog();
  onboardingMission = catalog.find(function (mission) {
    return mission.id === DEFAULT_MISSION_ID;
  });
  return onboardingMission;
}

async function ensureReminderSchedule(uid, dueAt) {
  if (!REMINDERS_WEBHOOK || REMINDERS_WEBHOOK.includes('{')) {
    return;
  }
  try {
    await fetch(REMINDERS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uid, missionId: DEFAULT_MISSION_ID, dueAt: dueAt }),
    });
  } catch (error) {
    console.warn('Falha ao agendar lembretes', error);
  }
}

async function startOnboarding(uid) {
  const mission = await fetchOnboardingMission();
  const now = Date.now();
  const dueAt = now + 14 * 24 * 60 * 60 * 1000;
  const progressRef = doc(db, 'userProgress', uid, 'missions', DEFAULT_MISSION_ID);
  await setDoc(progressRef, {
    status: 'active',
    startAt: serverTimestamp(),
    dueAt: dueAt,
    progress: 0,
    goal: mission?.goal?.value ?? 5,
    score: 0,
    feedback: '',
  }, { merge: true });
  await updateDoc(doc(db, 'users', uid), {
    'badges.onboardingStarted': true,
  });
  await ensureReminderSchedule(uid, dueAt);
  await loadMemberState(uid);
}

async function loadMemberState(uid) {
  const userSnap = await getDoc(doc(db, 'users', uid));
  const userData = userSnap.exists() ? userSnap.data() : {};
  renderProfile(userData);

  const progressSnap = await getDoc(doc(db, 'userProgress', uid, 'missions', DEFAULT_MISSION_ID));
  if (progressSnap.exists()) {
    updateProgressUI(progressSnap.data());
  } else {
    onboardingStatus.textContent = 'Aceite a missão para iniciar a contagem.';
    onboardingProgressBar.style.width = '0%';
    onboardingProgressCount.textContent = '0 de 5';
  }

  if (userData.stats) {
    document.dispatchEvent(
      new CustomEvent('reward:stats-update', { detail: userData.stats })
    );
  }

  if (!userData.playFabId && currentUser) {
    try {
      const loginData = await loginWithCustomId(currentUser.uid, currentUser.displayName || 'Agente');
      await updateDoc(doc(db, 'users', uid), {
        playFabId: loginData.PlayFabId,
      });
      renderProfile({ ...userData, playFabId: loginData.PlayFabId });
    } catch (error) {
      console.warn('Falha ao sincronizar PlayFab', error);
    }
  }
}

async function handleProofSubmit(event) {
  event.preventDefault();
  if (!currentUser || !proofForm) return;
  const formData = new FormData(proofForm);
  const file = formData.get('proof');
  if (!(file instanceof File)) {
    return;
  }
  const notes = String(formData.get('notes') || '');
  const timestamp = Date.now();
  const path = 'proofs/' + currentUser.uid + '/' + DEFAULT_MISSION_ID + '/' + timestamp + '-' + file.name;
  const storageReference = storageRef(storage, path);
  try {
    await uploadBytes(storageReference, file);
    const url = await getDownloadURL(storageReference);
    const proofId = String(timestamp);
    const proofRef = doc(db, 'userProofs', currentUser.uid, 'missions', DEFAULT_MISSION_ID, proofId);
    await setDoc(proofRef, {
      type: file.type,
      url: url,
      createdAt: serverTimestamp(),
      notes: notes,
      redacted: false,
    });
    await updateDoc(doc(db, 'userProgress', currentUser.uid, 'missions', DEFAULT_MISSION_ID), {
      progress: increment(1),
      status: 'submitted',
    });
    if (!PROOF_WEBHOOK.includes('{')) {
      const webhookForm = new FormData();
      webhookForm.append('uid', currentUser.uid);
      webhookForm.append('missionId', DEFAULT_MISSION_ID);
      webhookForm.append('notes', notes);
      webhookForm.append('file', file, file.name);
      try {
        await fetch(PROOF_WEBHOOK, {
          method: 'POST',
          body: webhookForm,
        });
      } catch (error) {
        console.warn('Falha ao notificar N8n', error);
      }
    }
    setFormFeedback('Prova enviada para validação!', 'success');
    await loadMemberState(currentUser.uid);
  } catch (error) {
    console.error('Erro ao enviar prova', error);
    setFormFeedback('Não foi possível enviar sua prova.', 'error');
  }
}

function setFormFeedback(message, type) {
  if (!proofForm) return;
  const feedback = proofForm.querySelector('.form__feedback');
  if (feedback) {
    feedback.textContent = message;
    feedback.dataset.type = type;
  }
}

async function handleStartClick() {
  if (!currentUser) return;
  await startOnboarding(currentUser.uid);
}

async function handleRefresh() {
  if (!currentUser) return;
  await loadMemberState(currentUser.uid);
}

async function handleLogout() {
  await signOut(auth);
}

async function syncStatsWithPlayFab(stats) {
  try {
    await updatePlayerStatistics({ XP: stats.xp || 0 });
    await addCurrency('JP', stats.currency || 0);
    await updatePlayerData({ badges: JSON.stringify(stats.badges || {}) });
    const info = getCachedPlayFabInfo();
    document.dispatchEvent(new CustomEvent('reward:playfab-sync', { detail: info }));
  } catch (error) {
    console.warn('Erro ao sincronizar estatísticas com PlayFab', error);
  }
}

onAuthStateChanged(auth, async function (user) {
  if (!user) {
    redirectToAuth();
    return;
  }
  currentUser = user;
  await loadMemberState(user.uid);
  if (user.emailVerified) {
    await updateDoc(doc(db, 'users', user.uid), {
      emailVerified: true,
      'badges.emailVerified': true,
    });
  }
  const userSnap = await getDoc(doc(db, 'users', user.uid));
  if (userSnap.exists()) {
    await syncStatsWithPlayFab(userSnap.data().stats || {});
  }
});

if (proofForm) {
  proofForm.addEventListener('submit', handleProofSubmit);
}
if (startOnboardingButton) {
  startOnboardingButton.addEventListener('click', handleStartClick);
}
if (refreshButton) {
  refreshButton.addEventListener('click', handleRefresh);
}
if (logoutButton) {
  logoutButton.addEventListener('click', handleLogout);
}
