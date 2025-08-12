import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, messaging } from "../firebase/firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';

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

  // Solicitar permiso para notificaciones y obtener FCM token
  const solicitarPermisoNotificaciones = async () => {
    try {
      console.log('Solicitando permiso para notificaciones...');
      
      // Verificar si las notificaciones están soportadas
      if (!('Notification' in window)) {
        console.log('Este navegador no soporta notificaciones');
        return null;
      }

      // Solicitar permiso
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Permiso de notificaciones denegado');
        return null;
      }

      // Obtener FCM token
      const token = await getToken(messaging, {
        vapidKey: 'BLvQfxrgliwqE_2sjh0YIDWAJIW-Z1d2AQseabz-U8J-SnNUbpAu0NkutCado4HSkeQvwmq15U1ky0-J3HBlx4w' // Tu clave VAPID
      });

      if (token) {
        console.log('FCM Token obtenido:', token);
        return token;
      } else {
        console.log('No se pudo obtener el FCM token');
        return null;
      }
    } catch (error) {
      console.error('Error obteniendo FCM token:', error);
      return null;
    }
  };

  // Guardar FCM token en Firestore
  const guardarFCMToken = async (uid, token) => {
    try {
      const userRef = doc(db, "usuarios", uid);
      await updateDoc(userRef, {
        fcmToken: token,
        fcmTokenActualizado: new Date()
      });
      console.log('FCM Token guardado en Firestore');
    } catch (error) {
      console.error('Error guardando FCM token:', error);
    }
  };

  // Configurar listener para mensajes en primer plano
  const configurarListenerMensajes = () => {
    try {
      onMessage(messaging, (payload) => {
        console.log('Mensaje recibido en primer plano:', payload);
        
        // Mostrar notificación personalizada si la app está abierta
        if (payload.notification) {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/icon-192x192.png'
          });
        }
      });
    } catch (error) {
      console.error('Error configurando listener de mensajes:', error);
    }
  };

  // Fetch additional user data from Firestore
  const fetchUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "usuarios", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserData(userData);
        
        // Verificar si el usuario tiene FCM token
        if (!userData.fcmToken) {
          console.log('Usuario no tiene FCM token, solicitando...');
          const token = await solicitarPermisoNotificaciones();
          if (token) {
            await guardarFCMToken(uid, token);
            // Actualizar userData con el nuevo token
            setUserData(prev => ({ ...prev, fcmToken: token }));
          }
        } else {
          console.log('Usuario ya tiene FCM token:', userData.fcmToken);
        }
        
        // Configurar listener para mensajes
        configurarListenerMensajes();
        
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