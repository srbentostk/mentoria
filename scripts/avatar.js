// Controla a geração de avatar com IA e sincroniza com Firebase Storage/Firestore.
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import {
  doc,
  updateDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { storage, db } from './firebase-init.js';
import { openaiConfig } from './config.js';

const avatarCard = document.getElementById('avatar-card');
const avatarForm = document.getElementById('avatar-form');
const avatarFeedback = document.getElementById('avatar-feedback');
const avatarPreview = document.getElementById('avatar-preview');
const avatarLoading = document.getElementById('avatar-loading');
const avatarHint = document.getElementById('avatar-hint');
const generateButton = document.getElementById('avatar-generate');

let currentUid = null;
let generating = false;

const defaultAvatarSrc = './assets/img/agent_mentor.png';

function sanitize(value) {
  return String(value || '').trim();
}

function setFeedback(message, type = 'info') {
  if (!avatarFeedback) return;
  avatarFeedback.textContent = message;
  avatarFeedback.dataset.type = type;
}

function toggleFormDisabled(disabled) {
  if (!avatarForm) return;
  Array.from(avatarForm.elements).forEach((element) => {
    if ('disabled' in element) {
      element.disabled = disabled;
    }
  });
  if (generateButton) generateButton.disabled = disabled;
}

function toggleLoading(state) {
  generating = state;
  if (avatarLoading) avatarLoading.hidden = !state;
  toggleFormDisabled(state || !currentUid);
}

function ensureConfigured() {
  const key = sanitize(openaiConfig.apiKey);
  if (!key || key.includes('{') || key.toLowerCase().includes('sua-openai-key')) {
    setFeedback('Configuração da OpenAI ausente. Defina OPENAI_API_KEY em env.js.', 'error');
    return false;
  }
  return true;
}

function buildPrompt(descriptors) {
  const details = [];
  if (descriptors.hair) details.push('cabelo: ' + descriptors.hair);
  if (descriptors.clothing) details.push('roupa: ' + descriptors.clothing);
  if (descriptors.body) details.push('tipo de corpo: ' + descriptors.body);
  if (descriptors.skin) details.push('tom de pele: ' + descriptors.skin);
  if (descriptors.eyes) details.push('olhos: ' + descriptors.eyes);
  if (descriptors.accessories) details.push('acessórios: ' + descriptors.accessories);
  if (descriptors.extra) details.push('detalhes extras: ' + descriptors.extra);

  const stylePrompt = [
    'Gere um PNG com fundo transparente de um agente secreto mentor da Jornada dos Poderes Digitais.',
    'Enquadramento em plano médio, estilo clean premium com leve cel-shading, sombra suave 2.5D, 1600px de largura.',
    'Expressão confiante e amigável, sem excesso de detalhes, visual coerente com material corporativo.',
  ];

  if (details.length) {
    stylePrompt.push('Personalize com as seguintes descrições: ' + details.join(' | '));
  } else {
    stylePrompt.push('Use estética neutra profissional caso nenhuma descrição seja fornecida.');
  }

  return stylePrompt.join('\n');
}

async function requestAvatarImage(prompt, signal) {
  const endpoint = sanitize(openaiConfig.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '') + '/images/generations';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + openaiConfig.apiKey,
    },
    body: JSON.stringify({
      model: sanitize(openaiConfig.imageModel || 'gpt-image-1'),
      prompt,
      size: '1024x1024',
      response_format: 'b64_json',
      background: 'transparent',
      user: currentUid || undefined,
    }),
    signal,
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => String(response.status));
    throw new Error('OpenAI error ' + response.status + ': ' + errorText);
  }
  const data = await response.json();
  const image = data?.data?.[0]?.b64_json;
  if (!image) throw new Error('Resposta da OpenAI sem imagem gerada.');
  return image;
}

function base64ToUint8Array(base64) {
  const cleaned = base64.replace(/^data:image\/[^;]+;base64,/, '');
  const binary = atob(cleaned);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function uploadAvatar(uid, bytes) {
  const path = 'avatars/' + uid + '/' + Date.now() + '.png';
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, bytes, { contentType: 'image/png' });
  return getDownloadURL(fileRef);
}

