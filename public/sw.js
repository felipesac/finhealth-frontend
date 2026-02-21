// FinHealth Push Notification Service Worker

self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    var data = event.data.json();
    var options = {
      body: data.body || '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { url: data.url || '/dashboard' },
      tag: 'finhealth-notification',
      renotify: true,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'FinHealth', options)
    );
  } catch (e) {
    // Fallback for non-JSON payloads
    event.waitUntil(
      self.registration.showNotification('FinHealth', {
        body: event.data.text(),
        icon: '/favicon.svg',
      })
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  var url = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
