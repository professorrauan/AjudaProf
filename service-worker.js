const CACHE_NAME = "ajudaprof-v1";

const ARQUIVOS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./logo1.png",
  "./logo2.png",
  "./manifest.json",
  "./dados/bncc.json",
  "./dados/descritores.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ARQUIVOS))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(resposta => {
      return resposta || fetch(event.request);
    })
  );
});
