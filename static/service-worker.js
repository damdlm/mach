const CACHE_NAME = "machmap-cache-v1";
const FILES_TO_CACHE = [
  "/",
  "/static/js/map.js",
  "/static/icons/icon-192.png",
  "/static/icons/icon-512.png",
  "/static/css/styles.css",
  "https://cdn.tailwindcss.com",
  "https://cdn.jsdelivr.net/npm/sweetalert2@11",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"
];

self.addEventListener("install", (event) => {
  console.log("⚙️ Instalando Service Worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("✅ Arquivos adicionados ao cache");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("♻️ Ativando novo Service Worker...");
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🗑️ Removendo cache antigo:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
