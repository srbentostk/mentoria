// TODO: preencher animações visuais extras para recompensas.
const rewardAudio = document.getElementById('reward-audio');
let lastStats = { xp: 0, currency: 0 };

function maybePlayReward(stats) {
  if (!rewardAudio) return;
  const gainedXp = (stats.xp || 0) > (lastStats.xp || 0);
  const gainedCurrency = (stats.currency || 0) > (lastStats.currency || 0);
  lastStats = stats;
  if (gainedXp || gainedCurrency) {
    rewardAudio.currentTime = 0;
    rewardAudio.play().catch(function () {
      // ignorar bloqueio automático do navegador
    });
  }
}

document.addEventListener('reward:stats-update', function (event) {
  maybePlayReward(event.detail || {});
});

document.addEventListener('reward:playfab-sync', function (event) {
  console.info('PlayFab sincronizado', event.detail);
});
