const CACHE_VERSAO = 'ddourado-financas-v1.0.0';
const ARQUIVOS_ESSENCIAIS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './css/style.css',
   './js/utils.js',
'./js/storage.js',
'./js/state.js',
'./js/financeiro.js',
'./js/recorrencias.js',
'./js/historico.js',
'./js/script.js',
    './js/accounts.js',
    './js/cards.js',
    './js/backup.js',
    './js/pwa.js',
    './js/navigation.js',
    './assets/icon.svg',
    './assets/icon-maskable.svg'
];

self.addEventListener('install', evento => {
    evento.waitUntil(
        caches
            .open(CACHE_VERSAO)
            .then(cache => cache.addAll(ARQUIVOS_ESSENCIAIS))
    );
});

self.addEventListener('activate', evento => {
    evento.waitUntil(
        caches
            .keys()
            .then(chaves =>
                Promise.all(
                    chaves
                        .filter(chave => chave !== CACHE_VERSAO)
                        .map(chave => caches.delete(chave))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', evento => {
    if (evento.request.method !== 'GET') return;

    if (evento.request.mode === 'navigate') {
        evento.respondWith(
            fetch(evento.request)
                .then(resposta => {
                    const copia = resposta.clone();
                    caches
                        .open(CACHE_VERSAO)
                        .then(cache =>
                            cache.put('./index.html', copia)
                        );
                    return resposta;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    evento.respondWith(
        caches.match(evento.request)
            .then(respostaEmCache => {
                if (respostaEmCache) {
                    return respostaEmCache;
                }

                return fetch(evento.request)
                    .then(resposta => {
                        if (
                            resposta.ok ||
                            resposta.type === 'opaque'
                        ) {
                            const copia = resposta.clone();
                            caches
                                .open(CACHE_VERSAO)
                                .then(cache =>
                                    cache.put(evento.request, copia)
                                );
                        }

                        return resposta;
                    });
            })
    );
});
