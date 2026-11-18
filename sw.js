/* =========================================================
   AJUDANTE EM SEGUNDO PLANO (service worker) do aplicativo
   - Não guarda o sistema em cache: sempre busca a versão mais nova
     na internet (assim ninguém fica preso numa versão antiga).
   - Só se a internet cair, mostra a tela offline.html.
   Ao mudar ESTE arquivo, aumente a VERSAO abaixo.
   ========================================================= */

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

// Só as páginas (navegação) passam por aqui; o resto (Firebase, scripts) segue direto.
self.addEventListener('fetch', (e) => {
    if (e.request.mode !== 'navigate') return;
    e.respondWith(fetch(e.request).catch(() => caches.match('offline.html')));
});
