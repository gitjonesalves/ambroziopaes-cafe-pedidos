// Firebase Initialization
// IMPORTANTE: Use variáveis de ambiente para segurança

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Lê variáveis de ambiente
// Se não encontrar, tenta do window (para GitHub Pages sem build)
const getEnv = (key) => {
  return window.ENV?.[key] || process.env[`VITE_${key}`] || '';
};

const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY'),
  authDomain: "ambroziopaes.firebaseapp.com",
  databaseURL: "https://ambroziopaes-default-rtdb.firebaseio.com",
  projectId: "ambroziopaes",
  storageBucket: "ambroziopaes.firebasestorage.app",
  messagingSenderId: "237755790666",
  appId: "1:237755790666:web:5bc2ffabf6631e6a2dfdb3",
  measurementId: "G-RJ478LM1V8"
};

// Validate config
if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase API Key não encontrado!');
  console.error('Configure variáveis de ambiente ou docs/config/env.js');
  alert('Erro: Firebase não configurado. Verifique o console.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Connection state listener
export function setupConnectionListener(callback) {
  const { ref, onValue } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js");

  const connectedRef = ref(db, ".info/connected");

  return onValue(connectedRef, (snapshot) => {
    const isConnected = snapshot.val() === true;

    if (isConnected) {
      console.log("✅ Firebase conectado");
      document.body.classList.remove("offline");
      document.body.classList.add("online");
    } else {
      console.log("❌ Firebase offline");
      document.body.classList.add("offline");
      document.body.classList.remove("online");
    }

    if (callback) callback(isConnected);
  });
}

console.log("✅ Firebase inicializado:", firebaseConfig.projectId);