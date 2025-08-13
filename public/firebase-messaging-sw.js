// Service Worker para Firebase Cloud Messaging
// Este archivo SOLO debe estar en el frontend/cliente web
// NO debe existir en el servidor

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuración de Firebase
firebase.initializeApp({
  apiKey: 'AIzaSyCx8JzJ_eVrArMUDi-GkZ9FpgKM6mnZEV8',
  authDomain: 'bodeguitavanesa.firebaseapp.com',
  projectId: 'bodeguitavanesa',
  storageBucket: 'bodeguitavanesa.firebasestorage.app',
  messagingSenderId: '734082784317',
  appId: '1:734082784317:web:c196d30c1d8538a14ede54'
});

const messaging = firebase.messaging();

// Variable para controlar notificaciones duplicadas
let lastNotificationTime = 0;
let lastNotificationTitle = '';

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano:', payload);

  const notificationTitle = payload.notification?.title || 'Nueva notificación';
  const notificationBody = payload.notification?.body || 'Tienes una nueva notificación';
  const currentTime = Date.now();
  
  // Prevenir notificaciones duplicadas
  // Si la misma notificación llegó hace menos de 2 segundos, ignorarla
  if (currentTime - lastNotificationTime < 2000 && lastNotificationTitle === notificationTitle) {
    console.log('Notificación duplicada ignorada');
    return;
  }
  
  lastNotificationTime = currentTime;
  lastNotificationTitle = notificationTitle;

  const notificationOptions = {
    body: notificationBody,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'vanesa-bodeguita', // Tag único para reemplazar notificaciones anteriores
    requireInteraction: true,
    vibrate: [200, 100, 200],
    silent: false,
    renotify: true,
    actions: [
      {
        action: 'ver',
        title: 'Ver',
      },
      {
        action: 'cerrar',
        title: 'Cerrar'
      }
    ],
    data: {
      url: payload.data?.url || '/',
      timestamp: currentTime,
      messageId: payload.messageId || Math.random().toString(36)
    }
  };

  // Mostrar notificación
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en las notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('Clic en notificación:', event);
  
  event.notification.close();
  
  const notificationData = event.notification.data;
  const targetUrl = notificationData?.url || '/';
  
  if (event.action === 'ver' || event.action === '') {
    // Abrir la aplicación en la URL específica
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        // Si hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        return clients.openWindow(targetUrl);
      })
    );
  } else if (event.action === 'cerrar') {
    console.log('Notificación cerrada por el usuario');
  }
});

// Limpiar notificaciones antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.getNotifications().then((notifications) => {
      const now = Date.now();
      notifications.forEach((notification) => {
        const notificationTime = notification.data?.timestamp || 0;
        // Cerrar notificaciones más antiguas de 1 hora
        if (now - notificationTime > 3600000) {
          notification.close();
        }
      });
    })
  );
});