async function persistAvatar(uid, url, prompt, descriptors) {
  const payload = {
    photoURL: url,
    avatar: {
      url,
      prompt,
      descriptors,
      updatedAt: serverTimestamp(),
    },
  };
  await updateDoc(doc(db, 'users', uid), payload);
}

async function handleAvatarSubmit(event) {
  event.preventDefault();
  if (!currentUid) {
    setFeedback('Faça login para gerar um avatar.', 'error');
    return;
  }
  if (!ensureConfigured()) return;
  if (generating) return;

  const formData = new FormData(avatarForm);
  const descriptors = {
    hair: sanitize(formData.get('hair')),
    clothing: sanitize(formData.get('clothing')),
    body: sanitize(formData.get('body')),
    skin: sanitize(formData.get('skin')),
    eyes: sanitize(formData.get('eyes')),
    accessories: sanitize(formData.get('accessories')),
    extra: sanitize(formData.get('extra')),
  };
  const prompt = buildPrompt(descriptors);
  const controller = new AbortController();

  try {
    toggleLoading(true);
    setFeedback('Gerando avatar com IA. Esse processo pode levar alguns segundos...', 'info');
    const imageB64 = await requestAvatarImage(prompt, controller.signal);
    const bytes = base64ToUint8Array(imageB64);
    const downloadURL = await uploadAvatar(currentUid, bytes);
    await persistAvatar(currentUid, downloadURL, prompt, descriptors);
    if (avatarPreview) {
      avatarPreview.src = downloadURL;
      avatarPreview.dataset.hasAvatar = 'true';
    }
    if (avatarHint) {
      avatarHint.textContent = 'Avatar atualizado! Gere outro quando quiser refinar seu agente.';
    }
    if (avatarCard) avatarCard.dataset.hasAvatar = 'true';
    setFeedback('Avatar atualizado com sucesso!', 'success');
  } catch (error) {
    console.error('[avatar] Falha ao gerar avatar', error);
    setFeedback('Não foi possível gerar o avatar agora. Tente novamente em instantes.', 'error');
  } finally {
    toggleLoading(false);
  }
}

if (avatarForm) {
  avatarForm.addEventListener('submit', handleAvatarSubmit);
}

if (generateButton) {
  generateButton.addEventListener('click', () => {
    if (!currentUid) {
      setFeedback('Faça login para gerar um avatar.', 'error');
    }
  });
}

if (avatarPreview && !avatarPreview.src) {
  avatarPreview.src = defaultAvatarSrc;
}

toggleFormDisabled(true);

function reflectAvatarState(hasAvatar) {
  if (avatarCard) avatarCard.dataset.hasAvatar = hasAvatar ? 'true' : 'false';
  if (avatarHint) {
    avatarHint.textContent = hasAvatar
      ? 'Você já tem um avatar. Gere outro se quiser atualizar o visual.'
      : 'Descreva seu visual e gere um avatar exclusivo no estilo da jornada.';
  }
  if (!hasAvatar && avatarPreview) {
    avatarPreview.src = defaultAvatarSrc;
    avatarPreview.dataset.hasAvatar = 'false';
  }
}

function setAvatarUser(user) {
  currentUid = user && user.uid ? user.uid : null;
  toggleFormDisabled(!currentUid || generating);
}

function updateAvatarUI(userDoc) {
  const avatarData = userDoc && userDoc.avatar ? userDoc.avatar : null;
  const url = avatarData && avatarData.url ? avatarData.url : userDoc?.photoURL;
  const hasAvatar = Boolean(url);
  if (avatarPreview) {
    avatarPreview.src = hasAvatar ? url : defaultAvatarSrc;
    avatarPreview.dataset.hasAvatar = hasAvatar ? 'true' : 'false';
  }
  reflectAvatarState(hasAvatar);
  if (avatarFeedback) {
    avatarFeedback.textContent = '';
    avatarFeedback.dataset.type = 'info';
  }
}

export { setAvatarUser, updateAvatarUI };
