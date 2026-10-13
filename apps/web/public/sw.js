// Service Worker for Web Push Notifications
// File ini harus berada di /public/sw.js agar scope-nya root domain

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Notification', body: event.data.text(), url: '/' };
  }

  const options = {
    body:    payload.body  ?? payload.message ?? '',
    icon:    '/favicon.ico',
    badge:   '/favicon.ico',
    data:    { url: payload.url ?? '/' },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'New Notification', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
