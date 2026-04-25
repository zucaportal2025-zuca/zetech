// public/sw.js
const CACHE_NAME = 'zuca-portal-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old caches
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(
          (response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response because it's a stream
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          }
        );
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  let data = {};
  
  try {
    if (event.data) {
      data = event.data.json();
      console.log('Push data:', data);
    } else {
      data = {
        title: 'ZUCA Portal',
        body: 'You have a new notification',
        icon: '/android-chrome-192x192.png',
        badge: '/favicon.ico',
        url: '/'
      };
    }
  } catch (err) {
    console.error('Error parsing push data:', err);
    data = {
      title: 'ZUCA Portal',
      body: 'You have a new notification',
      icon: '/android-chrome-192x192.png',
      badge: '/favicon.ico',
      url: '/'
    };
  }

  const title = data.title || 'ZUCA Portal';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/android-chrome-192x192.png',
    badge: data.badge || '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      type: data.type || 'notification',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Dismiss' }
    ],
    tag: data.type || 'notification',
    renotify: true,
    silent: false,
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  // Get the URL from notification data
  const urlToOpen = event.notification.data?.url || '/';

  // Handle action buttons
  if (event.action === 'close') {
    return;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close event (optional)
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});