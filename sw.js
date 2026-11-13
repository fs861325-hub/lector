/* Hace que las páginas del recolector (lector de dispositivos y cubetas) abran aunque no haya señal.
   Va en la misma carpeta del sitio que index.html y Cubetas.html.
   Con conexión siempre se usa la versión más nueva del sitio; sin conexión, la última que quedó guardada. */
const CACHE = 'recolector-v1';
const PAGINAS = ['./', 'index.html', 'Cubetas.html'];

self.addEventListener('install', (evento) => {
  self.skipWaiting();
  evento.waitUntil(caches.open(CACHE).then((cache) =>
    Promise.all(PAGINAS.map((p) => cache.add(p).catch(() => null)))));   // si alguna no está, no pasa nada
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(caches.keys()
    .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  if (pedido.method !== 'GET') return;                       // los envíos a la planilla no se tocan
  const url = new URL(pedido.url);
  const propio = url.origin === self.location.origin;
  const libreria = url.hostname === 'cdn.jsdelivr.net';      // lector de QR de respaldo
  if (!propio && !libreria) return;
  evento.respondWith(
    fetch(pedido).then((respuesta) => {
      if (respuesta && respuesta.ok) {
        const copia = respuesta.clone();
        caches.open(CACHE).then((cache) => cache.put(pedido, copia));
      }
      return respuesta;
    }).catch(() => caches.match(pedido, { ignoreSearch: true }).then((guardada) => guardada || caches.match('./')))
  );
});
