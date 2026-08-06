// Navegação entre as telas do sistema.
// Em vez de recarregar outra página, eu escondo e mostro as seções pelo hash da URL.

const AREAS_APLICACAO = {
    'visao-geral': {
        titulo: 'Visão geral',
        descricao:
            'Resumo financeiro do período selecionado.'
    },
    lancamentos: {
        titulo: 'Lançamentos',
        descricao:
            'Consulte, filtre e gerencie suas movimentações.'
    },
    contas: {
        titulo: 'Contas',
        descricao:
            'Acompanhe saldos e transfira dinheiro entre contas.'
    },
    cartoes: {
        titulo: 'Cartões',
        descricao:
            'Controle limites, compras parceladas e faturas.'
    },
    planejamento: {
        titulo: 'Planejamento',
        descricao:
            'Gerencie caixinhas, metas e recorrências mensais.'
    },
    categorias: {
        titulo: 'Categorias',
        descricao:
            'Organize receitas e despesas para manter seus dados claros.'
    },
    relatorios: {
        titulo: 'Relatórios',
        descricao:
            'Entenda como seus gastos estão distribuídos no mês.'
    },
    dados: {
        titulo: 'Dados',
        descricao:
            'Exporte e restaure uma cópia segura das suas informações.'
    }
};

// Primeiro tento abrir a tela que veio na URL; se não tiver, uso a última salva.
function obterAreaInicial() {
    const areaHash = window.location.hash
        .replace('#', '');

    if (AREAS_APLICACAO[areaHash]) {
        return areaHash;
    }

    const areaSalva = localStorage.getItem(
        'dourado_area_ativa'
    );

    return AREAS_APLICACAO[areaSalva]
        ? areaSalva
        : 'visao-geral';
}

// Troca a área visível e atualiza o menu sem recarregar a página.
function navegarParaArea(
    area,
    atualizarEndereco = true
) {
    if (!AREAS_APLICACAO[area]) {
        area = 'visao-geral';
    }

    document
        .querySelectorAll('[data-app-view]')
        .forEach(secao => {
            secao.hidden =
                secao.dataset.appView !== area;
        });

    document
        .querySelectorAll('[data-app-target]')
        .forEach(botao => {
            const ativa =
                botao.dataset.appTarget === area;

            botao.classList.toggle('active', ativa);
            botao.setAttribute(
                'aria-current',
                ativa ? 'page' : 'false'
            );
        });

    const competenciaPainel =
        document.querySelector(
            '.competencia-painel'
        );

    if (competenciaPainel) {
        competenciaPainel.hidden =
            ![
                'visao-geral',
                'lancamentos',
                'relatorios'
            ].includes(area);
    }

    const configuracao = AREAS_APLICACAO[area];

    document.getElementById(
        'tituloAreaAtual'
    ).textContent = configuracao.titulo;

    document.getElementById(
        'descricaoAreaAtual'
    ).textContent = configuracao.descricao;

    localStorage.setItem(
        'dourado_area_ativa',
        area
    );

    if (atualizarEndereco) {
        history.replaceState(
            null,
            '',
            `#${area}`
        );
    }

    requestAnimationFrame(() => {
        if (
            area === 'visao-geral' &&
            typeof graficoApp !== 'undefined' &&
            graficoApp
        ) {
            graficoApp.resize();
        }

        if (
            area === 'relatorios' &&
            typeof graficoCategorias !==
                'undefined' &&
            graficoCategorias
        ) {
            graficoCategorias.resize();
        }

        if (
            area === 'dados' &&
            typeof atualizarResumoBackup === 'function'
        ) {
            atualizarResumoBackup();
        }
    });

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

document.getElementById('appNavigation')
    .addEventListener('click', evento => {
        const botao = evento.target.closest(
            '[data-app-target]'
        );

        if (!botao) return;

        navegarParaArea(
            botao.dataset.appTarget
        );
    });

window.addEventListener('hashchange', () => {
    navegarParaArea(
        obterAreaInicial(),
        false
    );
});

navegarParaArea(
    obterAreaInicial(),
    false
);

// Ações contextuais reutilizam os fluxos já validados do sistema.
document.addEventListener('click', evento => {
    const acionador = evento.target.closest('[data-proxy-click]');
    if (!acionador) return;

    const seletor = acionador.dataset.proxyClick;
    const destino = document.querySelector(seletor);

    if (!destino) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Esta ação não está disponível no momento.', 'aviso');
        }
        return;
    }

    destino.click();
});
