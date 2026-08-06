// Registro do service worker para permitir instalar o projeto como aplicativo.
// Se der erro aqui, o restante do sistema continua funcionando normalmente.

let eventoInstalacaoPendente = null;

const btnInstalarApp = document.getElementById('btnInstalarApp');
const textoInstalacaoApp = document.getElementById('textoInstalacaoApp');

function estaExecutandoComoApp() {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
    );
}

function atualizarEstadoInstalacao() {
    if (estaExecutandoComoApp()) {
        btnInstalarApp.disabled = true;
        btnInstalarApp.textContent = 'Aplicativo instalado';
        textoInstalacaoApp.textContent =
            'O Dourado Finanças já está sendo executado como aplicativo.';
        return;
    }

    if (eventoInstalacaoPendente) {
        btnInstalarApp.disabled = false;
        btnInstalarApp.textContent = 'Instalar aplicativo';
        textoInstalacaoApp.textContent =
            'Instale para abrir em tela cheia e acessar com mais rapidez.';
        return;
    }

    btnInstalarApp.disabled = true;

    if (window.location.protocol === 'file:') {
        textoInstalacaoApp.textContent =
            'A instalação ficará disponível depois que o site for publicado com segurança.';
        return;
    }

    textoInstalacaoApp.textContent =
        'Se a instalação não aparecer, use a opção “Instalar aplicativo” no menu do navegador.';
}

window.addEventListener('beforeinstallprompt', evento => {
    evento.preventDefault();
    eventoInstalacaoPendente = evento;
    atualizarEstadoInstalacao();
});

window.addEventListener('appinstalled', () => {
    eventoInstalacaoPendente = null;
    atualizarEstadoInstalacao();
    mostrarToast('Dourado Finanças instalado com sucesso.', 'sucesso');
});

btnInstalarApp.addEventListener('click', async () => {
    if (!eventoInstalacaoPendente) return;

    eventoInstalacaoPendente.prompt();
    await eventoInstalacaoPendente.userChoice;
    eventoInstalacaoPendente = null;
    atualizarEstadoInstalacao();
});

if (
    'serviceWorker' in navigator &&
    ['http:', 'https:'].includes(window.location.protocol)
) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('./service-worker.js')
            .catch(erro => {
                console.error(
                    'Não foi possível ativar o funcionamento offline.',
                    erro
                );
            });
    });
}

atualizarEstadoInstalacao();
