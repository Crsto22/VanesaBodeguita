import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

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

// Configuración de Firebase para visualizar pagos de Yape
const firebaseYapeConfig = {
  apiKey: "AIzaSyAH0RuHMdA5nKrL9ROqQd92MiDDg5-4-YQ",
  authDomain: "yapebodeguitavanesa.firebaseapp.com",
  projectId: "yapebodeguitavanesa",
  storageBucket: "yapebodeguitavanesa.firebasestorage.app",
  messagingSenderId: "754800371432",
  appId: "1:754800371432:web:2a9fe90fb28f001fcf4b5d",
  measurementId: "G-TGYW1RDF8W"
};

// Inicializar la segunda app de Firebase con un nombre único
const configApp = initializeApp(firebaseConfigSettings, 'configApp');

// Inicializar la tercera app de Firebase para Yape
const yapeApp = initializeApp(firebaseYapeConfig, 'yapeApp');

// Obtener referencia a Realtime Database
export const configDatabase = getDatabase(configApp);

// Obtener referencia a Firestore de Yape
export const yapeDb = getFirestore(yapeApp);
