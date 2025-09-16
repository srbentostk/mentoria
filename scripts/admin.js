// TODO: integrar validação avançada (ajuste conforme evoluir o schema).
import {
  onAuthStateChanged,
  getIdTokenResult,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db } from './firebase-init.js';

const adminGuard = document.getElementById('admin-guard');
const adminPanel = document.getElementById('admin-panel');
const missionsListing = document.getElementById('missions-listing');
const messageElement = document.getElementById('admin-message');
const goAuthButton = document.getElementById('go-auth');
const publishButton = document.getElementById('publish-mission');
const publishFeedback = document.getElementById('publish-feedback');
const jsonTextarea = document.getElementById('mission-json');
const missionsList = document.getElementById('admin-missions');
const logoutButton = document.getElementById('logout');

function setGuardState(message, showAuthButton) {
  if (!adminGuard) return;
  adminGuard.hidden = false;
  adminPanel.hidden = true;
  missionsListing.hidden = true;
  if (messageElement) messageElement.textContent = message;
  if (goAuthButton) goAuthButton.hidden = !showAuthButton;
}

function allowAdminUI() {
  if (adminGuard) adminGuard.hidden = true;
  if (adminPanel) adminPanel.hidden = false;
  if (missionsListing) missionsListing.hidden = false;
}

function setPublishFeedback(message, type = 'info') {
  if (!publishFeedback) return;
  publishFeedback.textContent = message;
  publishFeedback.dataset.type = type;
}

function validateMissionPayload(mission) {
  const requiredString = ['id', 'title', 'tagline', 'theme', 'reviewPolicy'];
  for (const key of requiredString) {
    if (typeof mission[key] !== 'string' || mission[key].trim() === '') {
      throw new Error(`Campo obrigatório ausente ou inválido: ${key}`);
    }
  }
  if (typeof mission.free !== 'boolean') throw new Error('Campo free deve ser boolean.');
  const numericFields = ['points', 'xp', 'currency', 'durationDays', 'goal'];
  for (const key of numericFields) {
    if (typeof mission[key] !== 'number' || Number.isNaN(mission[key])) {
      throw new Error(`Campo numérico inválido: ${key}`);
    }
  }
  if (!Array.isArray(mission.badges) || mission.badges.length === 0) {
    throw new Error('Liste ao menos um badge.');
  }
  if (!mission.deliverable || !Array.isArray(mission.deliverable.types)) {
    throw new Error('Deliverable.types deve ser uma lista.');
  }
  if (!mission.materials) {
    throw new Error('Materials obrigatório.');
  }
  if (!Array.isArray(mission.requirements)) {
    throw new Error('Requirements deve ser uma lista.');
  }
  if (!Array.isArray(mission.tools)) {
    throw new Error('Tools deve ser uma lista.');
  }
  if (typeof mission.description_md !== 'string') {
    throw new Error('description_md deve ser string.');
  }
  if (typeof mission.commentsEnabled !== 'boolean') {
    throw new Error('commentsEnabled deve ser boolean.');
  }
  if (typeof mission.aiEvaluation !== 'boolean') {
    throw new Error('aiEvaluation deve ser boolean.');
  }
  return mission;
}

async function publishMission() {
  if (!jsonTextarea) return;
  const raw = jsonTextarea.value.trim();
  if (!raw) {
    setPublishFeedback('Cole o JSON antes de publicar.', 'error');
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    const mission = validateMissionPayload(parsed);
    const ref = doc(db, 'missions', mission.id);
    await setDoc(ref, { ...mission, updatedAt: serverTimestamp() }, { merge: true });
    setPublishFeedback('Missão publicada com sucesso!', 'success');
    await loadMissions();
  } catch (error) {
    console.error('Erro ao publicar missão', error);
    setPublishFeedback(error.message || 'Não foi possível publicar.', 'error');
  }
}

async function loadMissions() {
  if (!missionsList) return;
  missionsList.innerHTML = '';
  try {
    const snapshot = await getDocs(collection(db, 'missions'));
    if (snapshot.empty) {
      const li = document.createElement('li');
      li.textContent = 'Nenhuma missão publicada ainda.';
      missionsList.appendChild(li);
      return;
    }
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML =
        '<strong>' +
        (data.title || docSnap.id) +
        '</strong>' +
        '<p class="notice">ID: ' +
        docSnap.id +
        ' • XP: ' +
        (data.xp ?? 0) +
        ' • Moeda: ' +
        (data.currency ?? 0) +
        '</p>';
      missionsList.appendChild(li);
    });
  } catch (error) {
    console.error('Erro ao listar missões', error);
    const li = document.createElement('li');
    li.textContent = 'Erro ao carregar missões.';
    missionsList.appendChild(li);
  }
}

if (publishButton) {
  publishButton.addEventListener('click', publishMission);
}

if (logoutButton) {
  logoutButton.addEventListener('click', () => signOut(auth));
}

if (goAuthButton) {
  goAuthButton.addEventListener('click', () => {
    window.location.href = './auth.html#login';
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    setGuardState('Autentique-se como admin para acessar.', true);
    return;
  }
  try {
    const token = await getIdTokenResult(user, true);
    if (token.claims?.admin) {
      allowAdminUI();
      await loadMissions();
    } else {
      setGuardState('Você não tem permissão de administrador.', false);
    }
  } catch (error) {
    console.error('Erro ao validar claims', error);
    setGuardState('Não foi possível validar suas credenciais.', false);
  }
});
