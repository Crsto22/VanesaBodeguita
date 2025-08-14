// Service Worker para Firebase Cloud Messaging
// Este archivo SOLO va en el frontend/cliente, NO en el servidor
// VERSIÓN SIN DUPLICACIÓN: Solo maneja visualización y clics, no crea notificaciones adicionales

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

// ELIMINADO: Ya no manejamos onBackgroundMessage para evitar duplicados
// La Cloud Function ya envía la notificación con toda la configuración necesaria
// El navegador automáticamente mostrará la notificación enviada desde el servidor

// Solo manejar clics en las notificaciones (esto sí es necesario)
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
            if (client.url.includes(self.location.origin) && 'focus' in client) {
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

// Opcional: Log para debugging cuando se recibe un mensaje
// (pero sin mostrar notificación adicional)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido desde Cloud Function:', payload);
  // NO llamamos a self.registration.showNotification() aquí
  // La notificación ya viene configurada desde la Cloud Function
});

// Limpiar cache al activar
self.addEventListener('activate', (event) => {
  console.log('Service Worker activado - Version sin duplicados');
});