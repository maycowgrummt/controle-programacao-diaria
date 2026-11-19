// service worker: nao faz cache do app, so mostra offline.html se cair a internet
// mudou esse arquivo? sobe a VERSAO

const VERSAO = 'programacao-v1';
const ARQUIVOS_OFFLINE = ['offline.html', 'img/icone-192.png'];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS_OFFLINE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then(nomes => Promise.all(nomes.filter(n => n !== VERSAO).map(n => caches.delete(n))))
            .then(() => self.clients.claim())
    );
});

// so navegacao, o resto passa direto
self.addEventListener('fetch', (e) => {
    if (e.request.mode !== 'navigate') return;
    e.respondWith(fetch(e.request).catch(() => caches.match('offline.html')));
});
