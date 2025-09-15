// TODO: preencher tokens seguros e configurar políticas no PlayFab.
const PLAYFAB_TITLE_ID = '{PLAYFAB_TITLE_ID}';
const PLAYFAB_ENDPOINT = 'https://' + PLAYFAB_TITLE_ID + '.playfabapi.com';

let sessionTicket = null;
let playFabId = null;

async function callPlayFab(path, body) {
  if (!PLAYFAB_TITLE_ID || PLAYFAB_TITLE_ID.includes('{')) {
    console.warn('Configure PLAYFAB_TITLE_ID antes de chamar a API do PlayFab.');
  }
  const response = await fetch(PLAYFAB_ENDPOINT + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-PlayFabSDK': 'PostmanCollection-0.150.221207',
      ...(sessionTicket ? { 'X-Authorization': sessionTicket } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok || json.error) {
    throw new Error(json.errorMessage ?? 'PlayFab request failed');
  }
  return json.data;
}

export async function loginWithCustomId(uid, displayName) {
  const data = await callPlayFab('/Client/LoginWithCustomID', {
    TitleId: PLAYFAB_TITLE_ID,
    CreateAccount: true,
    CustomId: uid,
  });
  sessionTicket = data.SessionTicket;
  playFabId = data.PlayFabId;
  if (displayName) {
    await updateDisplayName(displayName);
  }
  return data;
}

export async function updateDisplayName(displayName) {
  if (!displayName) return;
  await callPlayFab('/Client/UpdateUserTitleDisplayName', {
    DisplayName: displayName,
  });
}

export async function updatePlayerStatistics(stats = {}) {
  const statistics = Object.entries(stats).map(function ([statisticName, value]) {
    return {
      StatisticName: statisticName,
      Value: Number(value) || 0,
    };
  });
  if (statistics.length === 0) return;
  await callPlayFab('/Client/UpdatePlayerStatistics', {
    Statistics: statistics,
  });
}

export async function addCurrency(currencyCode, amount) {
  await callPlayFab('/Client/AddUserVirtualCurrency', {
    VirtualCurrency: currencyCode,
    Amount: amount,
  });
}

export async function updatePlayerData(data = {}) {
  await callPlayFab('/Client/UpdateUserData', {
    Data: data,
    Permission: 'Public',
  });
}

export function getCachedPlayFabInfo() {
  return { sessionTicket, playFabId };
}
