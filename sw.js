const prefix = 'dusk-janitor:' + self.registration.scope + ':';
const release = prefix + '14';
const files = [
  'index.html', 'fonts/galmuri.css', 'fonts/OFL.md', 'style.css?v=14', 'language.js?v=14', 'game.js?v=14', 'dungeon.js?v=14', 'art.js?v=14',
  'scene.js?v=14', 'manifest.webmanifest', 'icons/broom-180.png', 'icons/broom-192.png', 'icons/broom-512.png'
];
const urls = files.map(path => new URL(path, self.registration.scope).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(release).then(cache => cache.addAll(urls.map(url => new Request(url, {cache:'reload'})))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(prefix) && key !== release).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const address = new URL(req.url);
  const home = new URL('./', self.registration.scope);
  const entry = req.mode === 'navigate' && address.origin === home.origin &&
    [home.pathname, home.pathname + 'index.html'].includes(address.pathname);
  const url = entry ? urls[0] : req.url;
  if (urls.includes(url)) {
    event.respondWith(caches.open(release).then(async cache => (await cache.match(url)) || fetch(req)));
  }
});
