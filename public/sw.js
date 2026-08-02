const CACHE_NAME = "forja-v4";
const SHELL_URLS = [
  "/",
  "/dashboard",
  "/workout",
  "/nutrition",
  "/progress",
  "/offline.html",
];

// ─── Install: pre-cache shell ────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .catch(() => {}) // No bloquear si alguna falla (SSR puede rechazar)
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: purge old caches ──────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch strategy ─────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip: non-GET, API, chrome-extension, cross-origin (fonts, etc.)
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    !url.origin.includes(self.location.origin.split("//")[1])
  ) {
    return;
  }

  // 1. Cache-First para assets inmutables con hash (/_astro/*, imágenes, fuentes, icons)
  const isImmutableAsset =
    url.pathname.startsWith("/_astro/") ||
    /\.(woff2?|ttf|otf|png|svg|jpg|jpeg|ico|webp|gif|webmanifest)$/.test(
      url.pathname
    );

  if (isImmutableAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
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

  // 2. Stale-While-Revalidate para páginas de la app
  if (request.mode === "navigate") {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);

        // Lanzamos la red en paralelo siempre
        const networkPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => null);

        // Si tenemos cache, devolvemos rápido y actualizamos en segundo plano
        if (cached) {
          // Igual actualizamos en background
          networkPromise.catch(() => {});
          return cached;
        }

        // Sin cache: esperar la red o mostrar offline
        const networkResponse = await networkPromise;
        if (networkResponse) return networkResponse;

        // Fallback offline
        return (
          (await cache.match("/offline.html")) ??
          new Response("<h1>Sin conexión</h1>", {
            status: 503,
            headers: { "Content-Type": "text/html" },
          })
        );
      })
    );
    return;
  }

  // 3. Network-First para el resto (JS dinámico, etc.)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, response.clone()));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached ?? new Response("", { status: 503 });
      })
  );
});

// ─── Background Sync: reintento de registros offline ────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "forja-sync") {
    event.waitUntil(
      self.clients
        .matchAll()
        .then((clients) =>
          clients.forEach((client) =>
            client.postMessage({ type: "SYNC_REQUESTED" })
          )
        )
    );
  }
});
