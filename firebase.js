import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

/* Use exatamente os dados fornecidos pelo Console do Firebase. */

const firebaseConfig = {
  apiKey: "AIzaSyCo9ZEIPuetuMa1Z2JAkQ_6HDrN8YNWRpE",
  authDomain: "ajudaprof-abf7e.firebaseapp.com",
  projectId: "ajudaprof-abf7e",
  storageBucket: "ajudaprof-abf7e.firebasestorage.app",
  messagingSenderId: "723200260268",
  appId: "1:723200260268:web:1c12a0f03604794ef98709",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const CHAVE_CACHE_OFFLINE_FIRESTORE = "ajudaprof_cache_offline_firestore";

const cacheOfflineSolicitado =
  localStorage.getItem(CHAVE_CACHE_OFFLINE_FIRESTORE) === "true";

let db = null;
let cacheOfflineAtivo = false;
let erroCacheOffline = null;

try {
  db = initializeFirestore(app, {
    localCache: cacheOfflineSolicitado
      ? persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        })
      : memoryLocalCache(),
  });

  cacheOfflineAtivo = cacheOfflineSolicitado;
} catch (erro) {
  console.warn("Não foi possível iniciar o cache offline do Firestore:", erro);

  erroCacheOffline = erro;
  db = getFirestore(app);
  cacheOfflineAtivo = false;
}

const storage = getStorage(app);

/* Disponibiliza o Firebase para o script.js. */

window.firebaseApp = app;

window.auth = auth;

window.db = db;

window.storage = storage;

window.CHAVE_CACHE_OFFLINE_FIRESTORE = CHAVE_CACHE_OFFLINE_FIRESTORE;

window.cacheOfflineFirestoreSolicitado = cacheOfflineSolicitado;

window.cacheOfflineFirestoreAtivo = cacheOfflineAtivo;

window.erroCacheOfflineFirestore = erroCacheOffline;

window.obterPreferenciaCacheOfflineAjudaProf = function () {
  return localStorage.getItem(CHAVE_CACHE_OFFLINE_FIRESTORE) === "true";
};

window.definirPreferenciaCacheOfflineAjudaProf = function (ativo) {
  localStorage.setItem(CHAVE_CACHE_OFFLINE_FIRESTORE, ativo ? "true" : "false");

  return {
    ativo: Boolean(ativo),
    requerRecarregar: true,
  };
};

window.firebaseAuth = {
  createUserWithEmailAndPassword,

  signInWithEmailAndPassword,

  signOut,

  onAuthStateChanged,

  sendPasswordResetEmail,

  updateProfile,
};

window.firebaseFirestore = {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
};

window.firebaseStorage = {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
};

/* Informa ao script principal que o Firebase terminou de carregar. */

window.firebasePronto = true;

window.dispatchEvent(new Event("firebasePronto"));

console.log(
  cacheOfflineAtivo
    ? "✅ Firebase conectado com cache offline."
    : "✅ Firebase conectado."
);