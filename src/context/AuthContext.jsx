import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from "../firebase/firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign in with email and password
  const signIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign out
  const logout = () => {
    return signOut(auth);
  };

  // Fetch additional user data from Firestore
  const fetchUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "usuarios", uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        console.log("No se encontraron datos adicionales del usuario, cerrando sesión...");
        await logout(); // Automatically sign out if no user data is found
        setCurrentUser(null);
        setUserData(null);
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      await logout(); // Optionally sign out on error to handle potential issues
      setCurrentUser(null);
      setUserData(null);
    }
  };

  // Listen for auth state changes
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