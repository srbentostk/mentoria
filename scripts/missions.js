// Lida com o catálogo de missões (arquivo estático + Firestore) e renderiza cards na UI.
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from './firebase-init.js';

let cachedMissions = null;

async function fetchStaticMissions() {
  const response = await fetch('./data/missions.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('missions.json indisponível');
  return response.json();
}

export async function fetchMissionCatalog(force = false) {
  if (cachedMissions && !force) return cachedMissions;
  try {
    const [staticList, snapshot] = await Promise.all([
      fetchStaticMissions().catch(() => []),
      getDocs(collection(db, 'missions')).catch(() => null),
    ]);
    const combined = Array.isArray(staticList) ? [...staticList] : [];
    if (snapshot) {
      snapshot.forEach((docSnap) => {
        const mission = docSnap.data();
        mission.id = mission.id || docSnap.id;
        combined.push(mission);
      });
    }
    cachedMissions = combined;
    return combined;
  } catch (error) {
    console.error('Erro ao buscar missões', error);
    cachedMissions = [];
    return [];
  }
}

export async function getMissionById(id) {
  const missions = await fetchMissionCatalog();
  return missions.find((mission) => mission.id === id);
}

function createLandingCard(mission) {
  const article = document.createElement('article');
  article.className = 'card card--glass mission-card';
  article.innerHTML = [
    '<div class="mission-card__badge">',
    mission.theme || 'missao',
    '</div>',
    '<h3 class="mission-card__title">',
    mission.title || 'Missão',
    '</h3>',
    '<p class="mission-card__summary">',
    mission.tagline || 'Prepare-se para a próxima operação.',
    '</p>',
    '<div class="mission-card__meta">',
    'XP: ', String(mission.xp ?? 0), ' • Moeda: ', String(mission.currency ?? 0),
    '</div>',
    '<a class="button button--ghost mission-card__cta" href="./auth.html#login">Ver missão</a>',
  ].join('');
  return article;
}

function createMemberCard(mission) {
  const li = document.createElement('li');
  li.innerHTML = [
    '<h3>', mission.title || mission.id, '</h3>',
    '<p>', mission.tagline || 'Missão da guilda', '</p>',
    '<dl class="details">',
    '<div><dt>Objetivo</dt><dd>', String(mission.goal ?? 0), ' entregas</dd></div>',
    '<div><dt>Duração</dt><dd>', String(mission.durationDays ?? '?'), ' dias</dd></div>',
    '<div><dt>XP</dt><dd>', String(mission.xp ?? 0), '</dd></div>',
    '</dl>',
  ].join('');
  return li;
}

export async function renderLandingMissions() {
  const container = document.getElementById('featured-missions');
  if (!container) return;
  container.innerHTML = '<article class="card card--ghost" role="listitem">Carregando…</article>';
  const missions = await fetchMissionCatalog();
  container.innerHTML = '';
  const selection = missions.filter((mission) => mission.free !== false).slice(0, 4);
  if (!selection.length) {
    const fallback = document.createElement('article');
    fallback.className = 'card card--ghost';
    fallback.textContent = 'Nenhuma missão disponível no momento.';
    container.appendChild(fallback);
    return;
  }
  selection.forEach((mission) => container.appendChild(createLandingCard(mission)));
}

export async function renderMemberMissions() {
  const list = document.getElementById('missions-list');
  if (!list) return;
  list.innerHTML = '';
  const missions = await fetchMissionCatalog();
  missions.forEach((mission) => list.appendChild(createMemberCard(mission)));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderLandingMissions();
    renderMemberMissions();
  });
} else {
  renderLandingMissions();
  renderMemberMissions();
}
