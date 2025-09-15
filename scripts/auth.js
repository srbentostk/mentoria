// TODO: preencher fluxos adicionais (ex.: redirecionamento pós-login) antes de publicar.
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db, googleProvider } from './firebase-init.js';

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const googleButton = document.getElementById('google-login');
const verificationStatus = document.getElementById('verification-status');
const resendVerificationButton = document.getElementById('resend-verification');
const tabs = document.querySelectorAll('.auth__tab');

const badgeDefaults = {
  emailVerified: false,
  onboardingStarted: false,
  onboardingCompleted: false,
};

function setFeedback(form, message, type = 'info') {
  const feedback = form?.querySelector('.form__feedback');
  if (feedback) {
    feedback.textContent = message;
    feedback.dataset.type = type;
  }
}

function switchTab(target) {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === target;
    tab.setAttribute('aria-selected', String(isActive));
  });
  if (loginForm && signupForm) {
    const showLogin = target === 'login';
    loginForm.classList.toggle('is-hidden', !showLogin);
    signupForm.classList.toggle('is-hidden', showLogin);
  }
}

tabs.forEach((tab) =>
  tab.addEventListener('click', () => {
    switchTab(tab.dataset.tab ?? 'login');
  }),
);

async function ensureUserDocument(user) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName ?? '',
      photoURL: user.photoURL ?? '',
      createdAt: serverTimestamp(),
      emailVerified: user.emailVerified,
      playFabId: null,
      badges: badgeDefaults,
      stats: { xp: 0, currency: 0 },
    });
  }
}

async function handleLogin(event) {
  event.preventDefault();
  if (!loginForm) return;
  const formData = new FormData(loginForm);
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  try {
    await signInWithEmailAndPassword(auth, email, password);
    setFeedback(loginForm, 'Login realizado! Redirecionando...', 'success');
    // TODO: preencher navegação pós-login (ex.: redirecionar para members.html).
  } catch (error) {
    console.error('Falha ao entrar', error);
    setFeedback(loginForm, 'Não foi possível entrar. Verifique seus dados.', 'error');
  }
}

async function handleSignup(event) {
  event.preventDefault();
  if (!signupForm) return;
  const formData = new FormData(signupForm);
  const displayName = String(formData.get('displayName') ?? '');
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    await ensureUserDocument(credential.user);
    await sendEmailVerification(credential.user);
    setFeedback(signupForm, 'Conta criada! Verifique seu e-mail para continuar.', 'success');
  } catch (error) {
    console.error('Falha ao criar conta', error);
    setFeedback(signupForm, 'Erro ao criar conta. Tente novamente.', 'error');
  }
}

async function handleGoogleLogin() {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    await ensureUserDocument(credential.user);
    setFeedback(loginForm ?? signupForm, 'Login com Google realizado.', 'success');
  } catch (error) {
    console.error('Google login error', error);
    if (loginForm) {
      setFeedback(loginForm, 'Não foi possível usar o Google.', 'error');
    }
  }
}

async function ensureEmailBadge(user) {
  if (!user.emailVerified) return;
  const userRef = doc(db, 'users', user.uid);
  await updateDoc(userRef, {
    emailVerified: true,
    'badges.emailVerified': true,
  });
}

async function resendVerification() {
  if (!auth.currentUser) return;
  try {
    await sendEmailVerification(auth.currentUser);
    verificationStatus.textContent = 'Link reenviado! Confira sua caixa de entrada.';
  } catch (error) {
    console.error('Erro ao reenviar verificação', error);
    verificationStatus.textContent = 'Não foi possível reenviar. Tente novamente mais tarde.';
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', handleLogin);
}
if (signupForm) {
  signupForm.addEventListener('submit', handleSignup);
}
if (googleButton) {
  googleButton.addEventListener('click', handleGoogleLogin);
}
if (resendVerificationButton) {
  resendVerificationButton.addEventListener('click', resendVerification);
}

onAuthStateChanged(auth, async (user) => {
  if (!verificationStatus) return;
  if (!user) {
    verificationStatus.textContent = 'Faça login para verificar seu e-mail.';
    return;
  }
  await ensureUserDocument(user);
  if (user.emailVerified) {
    await ensureEmailBadge(user);
    verificationStatus.textContent = 'E-mail verificado. Você já pode acessar a missão!';
  } else {
    verificationStatus.textContent = 'Verifique seu e-mail para liberar a missão.';
  }
});
