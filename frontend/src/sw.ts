/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

// Declare the manifest for workbox
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any[] };

// Precache files injected by Vite PWA plugin
precacheAndRoute(self.__WB_MANIFEST);

// Push notification handler
self.addEventListener('push', (event: any) => {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.body || 'Новое сообщение',
    icon: data.icon || '/pwa-512x512.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      conversationId: data.conversationId,
      messageId: data.messageId,
      url: `/messages?chat=${data.conversationId}`
    },
    actions: [
      { action: 'open', title: 'Открыть' },
      { action: 'close', title: 'Закрыть' }
    ],
    tag: `message-${data.conversationId}`,
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'StopSmoke', options)
  );
});

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/messages';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients: any) => {
      // Check if there's already a window open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes('stopsmoke') && 'focus' in client) {
          return client.navigate(urlToOpen).then(() => client.focus());
        }
      }
      // No window open, open a new one
      return self.clients.openWindow(urlToOpen);
    })
  );
});

export {};
