// Controla cadastro, login e integração com PlayFab, além de atualizar a UI de /auth.html.
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db } from './firebase-init.js';
import {
  loginWithCustomId,
  updateDisplayName as playFabUpdateDisplayName,
  addXP,
  addCurrency,
} from './playfab.js';

const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const googleButton = document.getElementById('google-login');
const resendVerificationButton = document.getElementById('resend-verification');
const verificationStatus = document.getElementById('verification-status');
const tabs = document.querySelectorAll('.auth__tab');

const badgeDefaults = {
  emailVerified: false,
  onboardingStarted: false,
  onboardingCompleted: false,
};

const googleProvider = new GoogleAuthProvider();

auth.useDeviceLanguage();

function setFeedback(container, message, type = 'info') {
  const feedback = container?.querySelector('.form__feedback');
  if (feedback) {
    feedback.textContent = message;
    feedback.dataset.type = type;
  }
}

async function ensureUserDocument(user, displayName) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  const payload = {
    email: user.email,
    displayName: displayName ?? user.displayName ?? '',
    photoURL: user.photoURL ?? '',
    createdAt: serverTimestamp(),
    emailVerified: user.emailVerified,
    playFabId: null,
    badges: badgeDefaults,
    stats: { xp: 0, currency: 0 },
  };
  await setDoc(ref, payload, { merge: true });
  return payload;
}

async function syncPlayFab(user, displayName) {
  try {
    const loginResult = await loginWithCustomId(user.uid, displayName ?? user.displayName ?? 'Agente');
    await playFabUpdateDisplayName(displayName ?? user.displayName ?? 'Agente');
    await updateDoc(doc(db, 'users', user.uid), { playFabId: loginResult?.PlayFabId ?? loginResult?.data?.PlayFabId ?? null });
  } catch (error) {
    console.warn('Falha ao sincronizar com PlayFab', error);
  }
}

async function handleEmailVerifiedBadge(user) {
  if (!user.emailVerified) return;
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  if (data.badges?.emailVerified === true) return;
  try {
    await updateDoc(ref, {
      emailVerified: true,
      'badges.emailVerified': true,
      'stats.xp': increment(10),
      'stats.currency': increment(5),
    });
    await addXP(10);
    await addCurrency('GC', 5);
  } catch (error) {
    console.warn('Erro ao conceder badge de e-mail', error);
  }
}

export async function signup(email, password, displayName) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  await ensureUserDocument(credential.user, displayName);
  await sendEmailVerification(credential.user);
  await syncPlayFab(credential.user, displayName);
  return credential.user;
}

export async function login(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserDocument(credential.user);
  await syncPlayFab(credential.user);
  await handleEmailVerifiedBadge(credential.user);
  return credential.user;
}

export async function logout() {
  await signOut(auth);
}

function switchTab(target) {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === target;
    tab.setAttribute('aria-selected', String(isActive));
  });
  if (!signupForm || !loginForm) return;
  const showLogin = target === 'login';
  loginForm.classList.toggle('is-hidden', !showLogin);
  signupForm.classList.toggle('is-hidden', showLogin);
}

function applyTabFromHash() {
  const hash = String(window.location.hash || '').replace('#', '');
  if (!hash) return;
  if (hash === 'login' || hash === 'signup') {
    switchTab(hash);
  }
}

async function handleSignupSubmit(event) {
  event.preventDefault();
  if (!signupForm) return;
  const formData = new FormData(signupForm);
  const displayName = String(formData.get('displayName') || 'Agente');
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const acceptedLgpd = signupForm.querySelector('[name="lgpd"]')?.checked;
  if (!acceptedLgpd) {
    setFeedback(signupForm, 'Aceite os termos da LGPD para continuar.', 'error');
    return;
  }
  try {
    const user = await signup(email, password, displayName);
    setFeedback(signupForm, 'Conta criada! Verifique seu e-mail para continuar.', 'success');
    verificationStatus.textContent = 'Verifique seu e-mail para liberar as missões.';
    console.info('Usuário criado', user.uid);
  } catch (error) {
    console.error('Erro no cadastro', error);
    setFeedback(signupForm, 'Não foi possível criar a conta. Confira os dados.', 'error');
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  if (!loginForm) return;
  const formData = new FormData(loginForm);
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  try {
    const user = await login(email, password);
    setFeedback(loginForm, 'Login realizado! Redirecionando...', 'success');
    window.location.href = './members.html';
    console.info('Login ok', user.uid);
  } catch (error) {
    console.error('Erro no login', error);
    setFeedback(loginForm, 'Credenciais inválidas ou conta inexistente.', 'error');
  }
}

async function handleGoogleLogin() {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    const user = credential.user;
    await ensureUserDocument(user);
    await syncPlayFab(user);
    await handleEmailVerifiedBadge(user);
    window.location.href = './members.html';
  } catch (error) {
    console.error('Erro no login Google', error);
    setFeedback(loginForm ?? signupForm, 'Google indisponível no momento.', 'error');
  }
}

async function resendVerificationEmail() {
  if (!auth.currentUser) return;
  try {
    await sendEmailVerification(auth.currentUser);
    verificationStatus.textContent = 'Verificação reenviada! Confira seu e-mail.';
  } catch (error) {
    console.error('Erro ao reenviar verificação', error);
    verificationStatus.textContent = 'Não foi possível reenviar agora.';
  }
}

if (signupForm) signupForm.addEventListener('submit', handleSignupSubmit);
if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
if (googleButton) googleButton.addEventListener('click', handleGoogleLogin);
if (resendVerificationButton) resendVerificationButton.addEventListener('click', resendVerificationEmail);
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab || 'login';
    switchTab(target);
  });
});

applyTabFromHash();
window.addEventListener('hashchange', applyTabFromHash);

onAuthStateChanged(auth, (user) => {
  if (!verificationStatus) return;
  if (!user) {
    verificationStatus.textContent = 'Faça login ou crie conta para continuar.';
    return;
  }
  if (user.emailVerified) {
    verificationStatus.textContent = 'E-mail verificado. Missões liberadas!';
  } else {
    verificationStatus.textContent = 'Verifique seu e-mail para ganhar o emblema.';
  }
});
