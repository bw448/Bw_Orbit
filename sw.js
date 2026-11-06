const CACHE = 'orbit-shell-v25';
const ASSETS = [
  './', './index.html', './semesters.html', './sem2-1.html', './sem2-2.html', './sem3-1.html', './sem3-2.html',
  './remote.html', './python.html', './python-guide.html', './kaoyan-remote.html', './zero-remote.html',
  './zero-python.html', './ebook.html', './bw-talk.html', './nature-geo.html', './maogai.html', './probability.html', './arcgis.html', './competitions.html', './manifest.webmanifest',
  './assets/apple.css', './assets/landing.css', './assets/landing.css?v=5', './assets/landing.js', './assets/landing.js?v=2', './assets/ebook.css', './assets/ebook.js', './assets/python-papers.css', './assets/course.css', './assets/course.css?v=4', './assets/course.js', './assets/quiz.css?v=2', './assets/quiz.js?v=3', './assets/arcgis.css?v=3', './assets/arcgis.js?v=3', './assets/maogai.js?v=3', './assets/maogai.css?v=2', './assets/python-guide.css?v=2', './assets/python-guide.js?v=2', './assets/competitions.css', './assets/competitions.css?v=2', './assets/competitions.js', './assets/bw.css', './assets/bw.css?v=4', './assets/bw.js', './assets/bw.js?v=2', './assets/cloudbase-config.js', './assets/cloudbase-config.js?v=2', './assets/competitions-data.js', './assets/notes.css', './assets/ai.css', './assets/ai.css?v=2', './assets/study.css', './assets/rs-ai.css',
  './assets/rs-ai.css?v=4', './assets/ai.js', './assets/ai.js?v=4', './assets/study.js',
  './assets/rs-ai.js', './assets/rs-ai.js?v=5', './assets/glossary.js', './assets/glossary.js?v=4',
  './assets/pwa.js',
  './assets/ebooks/books.js',
  './assets/ebooks/covers/nature.jpg', './assets/ebooks/covers/maogai.jpg', './assets/ebooks/covers/probability.jpg', './assets/ebooks/covers/remote.jpg', './assets/ebooks/covers/arcgis.jpg',
  './assets/pdfjs/pdf.min.js', './assets/pdfjs/pdf.worker.min.js',
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
  if (url.origin !== location.origin) return;
  if (e.request.method !== 'GET') return;
  // Never cache large downloads or handle them in the SW.
  if (/\.(pdf|docx|zip|mp4|mov|webm)$/i.test(url.pathname) || url.pathname.includes('/assets/ebooks/') || url.pathname.includes('/assets/papers/')) return;

  function networkFirst(request) {
    return fetch(request, { cache: 'no-store' }).then(function (resp) {
      if (resp && resp.ok) {
        const copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(request, copy); });
      }
      return resp;
    }).catch(function () {
      return caches.match(request).then(function (r) {
        return r || (request.mode === 'navigate' ? caches.match('./index.html') : Response.error());
      });
    });
  }
  e.respondWith(networkFirst(e.request));
});
