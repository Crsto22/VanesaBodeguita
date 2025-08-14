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

  // Sign out (eliminar solo el token de ESTE dispositivo)
  const logout = async () => {
    try {
      // Si hay un usuario actual, eliminar solo el token de ESTE dispositivo
      if (currentUser) {
        const tokenActual = localStorage.getItem('fcmTokenActual');
        if (tokenActual) {
          console.log('Eliminando token de este dispositivo al cerrar sesión:', tokenActual);
          await eliminarFCMTokenDispositivo(currentUser.uid, tokenActual);
          localStorage.removeItem('fcmTokenActual');
        }
      }
      
      // Cerrar sesión
      return signOut(auth);
    } catch (error) {
      console.error('Error durante logout:', error);
      // Cerrar sesión aunque haya error limpiando token
      return signOut(auth);
    }
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

      // Esperar un poco para que IndexedDB se estabilice
      await new Promise(resolve => setTimeout(resolve, 500));

      // Obtener FCM token con reintentos
      let token = null;
      for (let intento = 0; intento < 3; intento++) {
        try {
          console.log(`Intento ${intento + 1} de obtener FCM token...`);
          token = await getToken(messaging, {
            vapidKey: 'BLvQfxrgliwqE_2sjh0YIDWAJIW-Z1d2AQseabz-U8J-SnNUbpAu0NkutCado4HSkeQvwmq15U1ky0-J3HBlx4w'
          });
          
          if (token) {
            console.log('FCM Token obtenido exitosamente:', token);
            return token;
          }
        } catch (error) {
          console.error(`Error en intento ${intento + 1}:`, error);
          
          // Si es un error de IndexedDB, esperar más tiempo
          if (error.message.includes('IDBDatabase') || error.message.includes('IndexedDB')) {
            console.log('Error de IndexedDB detectado, esperando antes del siguiente intento...');
            await new Promise(resolve => setTimeout(resolve, 1000 * (intento + 1)));
          } else {
            // Si no es un error de IndexedDB, no reintentar
            break;
          }
        }
      }

      console.log('No se pudo obtener el FCM token después de 3 intentos');
      return null;
      
    } catch (error) {
      console.error('Error general obteniendo FCM token:', error);
      return null;
    }
  };

  // Guardar FCM token en Firestore (como array de dispositivos)
  const guardarFCMToken = async (uid, token) => {
    try {
      const userRef = doc(db, "usuarios", uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];
        
        // Verificar si el token ya existe
        const tokenExiste = fcmTokens.some(item => item.token === token);
        
        if (!tokenExiste) {
          // Detectar tipo de dispositivo
          const dispositivo = detectarDispositivo();
          
          // Agregar nuevo token al array
          const nuevoToken = {
            token: token,
            dispositivo: dispositivo,
            fechaCreacion: new Date(),
            ultimoUso: new Date(),
            userAgent: navigator.userAgent
          };
          
          fcmTokens.push(nuevoToken);
          
          await updateDoc(userRef, {
            fcmTokens: fcmTokens,
            fcmTokenActualizado: new Date()
          });
          
          console.log('Nuevo FCM Token agregado para dispositivo:', dispositivo);
        } else {
          // Actualizar última fecha de uso del token existente
          const tokenIndex = fcmTokens.findIndex(item => item.token === token);
          if (tokenIndex !== -1) {
            fcmTokens[tokenIndex].ultimoUso = new Date();
            await updateDoc(userRef, { fcmTokens: fcmTokens });
            console.log('FCM Token existente actualizado');
          }
        }
      }
    } catch (error) {
      console.error('Error guardando FCM token:', error);
    }
  };

  // Detectar tipo de dispositivo
  const detectarDispositivo = () => {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) {
      return `Chrome Android`;
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      return `Safari iOS`;
    } else if (/Windows/i.test(ua)) {
      return `Chrome Windows`;
    } else if (/Mac/i.test(ua)) {
      return `Chrome Mac`;
    } else if (/Linux/i.test(ua)) {
      return `Chrome Linux`;
    } else {
      return `Navegador Desconocido`;
    }
  };

  // Eliminar FCM token de este dispositivo al cerrar sesión
  const eliminarFCMTokenDispositivo = async (uid, token) => {
    try {
      const userRef = doc(db, "usuarios", uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];
        
        // Filtrar para eliminar SOLO el token de este dispositivo
        const tokensActualizados = fcmTokens.filter(item => item.token !== token);
        
        await updateDoc(userRef, {
          fcmTokens: tokensActualizados,
          fcmTokenActualizado: new Date()
        });
        
        console.log('FCM Token de este dispositivo eliminado al cerrar sesión');
        console.log(`Tokens restantes: ${tokensActualizados.length}`);
      }
    } catch (error) {
      console.error('Error eliminando FCM token del dispositivo:', error);
    }
  };

  // ❌ FUNCIÓN ELIMINADA - ESTA CAUSABA LA DUPLICACIÓN
  // const configurarListenerMensajes = () => {
  //   try {
  //     onMessage(messaging, (payload) => {
  //       console.log('Mensaje recibido en primer plano:', payload);
  //       
  //       // Mostrar notificación personalizada si la app está abierta
  //       if (payload.notification) {
  //         new Notification(payload.notification.title, {
  //           body: payload.notification.body,
  //           icon: '/icon-192x192.png'
  //         });
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Error configurando listener de mensajes:', error);
  //   }
  // };

  // ✅ NUEVA FUNCIÓN OPCIONAL - Solo para manejar datos en primer plano SIN mostrar notificación
  const configurarListenerMensajes = () => {
    try {
      onMessage(messaging, (payload) => {
        console.log('Mensaje recibido en primer plano (solo para procesar datos):', payload);
        
        // ✅ SOLO procesar datos si es necesario, NO mostrar notificación
        // La notificación la maneja automáticamente el Service Worker
        
        // Ejemplo: actualizar estado de la app, mostrar badge, etc.
        if (payload.data) {
          console.log('Datos del mensaje:', payload.data);
          // Aquí puedes actualizar el estado de tu app si necesitas
          // Por ejemplo: actualizar contador de mensajes, refrescar datos, etc.
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
        
        // ✅ Configurar listener SOLO para procesar datos (sin mostrar notificaciones)
        configurarListenerMensajes();
        
        // Verificar FCM token para este dispositivo
        setTimeout(async () => {
          try {
            const token = await solicitarPermisoNotificaciones();
            if (token) {
              // Guardar token en localStorage para poder eliminarlo después
              localStorage.setItem('fcmTokenActual', token);
              await guardarFCMToken(uid, token);
              
              // Actualizar userData con los tokens
              const userDocActualizado = await getDoc(doc(db, "usuarios", uid));
              if (userDocActualizado.exists()) {
                setUserData(userDocActualizado.data());
              }
            }
          } catch (error) {
            console.error('Error obteniendo FCM token en retraso:', error);
          }
        }, 2000);
        
      } else {
        console.log("No se encontraron datos adicionales del usuario");
        setUserData(null);
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
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