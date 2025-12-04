import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Configuración del segundo Firebase para configuración
const firebaseConfigSettings = {
  apiKey: "AIzaSyBQxWn4Fa7MPZCrJt6e1EN4o339IW1wfVs",
  authDomain: "vanesa-e39df.firebaseapp.com",
  projectId: "vanesa-e39df",
  storageBucket: "vanesa-e39df.firebasestorage.app",
  messagingSenderId: "676911361120",
  appId: "1:676911361120:web:887e7d49667a92623d2705",
  measurementId: "G-EH8T1TG6J2",
  databaseURL: "https://vanesa-e39df-default-rtdb.firebaseio.com"
};

// Inicializar la segunda app de Firebase con un nombre único
const configApp = initializeApp(firebaseConfigSettings, 'configApp');

// Obtener referencia a Realtime Database
export const configDatabase = getDatabase(configApp);
