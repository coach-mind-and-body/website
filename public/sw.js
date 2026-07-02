self.addEventListener('push', function (event) {
  if (event.data) {
    let data = { title: "New Message", body: "You have a new message.", url: "/admin/inbox" };
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
    
    const options = {
      body: data.body,
      icon: '/logo-circular.png',
      badge: '/logo-circular.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
        url: data.url || "/admin"
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification.data.url || "/admin";
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
