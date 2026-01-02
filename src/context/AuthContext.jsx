import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from "../firebase/firebase"; // Proyecto A (Negocio)
import { authPedidos } from "../firebase/firebaseConfig"; // Proyecto B (Pedidos)
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * LOGIN UNIFICADO
   * Autentica al admin en AMBOS proyectos Firebase simultáneamente
   */
  const signIn = async (email, password) => {
    try {
      // 1. Autenticar en Proyecto A (Negocio)
      const userCredentialA = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Autenticado en Proyecto A (Negocio):', userCredentialA.user.email);

      // 2. Autenticar en Proyecto B (Pedidos) con las MISMAS credenciales
      const userCredentialB = await signInWithEmailAndPassword(authPedidos, email, password);
      console.log('✅ Autenticado en Proyecto B (Pedidos):', userCredentialB.user.email);

      console.log('🎉 Login Unificado Exitoso - Acceso a ambos proyectos');

      return userCredentialA; // Retornar el usuario del proyecto principal
    } catch (error) {
      console.error('❌ Error en Login Unificado:', error);
      throw error; // Propagar el error para que Login.jsx lo maneje
    }
  };

  /**
   * LOGOUT UNIFICADO
   * Cierra sesión en AMBOS proyectos
   */
  const logout = async () => {
    try {
      // Cerrar sesión en Proyecto A
      await signOut(auth);
      console.log('✅ Sesión cerrada en Proyecto A (Negocio)');

      // Cerrar sesión en Proyecto B
      await signOut(authPedidos);
      console.log('✅ Sesión cerrada en Proyecto B (Pedidos)');

      console.log('🎉 Logout Unificado Exitoso');
    } catch (error) {
      console.error('❌ Error en Logout Unificado:', error);
      throw error;
    }
  };

  // Fetch additional user data from Firestore (Proyecto A)
  const fetchUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "usuarios", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserData(userData);
      } else {
        console.log("No se encontraron datos adicionales del usuario");
        setUserData(null);
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      setUserData(null);
    }
  };

  // Listen for auth state changes (solo en Proyecto A como principal)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      // If there is an authenticated user, fetch their additional data
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserData(null); // Clear data if no user
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    signIn,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};