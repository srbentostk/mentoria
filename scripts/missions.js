// TODO: preencher integrações adicionais (ex.: filtragem dinâmica por pacotes).
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from './firebase-init.js';

async function fetchStaticCatalog() {
  const response = await fetch('./data/missions.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Não foi possível carregar missions.json');
  }
  return response.json();
}

export async function fetchMissionCatalog() {
  try {
    const [staticCatalog, dynamicSnapshot] = await Promise.all([
      fetchStaticCatalog(),
      getDocs(collection(db, 'missions')).catch(() => null),
    ]);
    const dynamicMissions = [];
    if (dynamicSnapshot) {
      dynamicSnapshot.forEach((docSnap) => {
        dynamicMissions.push({ id: docSnap.id, ...docSnap.data() });
      });
    }
    const combined = Array.isArray(staticCatalog)
      ? staticCatalog.concat(dynamicMissions)
      : dynamicMissions;
    return combined;
  } catch (error) {
    console.error('Erro ao obter catálogo', error);
    return [];
  }
}

function createMissionCard(mission) {
  const li = document.createElement('li');
  li.innerHTML =
    '<h3>' +
    (mission.title ?? 'Missão') +
    '</h3>' +
    '<p>' +
    (mission.summary ?? '') +
    '</p>' +
    '<dl class="details">' +
    '<div><dt>Objetivo</dt><dd>' +
    (mission.goal?.label ?? '—') +
    '</dd></div>' +
    '<div><dt>Duração</dt><dd>' +
    (mission.timebox?.label ?? '—') +
    '</dd></div>' +
    '<div><dt>Recompensa</dt><dd>' +
    (mission.rewards?.xp ?? 0) +
    ' XP · ' +
    (mission.rewards?.currency ?? 0) +
    ' ₽</dd></div>' +
    '</dl>';
  return li;
}

async function renderMissionList() {
  const list = document.getElementById('missions-list');
  if (!list) return;
  const missions = await fetchMissionCatalog();
  list.innerHTML = '';
  missions.forEach((mission) => {
    list.appendChild(createMissionCard(mission));
  });
}

renderMissionList();
