// Service Worker para Firebase Cloud Messaging
// Este archivo SOLO va en el frontend/cliente, NO en el servidor

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

// Variable para evitar duplicados
let lastNotificationId = null;
let lastNotificationTime = 0;

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano:', payload);

  // Crear un ID único para la notificación
  const notificationId = payload.data?.id || `${Date.now()}-${Math.random()}`;
  const currentTime = Date.now();
  
  // Evitar duplicados (si la misma notificación llega en menos de 5 segundos)
  if (lastNotificationId === notificationId || 
      (currentTime - lastNotificationTime < 5000 && lastNotificationId)) {
    console.log('Notificación duplicada detectada, ignorando...');
    return;
  }
  
  lastNotificationId = notificationId;
  lastNotificationTime = currentTime;

  const notificationTitle = payload.notification?.title || 'Nueva notificación';
  
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes una nueva notificación',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: `vanesa-bodeguita-${notificationId}`, // Tag único para evitar reemplazos
    requireInteraction: true,
    vibrate: [200, 100, 200],
    silent: false,
    renotify: false, // Cambiado a false para evitar duplicados
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
      id: notificationId,
      url: payload.data?.url || '/',
      timestamp: currentTime
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
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Buscar si ya hay una ventana abierta
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url.includes(window.location.origin) && 'focus' in client) {
              // Si hay una ventana abierta, enfocarla y navegar
              return client.focus().then(() => {
                if ('navigate' in client) {
                  return client.navigate(targetUrl);
                }
              });
            }
          }
          // Si no hay ventana abierta, abrir una nueva
          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }
        })
    );
  } else if (event.action === 'cerrar') {
    console.log('Notificación cerrada por el usuario');
  }
});

// Limpiar cache de notificaciones antiguas
self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  // Resetear variables al activar
  lastNotificationId = null;
  lastNotificationTime = 0;
});