const CACHE = 'orbit-shell-v8';
const ASSETS = [
  './', './index.html', './sem2-1.html', './sem2-2.html', './sem3-1.html', './sem3-2.html',
  './remote.html', './python.html', './kaoyan-remote.html', './zero-remote.html',
  './zero-python.html', './ebook.html', './manifest.webmanifest',
  './assets/apple.css', './assets/ai.css', './assets/ai.css?v=2', './assets/study.css', './assets/rs-ai.css',
  './assets/rs-ai.css?v=4', './assets/ai.js', './assets/ai.js?v=3', './assets/study.js',
  './assets/rs-ai.js', './assets/rs-ai.js?v=4', './assets/glossary.js', './assets/glossary.js?v=4',
  './assets/pwa.js',
  './assets/codemirror/codemirror.min.css', './assets/codemirror/codemirror.min.js',
  './assets/codemirror/mode/python/python.min.js',
  './assets/codemirror/addon/edit/closebrackets.min.js', './assets/codemirror/addon/edit/matchbrackets.min.js',
  './assets/vendor/anime.min.js',
  './assets/icon-192.png', './assets/icon-512.png',
  './assets/homework/ch2-1.png', './assets/homework/ch2-2.png'
];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname === 'api.deepseek.com') return;
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(resp => { const copy = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return resp; }).catch(() => r)));
});
