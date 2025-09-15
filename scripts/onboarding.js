// TODO: preencher rotinas de jornada avançada (ex.: múltiplas temporadas).
import { fetchMissionCatalog } from './missions.js';

let onboardingDefinition = null;

export async function getOnboardingMission() {
  if (onboardingDefinition) return onboardingDefinition;
  const catalog = await fetchMissionCatalog();
  onboardingDefinition = catalog.find(function (mission) {
    return mission.id === 'onboarding';
  });
  return onboardingDefinition;
}

async function updateLandingHighlights() {
  const mission = await getOnboardingMission();
  if (!mission) return;
  const goalElement = document.querySelector('[data-onboarding-goal]');
  const rewardElement = document.querySelector('[data-onboarding-reward]');
  if (goalElement) {
    goalElement.textContent = mission.goal?.label || '5 vendas em 14 dias';
  }
  if (rewardElement) {
    rewardElement.textContent = String(mission.rewards?.xp || 0) + ' XP';
  }
}

updateLandingHighlights();
