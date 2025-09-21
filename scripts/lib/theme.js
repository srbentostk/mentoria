import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db } from '../firebase-init.js';

const STORAGE_KEY = 'qbranch.advancedMode';
const STATUS_MESSAGES = {
  enabled: 'Modo avançado ativo. Arsenal liberado e tema especial aplicado.',
  disabled: 'Modo padrão ativo.',
  error: 'Não foi possível salvar a preferência agora. Permanecemos no modo anterior.',
};

function readLocalPreference() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null) return null;
    return raw === 'true';
  } catch (error) {
    console.warn('[theme] Falha ao ler preferência local', error);
    return null;
  }
}

function writeLocalPreference(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  } catch (error) {
    console.warn('[theme] Falha ao salvar preferência local', error);
  }
}

function applyTheme(enabled) {
  if (enabled) {
    document.documentElement.dataset.theme = 'advanced';
  } else {
    delete document.documentElement.dataset.theme;
  }
}

function updateStatus(statusElement, arsenalGrid, enabled, state = 'normal') {
  if (statusElement) {
    const key = state === 'error' ? 'error' : enabled ? 'enabled' : 'disabled';
    statusElement.textContent = STATUS_MESSAGES[key];
  }
  if (arsenalGrid) {
    arsenalGrid.dataset.active = enabled ? 'true' : 'false';
  }
}

async function persistRemotePreference(uid, enabled) {
  if (!uid) return;
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { prefs: { advancedMode: enabled } }, { merge: true });
}

export async function initAdvancedThemeControls({ toggle, statusElement, arsenalGrid } = {}) {
  let currentUser = null;
  let currentValue = false;

  function reflect(enabled, state = 'normal') {
    applyTheme(enabled);
    updateStatus(statusElement, arsenalGrid, enabled, state);
    if (toggle) {
      toggle.checked = enabled;
      toggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    }
  }

  const initialLocal = readLocalPreference();
  if (typeof initialLocal === 'boolean') {
    currentValue = initialLocal;
  }
  reflect(currentValue);

  async function changeMode(enabled) {
    if (enabled === currentValue) return;
    const previous = currentValue;
    currentValue = enabled;
    reflect(enabled);
    writeLocalPreference(enabled);
    try {
      if (currentUser?.uid) {
        await persistRemotePreference(currentUser.uid, enabled);
      }
    } catch (error) {
      console.error('[theme] Falha ao persistir preferência no Firestore', error);
      currentValue = previous;
      reflect(previous, 'error');
      writeLocalPreference(previous);
      throw error;
    }
  }

  if (toggle) {
    toggle.addEventListener('change', async () => {
      const desired = toggle.checked;
      if (
        desired &&
        !window.confirm(
          'Ativar Modo Avançado? Isso aplica o tema especial e salva em users/{uid}.prefs.advancedMode quando autenticado.',
        )
      ) {
        toggle.checked = currentValue;
        return;
      }
      toggle.disabled = true;
      toggle.setAttribute('aria-busy', 'true');
      try {
        await changeMode(desired);
      } catch (error) {
        toggle.checked = currentValue;
      } finally {
        toggle.disabled = false;
        toggle.removeAttribute('aria-busy');
        toggle.setAttribute('aria-pressed', currentValue ? 'true' : 'false');
      }
    });
  }

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (!user) {
      const fallback = readLocalPreference();
      if (typeof fallback === 'boolean') {
        currentValue = fallback;
      }
      reflect(currentValue);
      return;
    }

    try {
      const snapshot = await getDoc(doc(db, 'users', user.uid));
      const remoteValue = snapshot.exists() ? snapshot.data()?.prefs?.advancedMode : undefined;
      if (typeof remoteValue === 'boolean') {
        currentValue = remoteValue;
        writeLocalPreference(remoteValue);
      } else {
        const localPref = readLocalPreference();
        if (typeof localPref === 'boolean') {
          currentValue = localPref;
          await persistRemotePreference(user.uid, localPref);
        }
      }
    } catch (error) {
      console.error('[theme] Não foi possível sincronizar preferência avançada', error);
    }

    reflect(currentValue);
  });
}
