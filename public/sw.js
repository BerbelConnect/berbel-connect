const CACHE_NAME = "berbel-connect-v3";

const PRECACHE_URLS = [
  "/",
  "/login",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/logo-berbel.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => null);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.hostname.includes("supabase.co")) return;
  if (url.pathname.includes("/auth/v1/")) return;
  if (url.pathname.includes("/rest/v1/")) return;
  if (url.pathname.includes("/storage/v1/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone).catch(() => null);
        });

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);

        if (cached) return cached;

        if (request.mode === "navigate") {
          const login = await caches.match("/login");
          if (login) return login;
        }

        return new Response("Você está offline.", {
          status: 503,
          statusText: "Offline",
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      })
  );
});