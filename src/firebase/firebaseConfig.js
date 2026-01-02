import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ============================================
// PROYECTO B: CLIENTES Y PEDIDOS
// ============================================
const firebaseConfigPedidos = {
  apiKey: "AIzaSyBQxWn4Fa7MPZCrJt6e1EN4o339IW1wfVs",
  authDomain: "vanesa-e39df.firebaseapp.com",
  projectId: "vanesa-e39df",
  storageBucket: "vanesa-e39df.firebasestorage.app",
  messagingSenderId: "676911361120",
  appId: "1:676911361120:web:887e7d49667a92623d2705",
  measurementId: "G-EH8T1TG6J2",
  databaseURL: "https://vanesa-e39df-default-rtdb.firebaseio.com"
};

// ============================================
// PROYECTO YAPE: PAGOS
// ============================================
const firebaseYapeConfig = {
  apiKey: "AIzaSyAH0RuHMdA5nKrL9ROqQd92MiDDg5-4-YQ",
  authDomain: "yapebodeguitavanesa.firebaseapp.com",
  projectId: "yapebodeguitavanesa",
  storageBucket: "yapebodeguitavanesa.firebasestorage.app",
  messagingSenderId: "754800371432",
  appId: "1:754800371432:web:2a9fe90fb28f001fcf4b5d",
  measurementId: "G-TGYW1RDF8W"
};

// ============================================
// INICIALIZAR APPS SECUNDARIAS
// ============================================

// App de Pedidos y Clientes (Proyecto B)
const pedidosApp = initializeApp(firebaseConfigPedidos, 'pedidosApp');

// App de Yape
const yapeApp = initializeApp(firebaseYapeConfig, 'yapeApp');

// ============================================
// EXPORTS: PROYECTO B (PEDIDOS/CLIENTES)
// ============================================

// Auth para login unificado
export const authPedidos = getAuth(pedidosApp);

// Realtime Database
export const pedidosDatabase = getDatabase(pedidosApp);

// Firestore para colección 'pedidos' y 'usuarios_clientes'
export const dbPedidos = getFirestore(pedidosApp);

// ============================================
// ALIASES PARA COMPATIBILIDAD CON CÓDIGO EXISTENTE
// ============================================

// Mantener exports antiguos como alias para no romper código existente
export const configFirestore = dbPedidos;      // Alias de dbPedidos
export const configDatabase = pedidosDatabase; // Alias de pedidosDatabase

// ============================================
// EXPORTS: PROYECTO YAPE
// ============================================

export const yapeDb = getFirestore(yapeApp);
