// js/firebase.js — AURA Firebase Module (Conectado a Firestore real)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
         GoogleAuthProvider, OAuthProvider, signInWithPopup,
         sendPasswordResetEmail, onAuthStateChanged, signOut as fbSignOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, addDoc,
         collection, getDocs, query, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCE6bJIr5aNn4rplhtlOcHGc_CQhrGZegk",
  authDomain: "aura-final-b58a5.firebaseapp.com",
  projectId: "aura-final-b58a5",
  storageBucket: "aura-final-b58a5.firebasestorage.app",
  messagingSenderId: "12317180262",
  appId: "1:12317180262:web:afd01c0fcef96ebb4ec8a7"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

window._db   = db;
window._auth = auth;

// ── HELPERS FIRESTORE GLOBALES ────────────
window.fsGet = async function(col, id) {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
window.fsSet = async function(col, id, data) {
  await setDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
};
window.fsAdd = async function(col, data) {
  const ref = await addDoc(collection(db, col), { ...data, createdAt: serverTimestamp() });
  return ref.id;
};
window.fsGetAll = async function(col) {
  const snap = await getDocs(collection(db, col));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
window.fsLogsRecientes = async function(coleccion, limite) {
  try {
    const q = query(collection(db, coleccion), orderBy('createdAt','desc'), limit(limite||20));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) { return []; }
};

// ── ESTADO DE AUTH ───────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  showLoader(false);
  if (user) {
    try {
      let perfil = await obtenerPerfil(user.uid);

      // Si no tiene perfil en Firestore, crear uno básico como usuario
      if (!perfil) {
        perfil = await crearPerfilBasico(user, 'usuario');
      }

      // Actualizar último login
      await updateDoc(doc(db, 'usuarios', user.uid), {
        lastLogin: serverTimestamp()
      }).catch(() => {});

      window._currentUser   = user;
      window._currentPerfil = perfil;

      iniciarApp(perfil);
    } catch(e) {
      console.error('Error cargando perfil:', e);
      showLoader(false);
      toast('Error al cargar tu perfil. Intenta de nuevo.', 'error');
      await fbSignOut(auth);
    }
  } else {
    window._currentUser   = null;
    window._currentPerfil = null;
    showScreen('loginScreen');
  }
});

// ── OBTENER PERFIL DESDE FIRESTORE ───────────────────────
async function obtenerPerfil(uid) {
  const snap = await getDoc(doc(db, 'usuarios', uid));
  return snap.exists() ? snap.data() : null;
}

// ── LOGIN CON EMAIL ──────────────────────────────────────
window.loginWithEmail = async function() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value;
  if (!email || !pass) { toast('Completa todos los campos', 'error'); return; }
  showLoader(true);
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch(e) {
    showLoader(false);
    toast(traducirError(e.code), 'error');
  }
};

// ── LOGIN CON GOOGLE ─────────────────────────────────────
window.loginWithGoogle = async function() {
  showLoader(true);
  try {
    const provider = new GoogleAuthProvider();
    const result   = await signInWithPopup(auth, provider);
    const snap     = await getDoc(doc(db, 'usuarios', result.user.uid));
    if (!snap.exists()) {
      await crearPerfilBasico(result.user, 'usuario');
    }
  } catch(e) {
    showLoader(false);
    if (e.code !== 'auth/popup-closed-by-user') toast(traducirError(e.code), 'error');
  }
};

// ── LOGIN CON APPLE ──────────────────────────────────────
window.loginWithApple = async function() {
  showLoader(true);
  try {
    const provider = new OAuthProvider('apple.com');
    const result   = await signInWithPopup(auth, provider);
    const snap     = await getDoc(doc(db, 'usuarios', result.user.uid));
    if (!snap.exists()) {
      await crearPerfilBasico(result.user, 'usuario');
    }
  } catch(e) {
    showLoader(false);
    if (e.code !== 'auth/popup-closed-by-user') toast(traducirError(e.code), 'error');
  }
};

