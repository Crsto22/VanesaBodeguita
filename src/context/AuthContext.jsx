import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from "../firebase/firebase"; // Importa db desde firebase
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Importa funciones de Firestore

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null); // Estado para los datos adicionales del usuario
  const [loading, setLoading] = useState(true);

  // Sign in with email and password
  const signIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign out
  const logout = () => {
    return signOut(auth);
  };

  // Obtener datos adicionales del usuario desde Firestore
  const fetchUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "usuarios", uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        console.log("No se encontraron datos adicionales del usuario");
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      // Si hay un usuario autenticado, obtén sus datos adicionales
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserData(null); // Limpia los datos si no hay usuario
      }
      
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData, // Añade los datos del usuario al contexto
    signIn,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};