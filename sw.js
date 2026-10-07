/* MTC Fitness Coaching: Offline-Speicher. Wird beim Bauen erzeugt, nicht von Hand ändern. */
const VERSION = '14770a3c59';
const CACHE = 'mtc-' + VERSION;
const FILES = {
  "./": "43931944ba8b",
  "data/body.b64.txt": "1cb0dca44316",
  "data/body.json": "4a6d57d0f546",
  "fonts/chakra-petch-600.woff2": "4d6d5f0b31b3",
  "fonts/chakra-petch-700.woff2": "3c2433eb1671",
  "icons/apple-touch-icon.png": "f9501cf0724c",
  "icons/favicon-32.png": "57880b93d93e",
  "icons/icon-192.png": "7aa3e7355310",
  "icons/icon-512.png": "a15a7b28d540",
  "icons/maskable-512.png": "de669e29458d",
  "logo.png": "12947a3e8fcf",
  "manifest.webmanifest": "6e801d412b15",
  "vendor/three/build/three.min.js": "f34446bf875b",
  "vendor/three/examples/js/controls/OrbitControls.js": "b4c6e53f9853",
  "vendor/three/examples/js/postprocessing/EffectComposer.js": "6c8bf2f6b067",
  "vendor/three/examples/js/postprocessing/RenderPass.js": "3c1a07df004b",
  "vendor/three/examples/js/postprocessing/ShaderPass.js": "f0d8d767e089",
  "vendor/three/examples/js/postprocessing/UnrealBloomPass.js": "1a5b8476addc",
  "vendor/three/examples/js/shaders/CopyShader.js": "249592106188",
  "vendor/three/examples/js/shaders/LuminosityHighPassShader.js": "3c8552bb514a"
};

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Unveränderte Dateien aus der vorigen Version übernehmen, damit ein Update nicht jedes Mal 9 MB Anatomiedaten lädt
    let old = null, oldHashes = {};
    for (const k of await caches.keys()) {
      if (k === CACHE || !k.startsWith('mtc-')) continue;
      const c = await caches.open(k), r = await c.match('__hashes');
      if (r) { old = c; oldHashes = await r.json(); }
    }
    await Promise.all(Object.keys(FILES).map(async f => {
      if (old && oldHashes[f] === FILES[f]) { const r = await old.match(f); if (r) return cache.put(f, r); }
      // Beim ersten Mal dürfen die großen, festen Dateien aus dem Browser-Cache kommen (die Seite hat sie gerade geladen)
      const mode = old || !/^(data|vendor|fonts)\//.test(f) ? 'reload' : 'default';
      const res = await fetch(new Request(f, { cache: mode }));
      if (!res.ok) throw new Error(f + ' ' + res.status);
      await cache.put(f, res);
    }));
    await cache.put('__hashes', new Response(JSON.stringify(FILES)));
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('mtc-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Neue Version erst übernehmen, wenn in der App auf „Aktualisieren“ getippt wurde
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // Plan-Links (#...) und der Start vom Home-Bildschirm öffnen immer die gespeicherte App
    e.respondWith(caches.open(CACHE).then(c => c.match('./')).then(r => r || fetch(req)));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok && res.type === 'basic') c.put(req, res.clone());
    return res;
  }))));
});
