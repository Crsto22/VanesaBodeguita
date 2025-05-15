// src/firebase/firebase.js
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuración de Firebase para el proyecto bodeguitavanesa
const firebaseConfig = {
  apiKey: 'AIzaSyCx8JzJ_eVrArMUDi-GkZ9FpgKM6mnZEV8',
  authDomain: 'bodeguitavanesa.firebaseapp.com',
  projectId: 'bodeguitavanesa',
  storageBucket: 'bodeguitavanesa.firebasestorage.app',
  messagingSenderId: '734082784317',
  appId: '1:734082784317:web:c196d30c1d8538a14ede54',
  measurementId: 'G-169FNDEJ8N',
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app, 'negociovanesa'); // Especificar la base de datos negociovanesa
const storage = getStorage(app);

export { auth, db, storage, analytics };