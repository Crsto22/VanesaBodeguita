// Service Worker para Firebase Cloud Messaging
// Este archivo maneja las notificaciones cuando la app está en segundo plano

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuración de Firebase (debe coincidir con tu proyecto)
firebase.initializeApp({
  apiKey: 'AIzaSyCx8JzJ_eVrArMUDi-GkZ9FpgKM6mnZEV8',
  authDomain: 'bodeguitavanesa.firebaseapp.com',
  projectId: 'bodeguitavanesa',
  storageBucket: 'bodeguitavanesa.firebasestorage.app',
  messagingSenderId: '734082784317',
  appId: '1:734082784317:web:c196d30c1d8538a14ede54'
});

const messaging = firebase.messaging();

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('Mensaje recibido en segundo plano:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'vanesa-bodeguita',
    requireInteraction: true,
    actions: [
      {
        action: 'ver',
        title: 'Ver detalles'
      },
      {
        action: 'cerrar',
        title: 'Cerrar'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en las notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('Clic en notificación:', event);
  
  event.notification.close();
  
  if (event.action === 'ver') {
    // Abrir la aplicación
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
