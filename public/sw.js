const CACHE_NAME = "mbr-habits-v2";
const STATIC_CACHE = "mbr-static-v2";
const OFFLINE_URL = "/offline.html";

const PRECACHE = [OFFLINE_URL, "/habit-tracker", "/logo-circular.png", "/manifest.json"];

const STATIC_PATTERNS = [
  /\/_next\/static\//,
  /\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/,
];

function isStaticAsset(url) {
  return STATIC_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for habit tracker pages + navigations
  if (
    request.mode === "navigate" ||
    url.pathname.startsWith("/habit-tracker") ||
    url.pathname === "/offline.html"
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then(
              (cached) =>
                cached ||
                caches.match(OFFLINE_URL) ||
                caches.match("/habit-tracker")
            )
        )
    );
  }
});

self.addEventListener("push", function (event) {
  if (event.data) {
    let data = { title: "MBR Habits", body: "You have a new update.", url: "/habit-tracker" };
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }

    const options = {
      body: data.body,
      icon: "/logo-circular.png",
      badge: "/logo-circular.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        url: data.url || "/habit-tracker",
      },
    };
    event.waitUntil(self.registration.showNotification(data.title || "MBR Habits", options));
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/habit-tracker";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/habit-tracker") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
