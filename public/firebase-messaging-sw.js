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
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano:', payload);

  const notificationTitle = payload.notification?.title || 'Nueva notificación';
  // Usar un tag único para cada notificación (por ejemplo, timestamp)
  const uniqueTag = 'vanesa-bodeguita-' + Date.now();
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes una nueva notificación',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: uniqueTag,
    requireInteraction: true,
    vibrate: [200, 100, 200], // Vibración para móviles
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
      timestamp: Date.now()
    }
  };

  // Mostrar notificación con mejor compatibilidad móvil
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en las notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('Clic en notificación:', event);
  
  event.notification.close();
  
  const notificationData = event.notification.data;
  const targetUrl = notificationData?.url || '/';
  
  if (event.action === 'ver' || event.action === '') {
    // Abrir la aplicación en la URL específica de la venta
    event.waitUntil(
      clients.openWindow(targetUrl)
    );
  } else if (event.action === 'cerrar') {
    // Solo cerrar la notificación (ya se cerró arriba)
    console.log('Notificación cerrada por el usuario');
  }
});
