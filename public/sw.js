const CACHE = "forja-v3";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and API routes (offline logic is handled client-side)
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) return;

  // Cache-First SOLO para assets inmutables: los bundles de /_astro/ llevan
  // hash en el nombre, y fuentes/imagenes/manifest no cambian entre deploys.
  // CSS/JS fuera de /_astro/ (p. ej. modulos del dev server de Vite) NUNCA se
  // cachean: servir codigo viejo rompe la UI con estilos desactualizados.
  if (
    url.pathname.startsWith("/_astro/") ||
    /\.(woff2?|ttf|otf|png|svg|jpg|jpeg|ico|webp|webmanifest)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return cached ?? new Response("", { status: 503 });
        }
      })
    );
    return;
  }

  // Page navigation — Network-First, fall back to cached version
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            caches.open(CACHE).then(c => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          // Fall back to cached workout page so the tracker stays usable
          return cached ?? caches.match("/workout");
        })
    );
  }
});
