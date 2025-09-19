// Abstrai chamadas basicas ao PlayFab Client SDK (login, XP, moeda, display name).
import { playfabConfig } from './config.js';
const PLAYFAB_TITLE_ID = playfabConfig.titleId;
let sdkPromise = null;
let currentSessionTicket = null;

function loadSdk() {
  if (window.PlayFabClientSDK) return Promise.resolve(window.PlayFabClientSDK);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://download.playfab.com/PlayFabClientSdk.js';
    script.async = true;
    script.onload = () => {
      if (window.PlayFabClientSDK) {
        window.PlayFabClientSDK.settings.titleId = PLAYFAB_TITLE_ID;
        resolve(window.PlayFabClientSDK);
      } else {
        reject(new Error('PlayFabClientSDK not found'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PlayFabClientSDK'));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

async function callPlayFab(method, payload) {
  const sdk = await loadSdk();
  return new Promise((resolve, reject) => {
    const fn = sdk[method];
    if (typeof fn !== 'function') {
      reject(new Error('Invalid PlayFab method: ' + method));
      return;
    }
    const request = { ...payload };
    fn.requestSettings = fn.requestSettings || {};
    if (currentSessionTicket) {
      fn.requestSettings.sessionTicket = currentSessionTicket;
    }
    fn(request, (response) => {
      currentSessionTicket = response && response.data && response.data.SessionTicket
        ? response.data.SessionTicket
        : currentSessionTicket;
      resolve((response && response.data) || response);
    }, (error) => {
      reject(new Error((error && error.errorMessage) || 'PlayFab error'));
    });
  });
}

export async function loginWithCustomId(uid, displayName) {
  const data = await callPlayFab('LoginWithCustomID', {
    TitleId: PLAYFAB_TITLE_ID,
    CreateAccount: true,
    CustomId: uid,
  });
  if (data && data.SessionTicket) {
    currentSessionTicket = data.SessionTicket;
  }
  if (displayName) {
    await updateDisplayName(displayName);
  }
  return data;
}

export async function updateDisplayName(displayName) {
  if (!displayName) return null;
  return callPlayFab('UpdateUserTitleDisplayName', {
    DisplayName: displayName,
  });
}

export async function addXP(amount) {
  const normalized = Number(amount) || 0;
  if (!normalized) return null;
  return callPlayFab('UpdatePlayerStatistics', {
    Statistics: [{ StatisticName: 'XP', Value: normalized }],
  });
}

export async function addCurrency(code, amount) {
  const normalized = Number(amount) || 0;
  if (!normalized) return null;
  return callPlayFab('AddUserVirtualCurrency', {
    VirtualCurrency: code,
    Amount: normalized,
  });
}

export { loadSdk };
