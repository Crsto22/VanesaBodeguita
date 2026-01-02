// src/firebase/firebase.js
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ============================================
// PROYECTO A: NEGOCIO (PRINCIPAL)
// ============================================
const firebaseConfig = {
  apiKey: 'AIzaSyCx8JzJ_eVrArMUDi-GkZ9FpgKM6mnZEV8',
  authDomain: 'bodeguitavanesa.firebaseapp.com',
  projectId: 'bodeguitavanesa',
  storageBucket: 'bodeguitavanesa.firebasestorage.app',
  appId: '1:734082784317:web:c196d30c1d8538a14ede54',
  measurementId: 'G-169FNDEJ8N',
};

// Inicializar Firebase (App Principal)
const app = initializeApp(firebaseConfig);

// Inicializar servicios del Proyecto A
const analytics = getAnalytics(app);
const auth = getAuth(app);
const dbNegocio = getFirestore(app, 'negociovanesa'); // Base de datos del negocio
const storage = getStorage(app);

// Mantener export 'db' para compatibilidad con código existente
export const db = dbNegocio;

export { auth, dbNegocio, storage, analytics };