// ── REGISTRO ─────────────────────────────────────────────
window.registrarUsuario = async function() {
  const nombre = document.getElementById('regNombre').value.trim();
  const nick   = document.getElementById('regNick').value.trim().toLowerCase().replace(/\s/g,'');
  const email  = document.getElementById('regEmail').value.trim();
  const pass   = document.getElementById('regPassword').value;
  const pais   = document.getElementById('regPais').value;
  const genero = document.getElementById('regGenero').value;
  const nacRaw = document.getElementById('regNacimiento').value;
  // Rol automático según género
  const rol = genero === 'femenino' ? 'streamer' : 'usuario';

  if (!nombre || !nick || !email || !pass || !pais || !genero || !nacRaw) {
    toast('Completa todos los campos', 'error'); return;
  }
  if (pass.length < 6) { toast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }

  const hoy = new Date(), nac = new Date(nacRaw);
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (hoy.getMonth() < nac.getMonth() ||
     (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
  if (edad < 18) { toast('Debes tener al menos 18 años', 'error'); return; }

  showLoader(true);
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid  = cred.user.uid;

    const perfil = {
      uid, nombre, nick, email, pais, genero, edad,
      rol,
      estado: rol === 'streamer' ? 'pendiente' : 'activo',
      estrellas: 0,
      seguidores: 0,
      siguiendo: 0,
      avatar: '',
      bio: '',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    };

    await setDoc(doc(db, 'usuarios', uid), perfil);
    toast('¡Bienvenido a AURA! 🌟', 'success');
    // onAuthStateChanged se encarga del resto

  } catch(e) {
    showLoader(false);
    toast(traducirError(e.code), 'error');
  }
};

// ── ACTUALIZAR PERFIL ────────────────────────────────────
window.actualizarPerfil = async function(datos) {
  const uid = window._currentUser?.uid;
  if (!uid) return;
  try {
    await updateDoc(doc(db, 'usuarios', uid), {
      ...datos,
      updatedAt: serverTimestamp()
    });
    // Actualizar perfil local
    window._currentPerfil = { ...window._currentPerfil, ...datos };
    toast('Perfil actualizado ✓', 'success');
    renderSidebar(window._currentPerfil);
  } catch(e) {
    toast('Error al guardar', 'error');
  }
};

// ── FORGOT PASSWORD ──────────────────────────────────────
window.forgotPassword = async function() {
  const email = document.getElementById('loginEmail').value.trim();
  if (!email) { toast('Ingresa tu email primero', 'error'); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    toast('Email de recuperación enviado ✓', 'success');
  } catch(e) {
    toast(traducirError(e.code), 'error');
  }
};

// ── SIGN OUT ─────────────────────────────────────────────
window.signOut = async function() {
  await fbSignOut(auth);
  window._currentUser   = null;
  window._currentPerfil = null;
  showScreen('loginScreen');
  toast('Sesión cerrada', 'info');
};

// ── DEV LOGIN (solo para desarrollo) ─────────────────────
window.devLogin = function(rol) {
  const perfiles = {
    master:    { uid:'dev-master',    nombre:'Andrew',       nick:'aura',      rol:'master',    estado:'activo', estrellas:999999, seguidores:0, siguiendo:0, avatar:'', bio:'' },
    admin:     { uid:'dev-admin',     nombre:'Admin AURA',   nick:'admin',     rol:'admin',     estado:'activo', estrellas:0,      seguidores:0, siguiendo:0, avatar:'', bio:'' },
    moderador: { uid:'dev-mod',       nombre:'Moderador',    nick:'modaura',   rol:'moderador', estado:'activo', estrellas:0,      seguidores:0, siguiendo:0, avatar:'', bio:'' },
    agencia:   { uid:'dev-agency',    nombre:'Prime Stars',  nick:'primestars',rol:'agencia',   estado:'activo', estrellas:0,      seguidores:0, siguiendo:0, avatar:'', bio:'' },
    streamer:  { uid:'dev-streamer',  nombre:'Luna García',  nick:'luna_live', rol:'streamer',  estado:'activo', estrellas:24500,  seguidores:1240, siguiendo:12, avatar:'', bio:'' },
    usuario:   { uid:'dev-user',      nombre:'Usuario Test', nick:'user_test', rol:'usuario',   estado:'activo', estrellas:1200,   seguidores:0, siguiendo:8, avatar:'', bio:'' }
  };
  window._currentUser   = { uid: perfiles[rol].uid };
  window._currentPerfil = perfiles[rol];
  iniciarApp(perfiles[rol]);
  toast(`Modo dev: ${rol} ⚡`, 'success');
};

// ── HELPERS ──────────────────────────────────────────────
async function crearPerfilBasico(user, rol) {
  const perfil = {
    uid: user.uid,
    nombre: user.displayName || 'Usuario AURA',
    nick: (user.displayName || 'user').toLowerCase().replace(/\s/g,'') + Math.floor(Math.random()*999),
    email: user.email || '',
    pais: '', genero: '', edad: 0,
    rol, estado: 'activo',
    estrellas: 0, seguidores: 0, siguiendo: 0,
    avatar: user.photoURL || '', bio: '',
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp()
  };
  await setDoc(doc(db, 'usuarios', user.uid), perfil);
  return perfil;
}

function traducirError(code) {
  const e = {
    'auth/user-not-found':         'No existe una cuenta con ese email',
    'auth/wrong-password':         'Contraseña incorrecta',
    'auth/invalid-credential':     'Email o contraseña incorrectos',
    'auth/email-already-in-use':   'Este email ya está registrado',
    'auth/weak-password':          'La contraseña es muy débil (mín. 6 caracteres)',
    'auth/invalid-email':          'El email no es válido',
    'auth/too-many-requests':      'Demasiados intentos. Espera unos minutos',
    'auth/network-request-failed': 'Sin conexión. Verifica tu internet',
    'auth/popup-blocked':          'Popup bloqueado. Permite popups para este sitio',
  };
  return e[code] || 'Error inesperado: ' + code;
}
