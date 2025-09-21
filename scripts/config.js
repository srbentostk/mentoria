// Centraliza o carregamento de variaveis de ambiente expostas em window.__ENV__.
const globalEnv = window.__ENV__ || {};

function resolveEnv(key, fallback) {
  const value = globalEnv[key];
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return value;
}

function warnIfPlaceholder(value, key) {
  if (!value || /\{.+\}/.test(value)) {
    console.warn('Config missing or placeholder detected for ' + key + '. Defina window.__ENV__.' + key + '.');
  }
  return value;
}

const firebaseConfig = {
  apiKey: warnIfPlaceholder(resolveEnv('FIREBASE_API_KEY', '{FIREBASE_API_KEY}'), 'FIREBASE_API_KEY'),
  authDomain: warnIfPlaceholder(resolveEnv('FIREBASE_AUTH_DOMAIN', '{FIREBASE_AUTH_DOMAIN}'), 'FIREBASE_AUTH_DOMAIN'),
  projectId: warnIfPlaceholder(resolveEnv('FIREBASE_PROJECT_ID', '{FIREBASE_PROJECT_ID}'), 'FIREBASE_PROJECT_ID'),
  storageBucket: warnIfPlaceholder(resolveEnv('FIREBASE_STORAGE_BUCKET', '{FIREBASE_STORAGE_BUCKET}'), 'FIREBASE_STORAGE_BUCKET'),
};

const playfabConfig = {
  titleId: warnIfPlaceholder(resolveEnv('PLAYFAB_TITLE_ID', '{PLAYFAB_TITLE_ID}'), 'PLAYFAB_TITLE_ID'),
};

const webhookConfig = {
  reminders: warnIfPlaceholder(resolveEnv('N8N_REMINDERS_WEBHOOK', '{N8N_REMINDERS_WEBHOOK}'), 'N8N_REMINDERS_WEBHOOK'),
  proof: warnIfPlaceholder(resolveEnv('N8N_PROOF_WEBHOOK', '{N8N_PROOF_WEBHOOK}'), 'N8N_PROOF_WEBHOOK'),
  reward: warnIfPlaceholder(resolveEnv('N8N_REWARD_WEBHOOK', '{N8N_REWARD_WEBHOOK}'), 'N8N_REWARD_WEBHOOK'),
};

const formConfig = {
  leadFormAction: warnIfPlaceholder(resolveEnv('FORM_ACTION_URL', '{FORM_ACTION_URL}'), 'FORM_ACTION_URL'),
};

const openaiConfig = {
  apiKey: resolveEnv('OPENAI_API_KEY', ''),
  baseUrl: resolveEnv('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
  imageModel: resolveEnv('OPENAI_IMAGE_MODEL', 'gpt-image-1'),
};

export { firebaseConfig, playfabConfig, webhookConfig, formConfig, openaiConfig };
