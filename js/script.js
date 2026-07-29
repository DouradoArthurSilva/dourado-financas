
    // ==========================================
    // ==========================================
// CONFIGURAÇÃO DO GRÁFICO (CHART.JS)
// ==========================================
let graficoApp;
let graficoCategorias;

window.onload = function () {
    const canvasGrafico = document.getElementById('graficoResumo');

    if (canvasGrafico) {
        const ctx = canvasGrafico.getContext('2d');

        graficoApp = new Chart(ctx, {
            type: 'doughnut',

            data: {
                labels: [
                    'Despesas',
                    'Guardado',
                    'Sobra disponível'
                ],

                datasets: [{
                    data: [0, 0, 100],

                    backgroundColor: [
                        '#e74c3c',
                        '#3498db',
                        '#27ae60'
                    ],

                    borderWidth: 2
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',

                plugins: {
                    legend: {
                        position: 'bottom',

                        labels: {
                            color: '#FFFFFF',

                            font: {
                                size: 14,
                                weight: '600'
                            },

                            padding: 20,
                            boxWidth: 18,
                            boxHeight: 18
                        }
                    }
                }
            }
        });
    }

    const canvasCategorias = document.getElementById(
        'graficoCategorias'
    );

    if (canvasCategorias) {
        graficoCategorias = new Chart(
            canvasCategorias.getContext('2d'),
            {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [],
                        borderColor: '#1b283d',
                        borderWidth: 2,
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '66%',
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label(contexto) {
                                    const valor =
                                        Number(contexto.raw) || 0;

                                    return (
                                        `${contexto.label}: ` +
                                        `R$ ${formatarMoeda(valor)}`
                                    );
                                }
                            }
                        }
                    }
                }
            }
        );
    }

  const recorrenciasGeradas =
    processarRecorrenciasMensais();

renderizarTela();

if (recorrenciasGeradas > 0) {
    mostrarToast(
        recorrenciasGeradas === 1
            ? '1 lançamento recorrente foi gerado.'
            : `${recorrenciasGeradas} lançamentos recorrentes foram gerados.`,
        'info'
    );
}
};

    // ==========================================
    // 1. ELEMENTOS DA TELA
    // ==========================================
const elementos = {
    recorrenciasLista: document.getElementById(
        'recorrenciasLista'
    ),

    competenciaPainel: document.getElementById(
        'competenciaPainel'
    ),

    tituloCompetenciaPainel: document.getElementById(
        'tituloCompetenciaPainel'
    ),

    btnMesAtual: document.getElementById(
        'btnMesAtual'
    ),

    recorrenciasVazio: document.getElementById(
        'recorrenciasVazio'
    ),

  totalRecorrenciasAtivas: document.getElementById(
    'totalRecorrenciasAtivas'
),

totalRecorrenciasPausadas: document.getElementById(
    'totalRecorrenciasPausadas'
),

totalRecorrenciasEncerradas: document.getElementById(
    'totalRecorrenciasEncerradas'
),
    tbodyHistorico: document.getElementById('tbodyHistorico'),
    pesquisaHistorico: document.getElementById('pesquisaHistorico'),
    categoriaHistorico: document.getElementById(
        'categoriaHistorico'
    ),
    mesHistorico: document.getElementById('mesHistorico'),
    ordenacaoHistorico: document.getElementById('ordenacaoHistorico'),
    filtrosHistorico: document.getElementById('filtrosHistorico'),
    comparacaoHistorico: document.getElementById('comparacaoHistorico'),
    quantidadeHistorico: document.getElementById('quantidadeHistorico'),
    totalHistorico: document.getElementById('totalHistorico'),
    historicoVazio: document.getElementById('historicoVazio'),
    historicoLancamentos: document.getElementById('historicoLancamentos'),
    periodoRelatorioCategorias: document.getElementById(
        'periodoRelatorioCategorias'
    ),
    totalGastosCategorias: document.getElementById(
        'totalGastosCategorias'
    ),
    quantidadeCategoriasUtilizadas: document.getElementById(
        'quantidadeCategoriasUtilizadas'
    ),
    maiorCategoriaGasto: document.getElementById(
        'maiorCategoriaGasto'
    ),
    rankingCategorias: document.getElementById(
        'rankingCategorias'
    ),
    relatorioCategoriasVazio: document.getElementById(
        'relatorioCategoriasVazio'
    ),

   caixinhasGrid: document.getElementById('caixinhasGrid'),
caixinhaSelect: document.getElementById('caixinhaSelect'),
btnNovaCaixinha: document.getElementById('btnNovaCaixinha'),

modalCaixinha: document.getElementById('modalCaixinha'),
tituloModalCaixinha: document.getElementById(
    'tituloModalCaixinha'
),
caixinhaEmEdicaoId: document.getElementById(
    'caixinhaEmEdicaoId'
),
nomeCaixinha: document.getElementById('nomeCaixinha'),
metaCaixinha: document.getElementById('metaCaixinha'),
iconeCaixinha: document.getElementById('iconeCaixinha'),
corCaixinha: document.getElementById('corCaixinha'),
prazoCaixinha: document.getElementById('prazoCaixinha'),
btnSalvarCaixinha: document.getElementById(
    'btnSalvarCaixinha'
),
btnCancelarCaixinha: document.getElementById(
    'btnCancelarCaixinha'
),
btnFecharModalCaixinha: document.getElementById(
    'btnFecharModalCaixinha'
),

modalExcluirCaixinha: document.getElementById(
    'modalExcluirCaixinha'
),
textoExcluirCaixinha: document.getElementById(
    'textoExcluirCaixinha'
),
btnCancelarExclusaoCaixinha: document.getElementById(
    'btnCancelarExclusaoCaixinha'
),
btnConfirmarExclusaoCaixinha: document.getElementById(
    'btnConfirmarExclusaoCaixinha'
),

    painelSalario: document.getElementById('painelSalario'),
    painelGuardado: document.getElementById('painelGuardado'),
    painelFixo: document.getElementById('painelFixo'),
    painelVariavel: document.getElementById('painelVariavel'),

   modalOverlay: document.getElementById('modalLancamento'),
sobraFlutuante: document.querySelector('.sobra-flutuante')
};

const estadoHistorico = {
    filtro: 'todos',
    pesquisa: '',
    mes: 'todos',
    categoria: 'todas',
    ordenacao: 'recentes'
};

let competenciaPainelSelecionada =
    obterCompetenciaAtual();

function obterCompetenciaTransacao(transacao) {
    return (
        normalizarCompetencia(
            transacao.competencia
        ) ||
        obterChaveMes(transacao.data)
    );
}

function formatarTituloCompetencia(
    competencia
) {
    const [ano, mes] = competencia
        .split('-')
        .map(Number);

    if (!ano || !mes) {
        return 'Visão mensal';
    }

    const nomeMes = new Intl.DateTimeFormat(
        'pt-BR',
        {
            month: 'long',
            year: 'numeric'
        }
    ).format(
        new Date(ano, mes - 1, 1)
    );

    return (
        nomeMes.charAt(0).toUpperCase() +
        nomeMes.slice(1)
    );
}

const ICONES_CAIXINHA = {
    'piggy-bank': 'fa-piggy-bank',
    'shield-heart': 'fa-shield-heart',
    'rings-wedding': 'fa-ring',
    'plane': 'fa-plane',
    'house': 'fa-house',
    'car': 'fa-car',
    'graduation-cap': 'fa-graduation-cap',
    'laptop': 'fa-laptop',
    'gift': 'fa-gift',
    'bullseye': 'fa-bullseye'
};

const CORES_CAIXINHA = {
    dourado: '#d9ad26',
    azul: '#4f97ff',
    verde: '#31cc70',
    roxo: '#9b7cff',
    laranja: '#ffad19',
    vermelho: '#ff5b5b'
};

let caixinhaPendenteExclusaoId = null;

function obterIconeCaixinha(icone) {
    return ICONES_CAIXINHA[icone]
        || ICONES_CAIXINHA['piggy-bank'];
}

function obterCorCaixinha(cor) {
    return CORES_CAIXINHA[cor]
        || CORES_CAIXINHA.dourado;
}

function formatarPrazoCaixinha(prazo) {
    if (!prazo) {
        return '';
    }

    const partes = prazo.split('-');

    if (partes.length !== 3) {
        return '';
    }

    const [ano, mes, dia] = partes;

    return `${dia}/${mes}/${ano}`;
}

function gerarIdUnico() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

    // ==========================================
    // 2. RENDERIZADOR PRINCIPAL (A MÁGICA)
    // ==========================================
    function converterDataParaTimestamp(data) {
        if (!data || typeof data !== 'string') return 0;

        const [dia, mes, ano] = data.split('/').map(Number);

        if (!dia || !mes || !ano) return 0;

        return new Date(ano, mes - 1, dia).getTime();
    }

    function obterChaveMes(data) {
        if (!data || typeof data !== 'string') return '';

        const partes = data.split('/');

        if (partes.length !== 3) return '';

        return `${partes[2]}-${partes[1]}`;
    }

    function formatarNomeMes(chaveMes) {
        const [ano, mes] = chaveMes.split('-').map(Number);

        if (!ano || !mes) return '';

        const data = new Date(ano, mes - 1, 1);
        const nome = data.toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        });

        return nome.charAt(0).toUpperCase() + nome.slice(1);
    }

    function escaparHTML(texto) {
        const elemento = document.createElement('div');
        elemento.textContent = texto ?? '';
        return elemento.innerHTML;
    }

    function atualizarOpcoesMeses() {
        if (!elementos.mesHistorico) return;

        const meses = [...new Set(
            transacoes
                .map(transacao =>
                    obterCompetenciaTransacao(
                        transacao
                    )
                )
                .filter(Boolean)
        )].sort((a, b) => b.localeCompare(a));

        const mesSelecionado = estadoHistorico.mes;

        elementos.mesHistorico.innerHTML = '<option value="todos">Todos os meses</option>';

        meses.forEach(chaveMes => {
            const option = document.createElement('option');
            option.value = chaveMes;
            option.textContent = formatarNomeMes(chaveMes);
            elementos.mesHistorico.appendChild(option);
        });

        const mesAindaExiste = mesSelecionado === 'todos' || meses.includes(mesSelecionado);
        estadoHistorico.mes = mesAindaExiste ? mesSelecionado : 'todos';
        elementos.mesHistorico.value = estadoHistorico.mes;
    }

    function atualizarOpcoesCategoriasHistorico() {
        if (!elementos.categoriaHistorico) return;

        const categoriaSelecionada =
            estadoHistorico.categoria;

        elementos.categoriaHistorico.innerHTML = `
            <option value="todas">Todas as categorias</option>
            <option value="sem-categoria">Sem categoria</option>
        `;

        [...categorias]
            .sort((a, b) => {
                if (a.tipo !== b.tipo) {
                    return a.tipo.localeCompare(b.tipo);
                }

                return a.nome.localeCompare(
                    b.nome,
                    'pt-BR'
                );
            })
            .forEach(categoria => {
                const opcao =
                    document.createElement('option');

                const pai = categoria.categoriaPaiId
                    ? obterCategoriaPorId(
                        categoria.categoriaPaiId
                    )
                    : null;

                opcao.value = categoria.id;
                opcao.textContent = pai
                    ? `${pai.nome} › ${categoria.nome}`
                    : categoria.nome;

                if (categoria.arquivada) {
                    opcao.textContent += ' (arquivada)';
                } else if (!categoria.ativa) {
                    opcao.textContent += ' (inativa)';
                }

                elementos.categoriaHistorico
                    .appendChild(opcao);
            });

        const valorAindaExiste =
            categoriaSelecionada === 'todas' ||
            categoriaSelecionada === 'sem-categoria' ||
            categorias.some(categoria =>
                String(categoria.id) ===
                String(categoriaSelecionada)
            );

        estadoHistorico.categoria =
            valorAindaExiste
                ? categoriaSelecionada
                : 'todas';

        elementos.categoriaHistorico.value =
            estadoHistorico.categoria;
    }

    function transacaoCombinaComFiltro(transacao) {
        const filtros = {
            todos: () => true,
            entradas: () => transacao.tipo === 'salario',
            fixos: () => transacao.tipo === 'fixo',
            variaveis: () => transacao.tipo === 'variavel',
            guardados: () => transacao.tipo === 'guardado',
            resgates: () => transacao.tipo === 'resgate'
        };

        return (filtros[estadoHistorico.filtro] || filtros.todos)();
    }

    function obterTransacoesFiltradas() {
        const pesquisa = estadoHistorico.pesquisa.trim().toLocaleLowerCase('pt-BR');

        const filtradas = transacoes.filter(transacao => {
            const combinaFiltro = transacaoCombinaComFiltro(transacao);
            const combinaMes = estadoHistorico.mes === 'todos' ||
                obterCompetenciaTransacao(transacao) === estadoHistorico.mes;

            const combinaCategoria =
                estadoHistorico.categoria === 'todas' ||
                (
                    estadoHistorico.categoria ===
                        'sem-categoria'
                        ? !transacao.categoriaId
                        : String(transacao.categoriaId) ===
                            String(
                                estadoHistorico.categoria
                            )
                );

            const textoPesquisavel = `${transacao.descricao || ''} ${transacao.categoriaText || ''} ${transacao.categoriaNome || ''}`
                .toLocaleLowerCase('pt-BR');

            const combinaPesquisa = pesquisa === '' || textoPesquisavel.includes(pesquisa);

            return (
                combinaFiltro &&
                combinaMes &&
                combinaCategoria &&
                combinaPesquisa
            );
        });

        return filtradas.sort((a, b) => {
            if (estadoHistorico.ordenacao === 'antigos') {
                return converterDataParaTimestamp(a.data) - converterDataParaTimestamp(b.data) || a.id - b.id;
            }

            if (estadoHistorico.ordenacao === 'maior-valor') {
                return b.valor - a.valor;
            }

            if (estadoHistorico.ordenacao === 'menor-valor') {
                return a.valor - b.valor;
            }

            return converterDataParaTimestamp(b.data) - converterDataParaTimestamp(a.data) || b.id - a.id;
        });
    }

    function atualizarComparacaoMensal() {
        if (!elementos.comparacaoHistorico) return;

        if (estadoHistorico.mes === 'todos') {
            elementos.comparacaoHistorico.innerHTML =
                '💡 Selecione um mês para comparar seus gastos variáveis com o mês anterior.';
            return;
        }

        const [ano, mes] = estadoHistorico.mes.split('-').map(Number);
        const dataAnterior = new Date(ano, mes - 2, 1);
        const chaveMesAnterior = `${dataAnterior.getFullYear()}-${String(dataAnterior.getMonth() + 1).padStart(2, '0')}`;

        const totalAtual = transacoes
            .filter(t =>
                t.tipo === 'variavel' &&
                obterCompetenciaTransacao(t) ===
                    estadoHistorico.mes
            )
            .reduce((total, t) => total + t.valor, 0);

        const totalAnterior = transacoes
            .filter(t =>
                t.tipo === 'variavel' &&
                obterCompetenciaTransacao(t) ===
                    chaveMesAnterior
            )
            .reduce((total, t) => total + t.valor, 0);

        if (totalAtual === 0 && totalAnterior === 0) {
            elementos.comparacaoHistorico.innerHTML =
                '💡 Ainda não há gastos variáveis suficientes para comparar estes dois meses.';
            return;
        }

        const diferenca = totalAtual - totalAnterior;
        const nomeMesAtual = formatarNomeMes(estadoHistorico.mes).split(' / ')[0];
        const nomeMesAnterior = formatarNomeMes(chaveMesAnterior).split(' / ')[0];

        if (diferenca === 0) {
            elementos.comparacaoHistorico.innerHTML =
                `💡 Seus gastos variáveis em <strong>${nomeMesAtual}</strong> ficaram iguais aos de <strong>${nomeMesAnterior}</strong>.`;
            return;
        }

        const movimento = diferenca < 0 ? 'a menos' : 'a mais';
        const mensagemFinal = diferenca < 0 ? 'Bom trabalho!' : 'Vale revisar os gastos.';

        elementos.comparacaoHistorico.innerHTML =
            `💡 Em <strong>${nomeMesAtual}</strong>, você gastou <strong>R$ ${formatarMoeda(Math.abs(diferenca))} ${movimento}</strong> em gastos variáveis do que em ${nomeMesAnterior}. ${mensagemFinal}`;
    }

    function renderizarHistorico() {
        if (!elementos.tbodyHistorico) return;

        atualizarOpcoesMeses();
        atualizarOpcoesCategoriasHistorico();

        const transacoesFiltradas = obterTransacoesFiltradas();
        elementos.tbodyHistorico.innerHTML = '';

        transacoesFiltradas.forEach(transacao => {
            const permiteAlterarStatus =
                (
                    transacao.tipo === 'fixo' ||
                    transacao.tipo === 'variavel'
                ) &&
                !transacao.cartaoId;

            const contaOrigem =
                obterContaPorId(
                    transacao.contaOrigemId ||
                    transacao.contaId
                );

            const contaDestino =
                obterContaPorId(
                    transacao.contaDestinoId
                );

            const textoConta =
                transacao.tipo === 'transferencia'
                    ? `${contaOrigem ? contaOrigem.nome : 'Conta'} → ${contaDestino ? contaDestino.nome : 'Conta'}`
                    : contaOrigem
                        ? contaOrigem.nome
                        : '';

            const pagamentoFaturaCartao =
                transacao.cartaoId
                    ? obterPagamentoFatura(
                        transacao.cartaoId,
                        transacao.competencia
                    )
                    : null;

            const statusHTML = transacao.cartaoId
                ? `<span class="status-badge ${pagamentoFaturaCartao ? 'status-pago' : 'status-pendente'} status-static">${pagamentoFaturaCartao ? 'Fatura paga' : 'Na fatura'}</span>`
                : permiteAlterarStatus
                ? `<button type="button" class="status-badge ${transacao.isPago ? 'status-pago' : 'status-pendente'}" title="Clique para alterar o status">${transacao.isPago ? 'Pago' : 'Pendente'}</button>`
                : '<span class="status-badge status-pago status-static">Efetivado</span>';

            const tr = document.createElement('tr');
            tr.setAttribute('data-id', transacao.id);
            tr.innerHTML = `
                <td>${escaparHTML(transacao.data)}</td>
                <td>
                    <div class="history-description">${escaparHTML(transacao.descricao)}</div>
                    ${
                        transacao.categoriaNome
                            ? `<small class="history-category-name">${escaparHTML(transacao.categoriaNome)}</small>`
                            : ''
                    }
                    ${
                        textoConta
                            ? `<small class="history-category-name"><i class="fa-solid fa-building-columns"></i> ${escaparHTML(textoConta)}</small>`
                            : ''
                    }
                </td>
                <td><span class="category-label category-${escaparHTML(transacao.tipo)}">${escaparHTML(transacao.categoriaText)}</span></td>
                <td>${statusHTML}</td>
                <td class="${escaparHTML(transacao.classeCor)} history-value-cell">
                    <span>${escaparHTML(transacao.sinal)} R$ ${formatarMoeda(transacao.valor)}</span>
                    <button type="button" class="btn-excluir" title="Excluir lançamento" aria-label="Excluir lançamento">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;

            elementos.tbodyHistorico.appendChild(tr);
        });

        const quantidade = transacoesFiltradas.length;
        const totalMovimentado = transacoesFiltradas.reduce((total, transacao) => total + transacao.valor, 0);

        if (elementos.quantidadeHistorico) {
            elementos.quantidadeHistorico.textContent = `${quantidade} ${quantidade === 1 ? 'lançamento' : 'lançamentos'}`;
        }

        if (elementos.totalHistorico) {
            elementos.totalHistorico.textContent = `Total movimentado: R$ ${formatarMoeda(totalMovimentado)}`;
        }

        if (elementos.historicoVazio) {
            elementos.historicoVazio.hidden = quantidade > 0;
        }

        atualizarComparacaoMensal();
    }

    function aplicarFiltroHistorico(filtro, rolarAteHistorico = false) {
        estadoHistorico.filtro = filtro;

        document.querySelectorAll('#filtrosHistorico .tab-btn').forEach(botao => {
            botao.classList.toggle('active', botao.dataset.filter === filtro);
        });

        renderizarHistorico();

        if (rolarAteHistorico && elementos.historicoLancamentos) {
            if (
                typeof navegarParaArea ===
                'function'
            ) {
                navegarParaArea('lancamentos');
            }

            elementos.historicoLancamentos.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
function obterTextoTipoRecorrencia(tipo) {
    const tipos = {
        salario: 'Receita mensal',
        fixo: 'Gasto fixo',
        variavel: 'Gasto variável'
    };

    return tipos[tipo] || 'Lançamento mensal';
}

function obterIconeTipoRecorrencia(tipo) {
    const icones = {
        salario: 'fa-money-bill-trend-up',
        fixo: 'fa-receipt',
        variavel: 'fa-cart-shopping'
    };

    return icones[tipo] || 'fa-rotate';
}

function obterTextoTerminoRecorrencia(recorrencia) {
    const termino = recorrencia.termino || {
        tipo: 'nunca'
    };

    if (termino.tipo === 'quantidade') {
        return `${termino.quantidade} meses`;
    }

    if (termino.tipo === 'competencia') {
        const [ano, mes] =
            termino.competenciaFinal.split('-');

        return `Até ${mes}/${ano}`;
    }

    return 'Sem data final';
}

function obterTextoStatusRecorrencia(status) {
    const textos = {
        ativa: 'Ativa',
        pausada: 'Pausada',
        encerrada: 'Encerrada'
    };

    return textos[status] || 'Ativa';
}
const modalReativarRecorrencia =
    document.getElementById(
        'modalReativarRecorrencia'
    );

let recorrenciaPendenteReativacaoId = null;

function abrirModalReativacao(recorrencia) {
    recorrenciaPendenteReativacaoId =
        Number(recorrencia.id);

    document.getElementById(
        'tituloReativarRecorrencia'
    ).textContent =
        `Reativar "${recorrencia.descricao}"`;

    modalReativarRecorrencia.style.display =
        'flex';

    modalReativarRecorrencia.setAttribute(
        'aria-hidden',
        'false'
    );
}

function fecharModalReativacao() {
    recorrenciaPendenteReativacaoId = null;

    modalReativarRecorrencia.style.display =
        'none';

    modalReativarRecorrencia.setAttribute(
        'aria-hidden',
        'true'
    );
}

function obterRecorrenciaPendenteReativacao() {
    return recorrencias.find(
        item =>
            Number(item.id) ===
            recorrenciaPendenteReativacaoId
    );
}

function marcarMesesAnterioresComoProcessados(
    recorrencia
) {
    const competenciaAtual =
        obterCompetenciaAtual();

    const distancia =
        calcularDistanciaEntreCompetencias(
            recorrencia.competenciaInicial,
            competenciaAtual
        );

    if (distancia <= 0) {
        return;
    }

    for (
        let indice = 0;
        indice < distancia;
        indice += 1
    ) {
        const competencia =
            adicionarMesesCompetencia(
                recorrencia.competenciaInicial,
                indice
            );

        if (
            !recorrenciaPermiteCompetencia(
                recorrencia,
                competencia
            )
        ) {
            break;
        }

        if (
            !recorrencia.competenciasProcessadas
                .includes(competencia)
        ) {
            recorrencia.competenciasProcessadas
                .push(competencia);
        }
    }
}

function concluirReativacao(
    recuperarPendencias
) {
    const recorrencia =
        obterRecorrenciaPendenteReativacao();

    if (!recorrencia) {
        fecharModalReativacao();

        mostrarToast(
            'Recorrência não encontrada.',
            'erro'
        );

        return;
    }

    if (!recuperarPendencias) {
        marcarMesesAnterioresComoProcessados(
            recorrencia
        );
    }

    recorrencia.status = 'ativa';
    recorrencia.atualizadaEm =
        new Date().toISOString();

    salvarNoBanco();
    fecharModalReativacao();

    const quantidadeGerada =
        processarRecorrenciasMensais();

    renderizarTela();

    if (recuperarPendencias) {
        mostrarToast(
            quantidadeGerada > 0
                ? `${quantidadeGerada} lançamento(s) pendente(s) recuperado(s).`
                : 'Recorrência reativada. Não havia pendências.',
            'sucesso'
        );

        return;
    }

    mostrarToast(
        quantidadeGerada > 0
            ? 'Recorrência reativada a partir do mês atual.'
            : 'Recorrência reativada.',
        'sucesso'
    );
}

document
    .getElementById('btnRecuperarPendencias')
    .addEventListener('click', () => {
        concluirReativacao(true);
    });

document
    .getElementById('btnContinuarMesAtual')
    .addEventListener('click', () => {
        concluirReativacao(false);
    });

document
    .getElementById('btnCancelarReativacao')
    .addEventListener(
        'click',
        fecharModalReativacao
    );

modalReativarRecorrencia.addEventListener(
    'click',
    evento => {
        if (
            evento.target ===
            modalReativarRecorrencia
        ) {
            fecharModalReativacao();
        }
    }
);

let filtroRecorrenciasAtual = 'atuais';

function renderizarRecorrencias() {
    if (!elementos.recorrenciasLista) {
        return;
    }

    const totais = recorrencias.reduce(
        (resultado, recorrencia) => {
            if (recorrencia.arquivada) {
                resultado.arquivadas += 1;
                return resultado;
            }

            if (recorrencia.status === 'ativa') {
                resultado.ativas += 1;
            } else if (
                recorrencia.status === 'pausada'
            ) {
                resultado.pausadas += 1;
            } else if (
                recorrencia.status === 'encerrada'
            ) {
                resultado.encerradas += 1;
            }

            return resultado;
        },
        {
            ativas: 0,
            pausadas: 0,
            encerradas: 0,
            arquivadas: 0
        }
    );

    elementos.totalRecorrenciasAtivas.textContent =
        totais.ativas;

    elementos.totalRecorrenciasPausadas.textContent =
        totais.pausadas;

    elementos.totalRecorrenciasEncerradas.textContent =
        totais.encerradas;

    document.getElementById(
        'totalRecorrenciasArquivadas'
    ).textContent = totais.arquivadas;

    elementos.recorrenciasLista.innerHTML = '';

    const recorrenciasVisiveis =
        recorrencias.filter(recorrencia => {
            if (filtroRecorrenciasAtual === 'todas') {
                return true;
            }

            if (filtroRecorrenciasAtual === 'arquivadas') {
                return recorrencia.arquivada;
            }

            if (recorrencia.arquivada) {
                return false;
            }

            if (filtroRecorrenciasAtual === 'encerradas') {
                return recorrencia.status === 'encerrada';
            }

            return recorrencia.status !== 'encerrada';
        });

    elementos.recorrenciasVazio.hidden =
        recorrenciasVisiveis.length > 0;

    if (recorrenciasVisiveis.length === 0) {
        return;
    }

    const recorrenciasOrdenadas = [
        ...recorrenciasVisiveis
    ].sort((a, b) => {
        const ordemStatus = {
            ativa: 0,
            pausada: 1,
            encerrada: 2
        };

        return (
            (ordemStatus[a.status] ?? 3) -
            (ordemStatus[b.status] ?? 3)
        );
    });

    recorrenciasOrdenadas.forEach(recorrencia => {
        const status =
            recorrencia.status || 'ativa';

        const textoAcao =
            status === 'ativa'
                ? 'Pausar'
                : 'Reativar';

        const acao =
            status === 'ativa'
                ? 'pausar'
                : 'reativar';

        const botaoEstado =
            status !== 'encerrada' &&
            !recorrencia.arquivada
                ? `
                    <button
                        type="button"
                        class="btn-recorrencia"
                        data-acao-recorrencia="${acao}"
                        data-recorrencia-id="${recorrencia.id}"
                    >
                        ${textoAcao}
                    </button>
                `
                : '';

        const botaoArquivar = recorrencia.arquivada
            ? `
                <button
                    type="button"
                    class="btn-recorrencia"
                    data-acao-recorrencia="restaurar"
                    data-recorrencia-id="${recorrencia.id}"
                >
                    Restaurar
                </button>
            `
            : `
                <button
                    type="button"
                    class="btn-recorrencia"
                    data-acao-recorrencia="arquivar"
                    data-recorrencia-id="${recorrencia.id}"
                >
                    Arquivar
                </button>
            `;

        const botaoExcluir = `
            <button
                type="button"
                class="btn-recorrencia btn-recorrencia-perigo"
                data-acao-recorrencia="excluir"
                data-recorrencia-id="${recorrencia.id}"
            >
                Excluir
            </button>
        `;

        elementos.recorrenciasLista.insertAdjacentHTML(
            'beforeend',
            `
                <article class="recorrencia-card">
                    <div class="recorrencia-card-topo">
                        <div class="recorrencia-identidade">
                            <span class="recorrencia-icone">
                                <i class="fa-solid ${obterIconeTipoRecorrencia(recorrencia.tipoLancamento)}"></i>
                            </span>

                            <div>
                                <h3>
                                    ${escaparHTML(recorrencia.descricao)}
                                </h3>

                                <p>
                                    ${obterTextoTipoRecorrencia(recorrencia.tipoLancamento)}
                                </p>
                            </div>
                        </div>

                        <span
                            class="recorrencia-status recorrencia-status-${status}"
                        >
                            ${obterTextoStatusRecorrencia(status)}
                        </span>
                    </div>

                    <div class="recorrencia-detalhes">
                        <div class="recorrencia-detalhe">
                            <span>Valor</span>

                            <strong>
                                R$ ${formatarMoeda(recorrencia.valor)}
                            </strong>
                        </div>

                        <div class="recorrencia-detalhe">
                            <span>Vencimento</span>

                            <strong>
                                Dia ${recorrencia.diaVencimento}
                            </strong>
                        </div>

                        <div class="recorrencia-detalhe">
                            <span>Início</span>

                            <strong>
                                ${recorrencia.competenciaInicial.split('-').reverse().join('/')}
                            </strong>
                        </div>

                        <div class="recorrencia-detalhe">
                            <span>Término</span>

                            <strong>
                                ${obterTextoTerminoRecorrencia(recorrencia)}
                            </strong>
                        </div>
                    </div>

                  <div class="recorrencia-acoes">
    ${
        status !== 'encerrada' &&
        !recorrencia.arquivada
            ? `
                <button
                    type="button"
                    class="btn-recorrencia"
                    data-acao-recorrencia="editar"
                    data-recorrencia-id="${recorrencia.id}"
                >
                    Editar
                </button>
            `
            : ''
    }

    ${botaoEstado}

                        ${
                            status !== 'encerrada' &&
                            !recorrencia.arquivada
                                ? `
                                    <button
                                        type="button"
                                        class="btn-recorrencia btn-recorrencia-perigo"
                                        data-acao-recorrencia="encerrar"
                                        data-recorrencia-id="${recorrencia.id}"
                                    >
                                        Encerrar
                                    </button>
                                `
                                : ''
                        }

                        ${botaoArquivar}
                        ${botaoExcluir}
                    </div>
                </article>
            `
        );
    });
}

function obterDadosRelatorioCategorias() {
    const grupos = new Map();

    transacoes
        .filter(transacao => {
            return (
                (
                    transacao.tipo === 'fixo' ||
                    transacao.tipo === 'variavel'
                ) &&
                obterCompetenciaTransacao(transacao) ===
                    competenciaPainelSelecionada
            );
        })
        .forEach(transacao => {
            const categoria = transacao.categoriaId
                ? obterCategoriaPorId(
                    transacao.categoriaId
                )
                : null;

            const nome = categoria
                ? categoria.nome
                : (
                    transacao.categoriaNome ||
                    'Sem categoria'
                );

            const chave = categoria
                ? `categoria:${categoria.id}`
                : `legado:${nome}`;

            const corCategoria =
                categoria &&
                /^#[0-9a-f]{6}$/i.test(categoria.cor)
                    ? categoria.cor
                    : '#8f99a8';

            const grupoAtual = grupos.get(chave) || {
                nome,
                cor: corCategoria,
                total: 0,
                quantidade: 0
            };

            grupoAtual.total +=
                Number(transacao.valor) || 0;
            grupoAtual.quantidade += 1;

            grupos.set(chave, grupoAtual);
        });

    return [...grupos.values()].sort(
        (a, b) => b.total - a.total
    );
}

function renderizarRelatorioCategorias() {
    if (!elementos.rankingCategorias) return;

    const dados = obterDadosRelatorioCategorias();
    const total = dados.reduce(
        (soma, item) => soma + item.total,
        0
    );

    elementos.periodoRelatorioCategorias.textContent =
        `Distribuição de ${formatarTituloCompetencia(
            competenciaPainelSelecionada
        ).toLocaleLowerCase('pt-BR')}.`;

    elementos.totalGastosCategorias.textContent =
        `R$ ${formatarMoeda(total)}`;

    elementos.quantidadeCategoriasUtilizadas.textContent =
        String(dados.length);

    elementos.maiorCategoriaGasto.textContent =
        dados.length > 0
            ? dados[0].nome
            : 'Nenhum';

    elementos.rankingCategorias.innerHTML = '';

    if (elementos.relatorioCategoriasVazio) {
        elementos.relatorioCategoriasVazio.hidden =
            dados.length > 0;
    }

    const canvas = document.getElementById(
        'graficoCategorias'
    );

    if (canvas) {
        canvas.hidden = dados.length === 0;
    }

    if (dados.length === 0) {
        if (graficoCategorias) {
            graficoCategorias.data.labels = [];
            graficoCategorias.data.datasets[0].data = [];
            graficoCategorias.data.datasets[0]
                .backgroundColor = [];
            graficoCategorias.update();
        }

        return;
    }

    dados.slice(0, 6).forEach((item, indice) => {
        const percentual = total > 0
            ? (item.total / total) * 100
            : 0;

        elementos.rankingCategorias
            .insertAdjacentHTML(
                'beforeend',
                `
                    <article class="ranking-categoria-item">
                        <span
                            class="ranking-categoria-posicao"
                            style="--ranking-cor: ${item.cor};"
                        >
                            ${indice + 1}
                        </span>

                        <div class="ranking-categoria-info">
                            <div>
                                <strong>${escaparHTML(item.nome)}</strong>
                                <span>${item.quantidade} ${item.quantidade === 1 ? 'lançamento' : 'lançamentos'}</span>
                            </div>

                            <div class="ranking-categoria-valores">
                                <strong>R$ ${formatarMoeda(item.total)}</strong>
                                <span>${percentual.toFixed(1).replace('.', ',')}%</span>
                            </div>
                        </div>
                    </article>
                `
            );
    });

    if (dados.length > 6) {
        elementos.rankingCategorias
            .insertAdjacentHTML(
                'beforeend',
                `
                    <p class="ranking-categorias-restante">
                        Mais ${dados.length - 6} categorias incluídas no gráfico.
                    </p>
                `
            );
    }

    if (graficoCategorias) {
        const principais = dados.slice(0, 6);
        const restantes = dados.slice(6);
        const dadosGrafico = [...principais];

        if (restantes.length > 0) {
            dadosGrafico.push({
                nome: 'Outras',
                cor: '#59657a',
                total: restantes.reduce(
                    (soma, item) =>
                        soma + item.total,
                    0
                )
            });
        }

        graficoCategorias.data.labels =
            dadosGrafico.map(item => item.nome);

        graficoCategorias.data.datasets[0].data =
            dadosGrafico.map(item => item.total);

        graficoCategorias.data.datasets[0]
            .backgroundColor =
                dadosGrafico.map(item => item.cor);

        graficoCategorias.update();
    }
}

    function renderizarTela() {
        renderizarCategorias();
        renderizarRecorrencias();
        renderizarRelatorioCategorias();
        renderizarContas();
        renderizarCartoes();
        if (elementos.competenciaPainel) {
    elementos.competenciaPainel.value =
        competenciaPainelSelecionada;
}

if (elementos.tituloCompetenciaPainel) {
    elementos.tituloCompetenciaPainel.textContent =
        formatarTituloCompetencia(
            competenciaPainelSelecionada
        );
}
        estado.totalSalario = 0;
        estado.totalGuardado = 0;
        estado.totalFixo = 0;
        estado.totalVariavel = 0;

        const saldosCaixinhas = {};

caixinhas.forEach(caixinha => {
    saldosCaixinhas[caixinha.id] = 0;
});

// O saldo das caixinhas é acumulado.
// Ele não deve reiniciar quando o mês do painel muda.
transacoes.forEach(transacao => {
    const caixinhaId =
        transacao.caixinhaId;

    if (
        saldosCaixinhas[caixinhaId] ===
        undefined
    ) {
        return;
    }

    if (transacao.tipo === 'guardado') {
        saldosCaixinhas[caixinhaId] +=
            Number(transacao.valor) || 0;
    }

    if (transacao.tipo === 'resgate') {
        saldosCaixinhas[caixinhaId] -=
            Number(transacao.valor) || 0;
    }
});

const transacoesDaCompetencia =
    transacoes.filter(transacao => {
        return (
            obterCompetenciaTransacao(
                transacao
            ) === competenciaPainelSelecionada
        );
    });

// Os cards financeiros representam somente o mês selecionado.
transacoesDaCompetencia.forEach(transacao => {
    const valor = Number(transacao.valor) || 0;

    if (transacao.tipo === 'salario') {
        estado.totalSalario += valor;
    } else if (transacao.tipo === 'guardado') {
        estado.totalGuardado += valor;
    } else if (transacao.tipo === 'resgate') {
        estado.totalGuardado -= valor;
    } else if (transacao.tipo === 'fixo') {
        estado.totalFixo += valor;
    } else if (transacao.tipo === 'variavel') {
        estado.totalVariavel += valor;
    }
});

        estado.sobraTotal =
            estado.totalSalario -
            estado.totalFixo -
            estado.totalVariavel -
            estado.totalGuardado;

        elementos.painelSalario.innerText = `R$ ${formatarMoeda(estado.totalSalario)}`;
        elementos.painelGuardado.innerText = `R$ ${formatarMoeda(estado.totalGuardado)}`;
        elementos.painelFixo.innerText = `R$ ${formatarMoeda(estado.totalFixo)}`;
        elementos.painelVariavel.innerText = `R$ ${formatarMoeda(estado.totalVariavel)}`;

  if (elementos.caixinhasGrid) {
    elementos.caixinhasGrid.innerHTML = '';

    let atualizouAvisoMeta = false;

    caixinhas.forEach(caixinha => {
        const saldoCaixinha =
            saldosCaixinhas[caixinha.id] || 0;

        const metaCaixinha =
            Number(caixinha.meta) || 0;

        const possuiMeta = metaCaixinha > 0;

        const porcentagemReal = possuiMeta
            ? (saldoCaixinha / metaCaixinha) * 100
            : 0;

        const porcentagemExibida = Math.max(
            0,
            Math.round(porcentagemReal)
        );

        const larguraProgresso = Math.min(
            porcentagemExibida,
            100
        );

        const metaAtingida =
            possuiMeta &&
            saldoCaixinha >= metaCaixinha;

        if (
            metaAtingida &&
            !caixinha.metaAtingidaAvisada
        ) {
            caixinha.metaAtingidaAvisada = true;
            atualizouAvisoMeta = true;

            setTimeout(() => {
                mostrarToast(
                    `Meta da caixinha "${caixinha.nome}" atingida!`,
                    'sucesso'
                );
            }, 0);
        }

        if (
            !metaAtingida &&
            caixinha.metaAtingidaAvisada
        ) {
            caixinha.metaAtingidaAvisada = false;
            atualizouAvisoMeta = true;
        }

        const textoMeta = possuiMeta
            ? `R$ ${formatarMoeda(metaCaixinha)}`
            : 'Não definida';

        const textoPorcentagem = possuiMeta
            ? `${porcentagemExibida}%`
            : '0%';

        const icone = obterIconeCaixinha(
            caixinha.icone
        );

        const cor = obterCorCaixinha(
            caixinha.cor
        );

        const prazoFormatado = formatarPrazoCaixinha(
            caixinha.prazo
        );

        const prazoHTML = prazoFormatado
            ? `
                <span class="caixinha-prazo">
                    <i class="fa-regular fa-calendar"></i>
                    Até ${prazoFormatado}
                </span>
            `
            : '';

        const metaAtingidaHTML = metaAtingida
            ? `
                <span class="caixinha-concluida">
                    <i class="fa-solid fa-check"></i>
                    Meta atingida
                </span>
            `
            : '';

        elementos.caixinhasGrid.insertAdjacentHTML(
            'beforeend',
            `
                <article
                    class="caixinha-card"
                    style="--caixinha-cor: ${cor};"
                >
                    <div class="caixinha-card-header">
                        <div class="caixinha-identidade">
                            <span class="caixinha-icone">
                                <i class="fa-solid ${icone}"></i>
                            </span>

                            <div class="caixinha-titulo-area">
                                <h3>
                                    ${escaparHTML(caixinha.nome)}
                                </h3>

                                ${prazoHTML}
                            </div>
                        </div>

                        <div class="caixinha-acoes">
                            <button
                                class="btn-acao-caixinha"
                                type="button"
                                data-acao="editar"
                                data-caixinha-id="${caixinha.id}"
                                title="Editar caixinha"
                                aria-label="Editar ${escaparHTML(caixinha.nome)}"
                            >
                                <i class="fa-solid fa-pen"></i>
                            </button>

                            <button
                                class="btn-acao-caixinha btn-acao-excluir"
                                type="button"
                                data-acao="excluir"
                                data-caixinha-id="${caixinha.id}"
                                title="Excluir caixinha"
                                aria-label="Excluir ${escaparHTML(caixinha.nome)}"
                            >
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>

                    ${metaAtingidaHTML}

                    <div class="caixinha-valores">
                        <div>
                            <span class="caixinha-valor-label">
                                Saldo atual
                            </span>

                            <strong class="saldo">
                                R$ ${formatarMoeda(saldoCaixinha)}
                            </strong>
                        </div>

                        <div class="caixinha-meta-valor">
                            <span>Meta</span>
                            <strong>${textoMeta}</strong>
                        </div>
                    </div>

                    <div class="caixinha-progresso-area">
                        <div class="caixinha-progresso-info">
                            <span>Progresso</span>
                            <strong>${textoPorcentagem}</strong>
                        </div>

                        <div
                            class="caixinha-progresso"
                            role="progressbar"
                            aria-valuemin="0"
                            aria-valuemax="100"
                            aria-valuenow="${larguraProgresso}"
                            aria-label="Progresso da caixinha ${escaparHTML(caixinha.nome)}"
                        >
                            <div
                                class="caixinha-progresso-preenchimento"
                                style="width: ${larguraProgresso}%"
                            ></div>
                        </div>
                    </div>
                </article>
            `
        );
    });

    if (atualizouAvisoMeta) {
        salvarNoBanco();
    }
}

        if (elementos.caixinhaSelect) {
            elementos.caixinhaSelect.innerHTML = '';

            caixinhas.forEach(caixinha => {
                elementos.caixinhaSelect.innerHTML += `
                    <option value="${caixinha.id}">${escaparHTML(caixinha.nome)}</option>
                `;
            });
        }

        if (graficoApp) {
            const salario = estado.totalSalario;

            const percDespesas = salario > 0
                ? ((estado.totalFixo + estado.totalVariavel) / salario) * 100
                : 0;

            const percGuardado = salario > 0
                ? Math.max((estado.totalGuardado / salario) * 100, 0)
                : 0;

            let percSobra = salario > 0
                ? (estado.sobraTotal / salario) * 100
                : 100;

            if (percSobra < 0) percSobra = 0;

            graficoApp.data.datasets[0].data = [
                percDespesas,
                percGuardado,
                percSobra
            ];

            graficoApp.update();
        }

        if (elementos.sobraFlutuante) {
            elementos.sobraFlutuante.innerHTML = estado.sobraTotal < 0
                ? `🚨 Faltando: <span class="text-red">R$ ${formatarMoeda(Math.abs(estado.sobraTotal))}</span>`
                : `💰 Sobra Atual: <span class="text-green">R$ ${formatarMoeda(estado.sobraTotal)}</span>`;

            elementos.sobraFlutuante.style.borderColor = estado.sobraTotal < 0 ? '#e74c3c' : '#18bc9c';
        }

        renderizarHistorico();
    }

// ==========================================
// SISTEMA DE NOTIFICAÇÕES TOAST
// ==========================================
function mostrarToast(mensagem, tipo = 'sucesso') {
    let container = document.querySelector('.toast-container');

    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icones = {
        sucesso: '✓',
        erro: '!',
        aviso: '⚠',
        info: 'i'
    };

    const toast = document.createElement('div');

    toast.className = `toast toast-${tipo}`;

    toast.innerHTML = `
        <span class="toast-icon">
            ${icones[tipo] || icones.info}
        </span>

        <span class="toast-message"></span>
    `;

    toast.querySelector('.toast-message').textContent = mensagem;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('is-visible');
    });

    const removerToast = () => {
        toast.classList.remove('is-visible');
        toast.classList.add('is-removing');

        setTimeout(() => {
            toast.remove();

            if (container.children.length === 0) {
                container.remove();
            }
        }, 300);
    };

    const tempoParaFechar = setTimeout(removerToast, 3500);

    toast.addEventListener('click', () => {
        clearTimeout(tempoParaFechar);
        removerToast();
    });
}
    // ==========================================
// 3. GERENCIAMENTO DAS CAIXINHAS
// ==========================================
function limparFormularioCaixinha() {
    elementos.caixinhaEmEdicaoId.value = '';
    elementos.nomeCaixinha.value = '';
    elementos.metaCaixinha.value = '';
    elementos.iconeCaixinha.value = 'piggy-bank';
    elementos.corCaixinha.value = 'dourado';
    elementos.prazoCaixinha.value = '';
}

function abrirModalCaixinha(caixinha = null) {
    limparFormularioCaixinha();

    if (caixinha) {
        elementos.caixinhaEmEdicaoId.value =
            String(caixinha.id);

        elementos.nomeCaixinha.value =
            caixinha.nome || '';

        elementos.metaCaixinha.value =
            Number(caixinha.meta) || '';

        elementos.iconeCaixinha.value =
            caixinha.icone || 'piggy-bank';

        elementos.corCaixinha.value =
            caixinha.cor || 'dourado';

        elementos.prazoCaixinha.value =
            caixinha.prazo || '';

        elementos.tituloModalCaixinha.textContent =
            'Editar caixinha';

        elementos.btnSalvarCaixinha.textContent =
            'Salvar alterações';
    } else {
        elementos.tituloModalCaixinha.textContent =
            'Criar nova caixinha';

        elementos.btnSalvarCaixinha.textContent =
            'Criar caixinha';
    }

    elementos.modalCaixinha.style.display = 'flex';
    elementos.modalCaixinha.setAttribute(
        'aria-hidden',
        'false'
    );

    setTimeout(() => {
        elementos.nomeCaixinha.focus();
    }, 50);
}

function fecharModalCaixinha() {
    elementos.modalCaixinha.style.display = 'none';
    elementos.modalCaixinha.setAttribute(
        'aria-hidden',
        'true'
    );

    limparFormularioCaixinha();
}

function salvarCaixinha() {
    const nome =
        elementos.nomeCaixinha.value.trim();

    const meta =
        Number(elementos.metaCaixinha.value);

    const icone =
        elementos.iconeCaixinha.value;

    const cor =
        elementos.corCaixinha.value;

    const prazo =
        elementos.prazoCaixinha.value;

    const idEmEdicao =
        Number(elementos.caixinhaEmEdicaoId.value);

    if (!nome) {
        mostrarToast(
            'Informe o nome da caixinha.',
            'aviso'
        );

        elementos.nomeCaixinha.focus();
        return;
    }

    if (nome.length > 40) {
        mostrarToast(
            'O nome deve ter no máximo 40 caracteres.',
            'aviso'
        );

        elementos.nomeCaixinha.focus();
        return;
    }

    if (!Number.isFinite(meta) || meta <= 0) {
        mostrarToast(
            'Informe uma meta maior que zero.',
            'aviso'
        );

        elementos.metaCaixinha.focus();
        return;
    }

    if (!ICONES_CAIXINHA[icone]) {
        mostrarToast(
            'Selecione um ícone válido.',
            'erro'
        );

        return;
    }

    if (!CORES_CAIXINHA[cor]) {
        mostrarToast(
            'Selecione uma cor válida.',
            'erro'
        );

        return;
    }

    if (idEmEdicao) {
        const caixinha = caixinhas.find(
            item => Number(item.id) === idEmEdicao
        );

        if (!caixinha) {
            mostrarToast(
                'Não foi possível localizar a caixinha.',
                'erro'
            );

            fecharModalCaixinha();
            return;
        }

        const metaAnterior =
            Number(caixinha.meta) || 0;

        caixinha.nome = nome;
        caixinha.meta = meta;
        caixinha.icone = icone;
        caixinha.cor = cor;
        caixinha.prazo = prazo;

        if (metaAnterior !== meta) {
            caixinha.metaAtingidaAvisada = false;
        }

        salvarNoBanco();
        fecharModalCaixinha();
        renderizarTela();

        mostrarToast(
            'Caixinha atualizada com sucesso.',
            'sucesso'
        );

        return;
    }

    caixinhas.push({
        id: gerarIdUnico(),
        nome: nome,
        meta: meta,
        icone: icone,
        cor: cor,
        prazo: prazo,
        criadaEm: new Date().toISOString(),
        metaAtingidaAvisada: false
    });

    salvarNoBanco();
    fecharModalCaixinha();
    renderizarTela();

    mostrarToast(
        'Caixinha criada com sucesso.',
        'sucesso'
    );
}

function possuiMovimentacoesNaCaixinha(id) {
    return transacoes.some(transacao => {
        return (
            Number(transacao.caixinhaId) === Number(id) &&
            (
                transacao.tipo === 'guardado' ||
                transacao.tipo === 'resgate'
            )
        );
    });
}

function solicitarExclusaoCaixinha(id) {
    const caixinha = caixinhas.find(
        item => Number(item.id) === Number(id)
    );

    if (!caixinha) {
        mostrarToast(
            'Caixinha não encontrada.',
            'erro'
        );

        return;
    }

    if (possuiMovimentacoesNaCaixinha(id)) {
        mostrarToast(
            'Esta caixinha possui movimentações e não pode ser excluída.',
            'aviso'
        );

        return;
    }

    caixinhaPendenteExclusaoId = Number(id);

    elementos.textoExcluirCaixinha.textContent =
        `A caixinha "${caixinha.nome}" será excluída permanentemente.`;

    elementos.modalExcluirCaixinha.style.display =
        'flex';

    elementos.modalExcluirCaixinha.setAttribute(
        'aria-hidden',
        'false'
    );
}

function fecharModalExclusaoCaixinha() {
    caixinhaPendenteExclusaoId = null;

    elementos.modalExcluirCaixinha.style.display =
        'none';

    elementos.modalExcluirCaixinha.setAttribute(
        'aria-hidden',
        'true'
    );
}

function confirmarExclusaoCaixinha() {
    if (!caixinhaPendenteExclusaoId) {
        fecharModalExclusaoCaixinha();
        return;
    }

    const id = caixinhaPendenteExclusaoId;

    if (possuiMovimentacoesNaCaixinha(id)) {
        fecharModalExclusaoCaixinha();

        mostrarToast(
            'A caixinha recebeu uma movimentação e não pode mais ser excluída.',
            'aviso'
        );

        return;
    }

    caixinhas = caixinhas.filter(
        caixinha => Number(caixinha.id) !== id
    );

    salvarNoBanco();
    fecharModalExclusaoCaixinha();
    renderizarTela();

    mostrarToast(
        'Caixinha excluída com sucesso.',
        'sucesso'
    );
}

elementos.btnNovaCaixinha.addEventListener(
    'click',
    () => abrirModalCaixinha()
);

elementos.btnSalvarCaixinha.addEventListener(
    'click',
    salvarCaixinha
);

elementos.btnCancelarCaixinha.addEventListener(
    'click',
    fecharModalCaixinha
);

elementos.btnFecharModalCaixinha.addEventListener(
    'click',
    fecharModalCaixinha
);

elementos.btnCancelarExclusaoCaixinha.addEventListener(
    'click',
    fecharModalExclusaoCaixinha
);

elementos.btnConfirmarExclusaoCaixinha.addEventListener(
    'click',
    confirmarExclusaoCaixinha
);

elementos.caixinhasGrid.addEventListener(
    'click',
    evento => {
        const botao = evento.target.closest(
            '[data-acao][data-caixinha-id]'
        );

        if (!botao) {
            return;
        }

        const id = Number(
            botao.dataset.caixinhaId
        );

        const acao = botao.dataset.acao;

        if (acao === 'editar') {
            const caixinha = caixinhas.find(
                item => Number(item.id) === id
            );

            if (!caixinha) {
                mostrarToast(
                    'Caixinha não encontrada.',
                    'erro'
                );

                return;
            }

            abrirModalCaixinha(caixinha);
            return;
        }

        if (acao === 'excluir') {
            solicitarExclusaoCaixinha(id);
        }
    }
);

elementos.modalCaixinha.addEventListener(
    'click',
    evento => {
        if (evento.target === elementos.modalCaixinha) {
            fecharModalCaixinha();
        }
    }
);

elementos.modalExcluirCaixinha.addEventListener(
    'click',
    evento => {
        if (
            evento.target ===
            elementos.modalExcluirCaixinha
        ) {
            fecharModalExclusaoCaixinha();
        }
    }
);

document.addEventListener('keydown', evento => {
    if (evento.key !== 'Escape') {
        return;
    }

    if (
        elementos.modalCaixinha.style.display ===
        'flex'
    ) {
        fecharModalCaixinha();
    }

    if (
        elementos.modalExcluirCaixinha.style.display ===
        'flex'
    ) {
        fecharModalExclusaoCaixinha();
    }
});

    // ==========================================
    // 4. LÓGICA DO MODAL
    // ==========================================
const modalOverlay = document.getElementById(
    'modalLancamento'
);

const tipoLancamento = document.getElementById(
    'tipoLancamento'
);

const areaCaixinha = document.getElementById(
    'areaCaixinha'
);

const areaCategoria = document.getElementById(
    'areaCategoria'
);

const categoriaLancamento = document.getElementById(
    'categoriaLancamento'
);

const contaLancamento = document.getElementById(
    'contaLancamento'
);

function obterCategoriasAtivasPorTipo(tipo) {
    return categorias
        .filter(categoria => {
            if (
                !categoria.ativa ||
                categoria.tipo !== tipo
            ) {
                return false;
            }

            if (!categoria.categoriaPaiId) {
                return true;
            }

            const categoriaPai =
                obterCategoriaPorId(
                    categoria.categoriaPaiId
                );

            return Boolean(
                categoriaPai &&
                categoriaPai.ativa
            );
        })
        .sort((a, b) => {
            if (
                a.categoriaPaiId ===
                b.categoriaPaiId
            ) {
                return a.nome.localeCompare(
                    b.nome,
                    'pt-BR'
                );
            }

            if (!a.categoriaPaiId) return -1;
            if (!b.categoriaPaiId) return 1;

            return a.nome.localeCompare(
                b.nome,
                'pt-BR'
            );
        });
}

function obterCategoriaPorId(categoriaId) {
    return categorias.find(categoria => {
        return String(categoria.id) ===
            String(categoriaId);
    }) || null;
}

function preencherSeletorCategorias(
    seletor,
    tipo,
    categoriaSelecionadaId = null
) {
    seletor.innerHTML =
        '<option value="">Sem categoria</option>';

    const categoriasDisponiveis =
        obterCategoriasAtivasPorTipo(tipo);

    categoriasDisponiveis.forEach(categoria => {
        const opcao =
            document.createElement('option');

        opcao.value = categoria.id;
        const categoriaPai =
            categoria.categoriaPaiId
                ? obterCategoriaPorId(
                    categoria.categoriaPaiId
                )
                : null;

        opcao.textContent = categoriaPai
            ? `${categoriaPai.nome} › ${categoria.nome}`
            : categoria.nome;

        seletor.appendChild(opcao);
    });

    const categoriaSelecionadaExiste =
        categoriasDisponiveis.some(categoria => {
            return String(categoria.id) ===
                String(categoriaSelecionadaId);
        });

    if (categoriaSelecionadaExiste) {
        seletor.value =
            String(categoriaSelecionadaId);
    }
}

const areaRecorrencia = document.getElementById(
    'areaRecorrencia'
);

const isRecorrente = document.getElementById(
    'isRecorrente'
);

const configuracaoRecorrencia = document.getElementById(
    'configuracaoRecorrencia'
);

const diaVencimentoRecorrencia = document.getElementById(
    'diaVencimentoRecorrencia'
);

const competenciaInicialRecorrencia =
    document.getElementById(
        'competenciaInicialRecorrencia'
    );

const tipoTerminoRecorrencia = document.getElementById(
    'tipoTerminoRecorrencia'
);

const grupoQuantidadeRecorrencia =
    document.getElementById(
        'grupoQuantidadeRecorrencia'
    );

const quantidadeRecorrencia = document.getElementById(
    'quantidadeRecorrencia'
);

const grupoCompetenciaFinalRecorrencia =
    document.getElementById(
        'grupoCompetenciaFinalRecorrencia'
    );

const competenciaFinalRecorrencia =
    document.getElementById(
        'competenciaFinalRecorrencia'
    );function atualizarCamposTerminoRecorrencia() {
    const tipoTermino = tipoTerminoRecorrencia.value;

    grupoQuantidadeRecorrencia.hidden =
        tipoTermino !== 'quantidade';

    grupoCompetenciaFinalRecorrencia.hidden =
        tipoTermino !== 'competencia';
}

function atualizarConfiguracaoRecorrencia() {
    configuracaoRecorrencia.hidden =
        !isRecorrente.checked;
}

function limparFormularioRecorrencia() {
    const hoje = new Date();

    isRecorrente.checked = false;
    configuracaoRecorrencia.hidden = true;

    diaVencimentoRecorrencia.value =
        String(hoje.getDate());

    competenciaInicialRecorrencia.value =
        obterCompetenciaAtual();

    competenciaInicialRecorrencia.min =
        obterCompetenciaAtual();

    tipoTerminoRecorrencia.value = 'nunca';

    quantidadeRecorrencia.value = '';
    competenciaFinalRecorrencia.value = '';

    competenciaFinalRecorrencia.min =
        obterCompetenciaAtual();

    atualizarCamposTerminoRecorrencia();
}

isRecorrente.addEventListener(
    'change',
    atualizarConfiguracaoRecorrencia
);

tipoTerminoRecorrencia.addEventListener(
    'change',
    atualizarCamposTerminoRecorrencia
);

competenciaInicialRecorrencia.addEventListener(
    'change',
    () => {
        competenciaFinalRecorrencia.min =
            competenciaInicialRecorrencia.value ||
            obterCompetenciaAtual();
    }
);
const floatingActions = document.getElementById('floatingActions');
const btnFloatingMenu = document.getElementById('btnFloatingMenu');
const floatingMenu = document.getElementById('floatingMenu');

function fecharMenuFlutuante() {
    if (!floatingActions || !btnFloatingMenu) return;

    floatingActions.classList.remove('is-open');
    btnFloatingMenu.setAttribute('aria-expanded', 'false');
    btnFloatingMenu.setAttribute(
        'aria-label',
        'Abrir menu de lançamentos'
    );
}

function alternarMenuFlutuante() {
    if (!floatingActions || !btnFloatingMenu) return;

    const menuEstaAberto = floatingActions.classList.toggle('is-open');

    btnFloatingMenu.setAttribute(
        'aria-expanded',
        String(menuEstaAberto)
    );

    btnFloatingMenu.setAttribute(
        'aria-label',
        menuEstaAberto
            ? 'Fechar menu de lançamentos'
            : 'Abrir menu de lançamentos'
    );
}

if (btnFloatingMenu) {
    btnFloatingMenu.addEventListener('click', function(evento) {
        evento.stopPropagation();
        alternarMenuFlutuante();
    });
}

if (floatingMenu) {
    floatingMenu.addEventListener('click', function(evento) {
        evento.stopPropagation();

        const opcaoClicada = evento.target.closest('.floating-option');

        if (opcaoClicada) {
            fecharMenuFlutuante();
        }
    });
}

document.addEventListener('click', function(evento) {
    if (
        floatingActions &&
        !floatingActions.contains(evento.target)
    ) {
        fecharMenuFlutuante();
    }
});

document.addEventListener('keydown', function(evento) {
    if (evento.key === 'Escape') {
        fecharMenuFlutuante();
    }
});

    function abrirModal(tipo, titulo) {
        tipoLancamento.value = tipo; 
       tipoLancamento.value = tipo;
document.getElementById('modalTitle').innerText = titulo;

limparFormularioRecorrencia();

const permiteRecorrencia = [
    'fixo',
    'variavel'
].includes(tipo);

const permiteCategoria = [
    'salario',
    'fixo',
    'variavel'
].includes(tipo);

areaCategoria.style.display =
    permiteCategoria ? 'block' : 'none';

if (permiteCategoria) {
    preencherSeletorCategorias(
        categoriaLancamento,
        tipo
    );
}

preencherSeletorContas(contaLancamento);

areaRecorrencia.style.display =
    permiteRecorrencia ? 'block' : 'none';
   
        document.getElementById('areaPagamento').style.display = (tipo === 'fixo' || tipo === 'variavel') ? 'block' : 'none';
        
        
        // Mostra a seleção de caixinha apenas se for guardar ou resgatar dinheiro
        areaCaixinha.style.display = (tipo === 'guardado' || tipo === 'resgate') ? 'block' : 'none';
        
        modalOverlay.style.display = 'flex';
modalOverlay.setAttribute('aria-hidden', 'false');
    }

    const btnCancelarLancamento = document.getElementById(
    'btnCancelarLancamento'
);

function fecharModalLancamento() {
    modalOverlay.style.display = 'none';
    modalOverlay.setAttribute(
        'aria-hidden',
        'true'
    );

    document.getElementById('descricao').value = '';
    document.getElementById('valor').value = '';

    limparFormularioRecorrencia();
}

btnCancelarLancamento.addEventListener(
    'click',
    fecharModalLancamento
);

    document.querySelector('.btn-salary').addEventListener('click', () => abrirModal('salario', 'Inserir Receita'));
    document.querySelector('.btn-saved').addEventListener('click', () => abrirModal('guardado', 'Guardar Dinheiro'));
    document.querySelector('.btn-fixed').addEventListener('click', () => abrirModal('fixo', 'Adicionar Gasto Fixo'));
    document.querySelector('.btn-variable').addEventListener('click', () => abrirModal('variavel', 'Adicionar Gasto Variável'));
    document.querySelector('.btn-rescue').addEventListener('click', () => abrirModal('resgate', 'Resgatar Dinheiro')); 
    document.querySelector('.btn-travel').addEventListener('click', () => abrirModal('resgate', 'Usar Lazer/Casa')); 
    

    // ==========================================
    // 5. SALVAR NOVO LANÇAMENTO
    // ==========================================
    function calcularSaldoCaixinha(caixinhaId) {
    return transacoes.reduce((saldo, transacao) => {
        const pertenceACaixinha =
            Number(transacao.caixinhaId) === Number(caixinhaId);

        if (!pertenceACaixinha) {
            return saldo;
        }

        if (transacao.tipo === 'guardado') {
            return saldo + transacao.valor;
        }

        if (transacao.tipo === 'resgate') {
            return saldo - transacao.valor;
        }

        return saldo;
    }, 0);
}
document
    .getElementById('btnSalvarLancamento')
    .addEventListener('click', function() {
        const tipo = tipoLancamento.value;

        const descricao = document
            .getElementById('descricao')
            .value
            .trim();

        const valor = Number(
            document.getElementById('valor').value
        );

        const contaId = contaLancamento.value;
        const contaSelecionada =
            obterContaPorId(contaId);

        const caixinhaId = Number(
            document.getElementById(
                'caixinhaSelect'
            ).value
        );

        const permiteCategoria = [
            'salario',
            'fixo',
            'variavel'
        ].includes(tipo);

        const categoriaId = permiteCategoria
            ? categoriaLancamento.value || null
            : null;

        const categoriaSelecionada =
            permiteCategoria
                ? obterCategoriaPorId(categoriaId)
                : null;

        if (!descricao || !Number.isFinite(valor) || valor <= 0) {
            mostrarToast(
                'Preencha a descrição e informe um valor válido.',
                'aviso'
            );

            return;
        }

        if (
            !contaSelecionada ||
            !contaSelecionada.ativa ||
            contaSelecionada.arquivada
        ) {
            mostrarToast(
                'Selecione uma conta ativa.',
                'aviso'
            );
            return;
        }

        if (
            permiteCategoria &&
            categoriaId &&
            (
                !categoriaSelecionada ||
                !categoriaSelecionada.ativa ||
                categoriaSelecionada.tipo !== tipo
            )
        ) {
            mostrarToast(
                'Selecione uma categoria válida.',
                'aviso'
            );

            categoriaLancamento.focus();
            return;
        }

        if (
            (tipo === 'guardado' || tipo === 'resgate') &&
            !caixinhaId
        ) {
            mostrarToast(
                'Crie uma caixinha antes de realizar esta operação.',
                'aviso'
            );

            return;
        }

        if (tipo === 'resgate') {
            const saldoDisponivel =
                calcularSaldoCaixinha(caixinhaId);

            if (valor > saldoDisponivel) {
                mostrarToast(
                    `Saldo insuficiente. Disponível: R$ ${formatarMoeda(saldoDisponivel)}.`,
                    'erro'
                );

                return;
            }
        }

        const recorrente =
            areaRecorrencia.style.display !== 'none' &&
            isRecorrente.checked;

        let dadosTermino = {
            tipo: 'nunca',
            quantidade: null,
            competenciaFinal: null
        };

        let competenciaInicial = null;
        let diaVencimento = null;

        if (recorrente) {
            diaVencimento = Number(
                diaVencimentoRecorrencia.value
            );

            competenciaInicial =
                competenciaInicialRecorrencia.value;

            const tipoTermino =
                tipoTerminoRecorrencia.value;

            if (
                !Number.isInteger(diaVencimento) ||
                diaVencimento < 1 ||
                diaVencimento > 31
            ) {
                mostrarToast(
                    'Informe um dia de vencimento entre 1 e 31.',
                    'aviso'
                );

                diaVencimentoRecorrencia.focus();
                return;
            }

            if (!competenciaInicial) {
                mostrarToast(
                    'Informe o mês inicial da recorrência.',
                    'aviso'
                );

                competenciaInicialRecorrencia.focus();
                return;
            }

            if (
                competenciaInicial <
                obterCompetenciaAtual()
            ) {
                mostrarToast(
                    'O início da recorrência não pode estar no passado.',
                    'aviso'
                );

                competenciaInicialRecorrencia.focus();
                return;
            }

            if (tipoTermino === 'quantidade') {
                const quantidade = Number(
                    quantidadeRecorrencia.value
                );

                if (
                    !Number.isInteger(quantidade) ||
                    quantidade < 1 ||
                    quantidade > 600
                ) {
                    mostrarToast(
                        'Informe uma quantidade entre 1 e 600 meses.',
                        'aviso'
                    );

                    quantidadeRecorrencia.focus();
                    return;
                }

                dadosTermino = {
                    tipo: 'quantidade',
                    quantidade,
                    competenciaFinal: null
                };
            }

            if (tipoTermino === 'competencia') {
                const competenciaFinal =
                    competenciaFinalRecorrencia.value;

                if (!competenciaFinal) {
                    mostrarToast(
                        'Informe o último mês da recorrência.',
                        'aviso'
                    );

                    competenciaFinalRecorrencia.focus();
                    return;
                }

                if (
                    competenciaFinal <
                    competenciaInicial
                ) {
                    mostrarToast(
                        'O mês final não pode ser anterior ao mês inicial.',
                        'aviso'
                    );

                    competenciaFinalRecorrencia.focus();
                    return;
                }

                dadosTermino = {
                    tipo: 'competencia',
                    quantidade: null,
                    competenciaFinal
                };
            }
        }

        let categoriaText = '';
        let classeCor = '';
        let sinal = '';

        if (tipo === 'salario') {
            categoriaText = 'Salário';
            classeCor = 'amount-pos';
            sinal = '+';
        } else if (tipo === 'guardado') {
            categoriaText = 'Reserva';
            classeCor = 'amount-pos';
            sinal = '+';
        } else if (tipo === 'resgate') {
            categoriaText = 'Uso da Reserva';
            classeCor = 'amount-neg';
            sinal = '-';
        } else if (tipo === 'fixo') {
            categoriaText = 'Gasto Fixo';
            classeCor = 'amount-neg';
            sinal = '-';
        } else if (tipo === 'variavel') {
            categoriaText = 'Gasto Variável';
            classeCor = 'amount-neg';
            sinal = '-';
        }

        const agora = new Date();
        const competenciaAtual =
            obterCompetenciaAtual();

        let recorrenciaId = null;

        if (recorrente) {
            recorrenciaId = gerarIdUnico();

            const processarCompetenciaAtual =
                competenciaInicial === competenciaAtual;

            recorrencias.push({
                id: recorrenciaId,
                status: 'ativa',
                frequencia: 'mensal',
                descricao,
                valor,
                tipoLancamento: tipo,
                categoriaId: categoriaId || null,
                contaId,
                pagamento: '',
                caixinhaId: null,
                diaVencimento,
                competenciaInicial,
                termino: dadosTermino,
                competenciasProcessadas:
                    processarCompetenciaAtual
                        ? [competenciaAtual]
                        : [],
                criadaEm: agora.toISOString(),
                atualizadaEm: agora.toISOString()
            });

            if (!processarCompetenciaAtual) {
                salvarNoBanco();
                fecharModalLancamento();

                mostrarToast(
                    'Recorrência criada para começar no mês escolhido.',
                    'sucesso'
                );

                return;
            }
        }

        transacoes.push({
            id: gerarIdUnico(),
            tipo,
            contaId,
            caixinhaId:
                tipo === 'guardado' ||
                tipo === 'resgate'
                    ? caixinhaId
                    : null,
            descricao,
            valor,
            data:
                `${String(agora.getDate()).padStart(2, '0')}/` +
                `${String(agora.getMonth() + 1).padStart(2, '0')}/` +
                `${agora.getFullYear()}`,
            competencia: competenciaAtual,
            recorrenciaId,
            origem: recorrente
                ? 'recorrencia'
                : 'manual',
            categoriaText,
            categoriaId: categoriaId || null,
            categoriaNome:
                categoriaSelecionada
                    ? categoriaSelecionada.nome
                    : '',
            classeCor,
            sinal,
            isPago:
                document.getElementById('isPago')
                    ? document.getElementById(
                        'isPago'
                    ).checked
                    : false
        });

        salvarNoBanco();
        renderizarTela();
        fecharModalLancamento();

        const mensagensSucesso = {
            salario:
                'Receita adicionada com sucesso.',
            guardado:
                'Dinheiro guardado com sucesso.',
            resgate:
                'Resgate realizado com sucesso.',
            fixo:
                'Gasto fixo adicionado com sucesso.',
            variavel:
                'Gasto variável adicionado com sucesso.'
        };

        mostrarToast(
            recorrente
                ? 'Lançamento e recorrência criados com sucesso.'
                : mensagensSucesso[tipo] ||
                    'Lançamento salvo com sucesso.',
            'sucesso'
        );
    });
    // ==========================================
// 6. PROCESSAMENTO DAS RECORRÊNCIAS MENSAIS
// ==========================================
function converterCompetenciaEmData(competencia) {
    const [ano, mes] = String(competencia)
        .split('-')
        .map(Number);

    if (
        !Number.isInteger(ano) ||
        !Number.isInteger(mes) ||
        mes < 1 ||
        mes > 12
    ) {
        return null;
    }

    return new Date(ano, mes - 1, 1);
}

function adicionarMesesCompetencia(
    competencia,
    quantidadeMeses
) {
    const data = converterCompetenciaEmData(
        competencia
    );

    if (!data) {
        return '';
    }

    data.setMonth(
        data.getMonth() + quantidadeMeses
    );

    return (
        `${data.getFullYear()}-` +
        `${String(data.getMonth() + 1).padStart(2, '0')}`
    );
}

function calcularDistanciaEntreCompetencias(
    competenciaInicial,
    competenciaFinal
) {
    const inicio = converterCompetenciaEmData(
        competenciaInicial
    );

    const fim = converterCompetenciaEmData(
        competenciaFinal
    );

    if (!inicio || !fim) {
        return -1;
    }

    return (
        (fim.getFullYear() - inicio.getFullYear()) * 12 +
        (fim.getMonth() - inicio.getMonth())
    );
}

function obterUltimoDiaDoMes(
    competencia,
    diaDesejado
) {
    const data = converterCompetenciaEmData(
        competencia
    );

    if (!data) {
        return null;
    }

    const ano = data.getFullYear();
    const mes = data.getMonth();

    const ultimoDia = new Date(
        ano,
        mes + 1,
        0
    ).getDate();

    const dia = Math.min(
        Math.max(Number(diaDesejado) || 1, 1),
        ultimoDia
    );

    return new Date(ano, mes, dia);
}

function formatarDataTransacao(data) {
    return (
        `${String(data.getDate()).padStart(2, '0')}/` +
        `${String(data.getMonth() + 1).padStart(2, '0')}/` +
        `${data.getFullYear()}`
    );
}

function obterDadosVisuaisRecorrencia(tipo) {
    const configuracoes = {
        salario: {
            categoriaText: 'Salário',
            classeCor: 'amount-pos',
            sinal: '+'
        },
        fixo: {
            categoriaText: 'Gasto Fixo',
            classeCor: 'amount-neg',
            sinal: '-'
        },
        variavel: {
            categoriaText: 'Gasto Variável',
            classeCor: 'amount-neg',
            sinal: '-'
        }
    };

    return configuracoes[tipo] || null;
}

function recorrenciaPermiteCompetencia(
    recorrencia,
    competencia
) {
    const distancia =
        calcularDistanciaEntreCompetencias(
            recorrencia.competenciaInicial,
            competencia
        );

    if (distancia < 0) {
        return false;
    }

    const termino = recorrencia.termino || {
        tipo: 'nunca'
    };

    if (termino.tipo === 'quantidade') {
        return distancia < Number(
            termino.quantidade
        );
    }

    if (termino.tipo === 'competencia') {
        return (
            competencia <=
            termino.competenciaFinal
        );
    }

    return true;
}

function obterUltimaCompetenciaRecorrencia(
    recorrencia
) {
    const termino = recorrencia.termino || {
        tipo: 'nunca'
    };

    if (termino.tipo === 'quantidade') {
        return adicionarMesesCompetencia(
            recorrencia.competenciaInicial,
            Number(termino.quantidade) - 1
        );
    }

    if (termino.tipo === 'competencia') {
        return termino.competenciaFinal;
    }

    return null;
}

function existeTransacaoDaRecorrencia(
    recorrenciaId,
    competencia
) {
    return transacoes.some(transacao => {
        return (
            Number(transacao.recorrenciaId) ===
                Number(recorrenciaId) &&
            transacao.competencia === competencia
        );
    });
}

function criarTransacaoDaRecorrencia(
    recorrencia,
    competencia
) {
    const dadosVisuais =
        obterDadosVisuaisRecorrencia(
            recorrencia.tipoLancamento
        );

    if (!dadosVisuais) {
        return false;
    }

    const dataVencimento =
        obterUltimoDiaDoMes(
            competencia,
            recorrencia.diaVencimento
        );

    if (!dataVencimento) {
        return false;
    }

    const categoria = obterCategoriaPorId(
        recorrencia.categoriaId
    );

    transacoes.push({
        id: gerarIdUnico(),

        tipo: recorrencia.tipoLancamento,

        contaId:
            recorrencia.contaId ||
            CONTA_PRINCIPAL_ID,

        caixinhaId: null,

        descricao: recorrencia.descricao,

        valor: Number(recorrencia.valor),

        data: formatarDataTransacao(
            dataVencimento
        ),

        competencia,

        recorrenciaId: recorrencia.id,

        origem: 'recorrencia',

        categoriaText:
            dadosVisuais.categoriaText,

        categoriaId:
            recorrencia.categoriaId || null,

        categoriaNome:
            categoria ? categoria.nome : '',

        classeCor:
            dadosVisuais.classeCor,

        sinal: dadosVisuais.sinal,

        isPago: false
    });

    return true;
}

function processarRecorrenciasMensais() {
    if (!Array.isArray(recorrencias)) {
        return 0;
    }

    const competenciaAtual =
        obterCompetenciaAtual();

    let quantidadeGerada = 0;
    let dadosAlterados = false;

    recorrencias.forEach(recorrencia => {
        if (
            recorrencia.status !== 'ativa' ||
            recorrencia.arquivada
        ) {
            return;
        }

        if (
            !recorrencia.descricao ||
            !Number.isFinite(
                Number(recorrencia.valor)
            ) ||
            Number(recorrencia.valor) <= 0
        ) {
            return;
        }

        const distanciaAteAtual =
            calcularDistanciaEntreCompetencias(
                recorrencia.competenciaInicial,
                competenciaAtual
            );

        if (distanciaAteAtual < 0) {
            return;
        }

        if (
            !Array.isArray(
                recorrencia.competenciasProcessadas
            )
        ) {
            recorrencia.competenciasProcessadas = [];
            dadosAlterados = true;
        }

        for (
            let indiceMes = 0;
            indiceMes <= distanciaAteAtual;
            indiceMes += 1
        ) {
            const competencia =
                adicionarMesesCompetencia(
                    recorrencia.competenciaInicial,
                    indiceMes
                );

            if (
                !recorrenciaPermiteCompetencia(
                    recorrencia,
                    competencia
                )
            ) {
                break;
            }

            if (
                recorrencia.competenciasProcessadas
                    .includes(competencia)
            ) {
                continue;
            }

            const jaExiste =
                existeTransacaoDaRecorrencia(
                    recorrencia.id,
                    competencia
                );

            if (jaExiste) {
                recorrencia.competenciasProcessadas
                    .push(competencia);

                dadosAlterados = true;
                continue;
            }

            const criouTransacao =
                criarTransacaoDaRecorrencia(
                    recorrencia,
                    competencia
                );

            if (!criouTransacao) {
                continue;
            }

            recorrencia.competenciasProcessadas
                .push(competencia);

            recorrencia.atualizadaEm =
                new Date().toISOString();

            quantidadeGerada += 1;
            dadosAlterados = true;
        }

        const ultimaCompetencia =
            obterUltimaCompetenciaRecorrencia(
                recorrencia
            );

        if (
            ultimaCompetencia &&
            competenciaAtual >= ultimaCompetencia &&
            recorrencia.competenciasProcessadas
                .includes(ultimaCompetencia)
        ) {
            recorrencia.status = 'encerrada';
            recorrencia.atualizadaEm =
                new Date().toISOString();

            dadosAlterados = true;
        }
    });

    if (dadosAlterados) {
        salvarNoBanco();
    }

    return quantidadeGerada;
}
    // ==========================================
    // 6. HISTÓRICO: FILTROS, PESQUISA E AÇÕES
    // ==========================================
    if (elementos.filtrosHistorico) {
        elementos.filtrosHistorico.addEventListener('click', function (evento) {
            const botao = evento.target.closest('.tab-btn');

            if (!botao) return;

            aplicarFiltroHistorico(botao.dataset.filter);
        });
    }

    if (elementos.pesquisaHistorico) {
        elementos.pesquisaHistorico.addEventListener('input', function () {
            estadoHistorico.pesquisa = this.value;
            renderizarHistorico();
        });
    }

    if (elementos.mesHistorico) {
        elementos.mesHistorico.addEventListener('change', function () {
            estadoHistorico.mes = this.value;
            renderizarHistorico();
        });
    }

    if (elementos.categoriaHistorico) {
        elementos.categoriaHistorico.addEventListener(
            'change',
            function () {
                estadoHistorico.categoria = this.value;
                renderizarHistorico();
            }
        );
    }

    if (elementos.ordenacaoHistorico) {
        elementos.ordenacaoHistorico.addEventListener('change', function () {
            estadoHistorico.ordenacao = this.value;
            renderizarHistorico();
        });
    }

    document.querySelectorAll('.clickable-card[data-filter]').forEach(card => {
        card.addEventListener('click', function () {
            aplicarFiltroHistorico(this.dataset.filter, true);
        });

        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');

        card.addEventListener('keydown', function (evento) {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                aplicarFiltroHistorico(this.dataset.filter, true);
            }
        });
    });

    if (elementos.tbodyHistorico) {
        elementos.tbodyHistorico.addEventListener('click', function (evento) {
            const linha = evento.target.closest('tr');

            if (!linha) return;

            const idTransacao = Number(linha.dataset.id);
            const botaoStatus = evento.target.closest('.status-badge:not(.status-static)');
            const botaoExcluir = evento.target.closest('.btn-excluir');

            if (botaoStatus) {
                const transacao = transacoes.find(item => item.id === idTransacao);

                if (!transacao) return;

                transacao.isPago = !transacao.isPago;
                salvarNoBanco();
                renderizarTela();

                mostrarToast(
                    `Lançamento marcado como ${transacao.isPago ? 'pago' : 'pendente'}.`,
                    'info'
                );

                return;
            }

            if (botaoExcluir) {
                const confirmou = confirm('Deseja excluir este lançamento? Esta ação não poderá ser desfeita.');

                if (!confirmou) return;

                transacoes = transacoes.filter(transacao => transacao.id !== idTransacao);
                salvarNoBanco();
                renderizarTela();
                mostrarToast('Lançamento excluído com sucesso.', 'sucesso');
            }
        });
    }
    const modalEditarRecorrencia =
    document.getElementById(
        'modalEditarRecorrencia'
    );

const recorrenciaEmEdicaoId =
    document.getElementById(
        'recorrenciaEmEdicaoId'
    );

const descricaoEdicaoRecorrencia =
    document.getElementById(
        'descricaoEdicaoRecorrencia'
    );

const valorEdicaoRecorrencia =
    document.getElementById(
        'valorEdicaoRecorrencia'
    );

const tipoEdicaoRecorrencia =
    document.getElementById(
        'tipoEdicaoRecorrencia'
    );

const categoriaEdicaoRecorrencia =
    document.getElementById(
        'categoriaEdicaoRecorrencia'
    );

const contaEdicaoRecorrencia =
    document.getElementById(
        'contaEdicaoRecorrencia'
    );

const diaEdicaoRecorrencia =
    document.getElementById(
        'diaEdicaoRecorrencia'
    );

const inicioEdicaoRecorrencia =
    document.getElementById(
        'inicioEdicaoRecorrencia'
    );

const terminoEdicaoRecorrencia =
    document.getElementById(
        'terminoEdicaoRecorrencia'
    );

const grupoQuantidadeEdicaoRecorrencia =
    document.getElementById(
        'grupoQuantidadeEdicaoRecorrencia'
    );

const quantidadeEdicaoRecorrencia =
    document.getElementById(
        'quantidadeEdicaoRecorrencia'
    );

const grupoFinalEdicaoRecorrencia =
    document.getElementById(
        'grupoFinalEdicaoRecorrencia'
    );

const finalEdicaoRecorrencia =
    document.getElementById(
        'finalEdicaoRecorrencia'
    );

function atualizarTerminoEdicaoRecorrencia() {
    const tipo =
        terminoEdicaoRecorrencia.value;

    grupoQuantidadeEdicaoRecorrencia.hidden =
        tipo !== 'quantidade';

    grupoFinalEdicaoRecorrencia.hidden =
        tipo !== 'competencia';
}

function abrirEdicaoRecorrencia(recorrencia) {
    recorrenciaEmEdicaoId.value =
        String(recorrencia.id);

    descricaoEdicaoRecorrencia.value =
        recorrencia.descricao;

    valorEdicaoRecorrencia.value =
        recorrencia.valor;

    tipoEdicaoRecorrencia.value =
        recorrencia.tipoLancamento;

    preencherSeletorCategorias(
        categoriaEdicaoRecorrencia,
        recorrencia.tipoLancamento,
        recorrencia.categoriaId
    );

    preencherSeletorContas(
        contaEdicaoRecorrencia,
        recorrencia.contaId
    );

    diaEdicaoRecorrencia.value =
        recorrencia.diaVencimento;

    inicioEdicaoRecorrencia.value =
        recorrencia.competenciaInicial;

    const termino = recorrencia.termino || {
        tipo: 'nunca',
        quantidade: null,
        competenciaFinal: null
    };

    terminoEdicaoRecorrencia.value =
        termino.tipo;

    quantidadeEdicaoRecorrencia.value =
        termino.quantidade || '';

    finalEdicaoRecorrencia.value =
        termino.competenciaFinal || '';

    finalEdicaoRecorrencia.min =
        recorrencia.competenciaInicial;

    atualizarTerminoEdicaoRecorrencia();

    modalEditarRecorrencia.style.display =
        'flex';

    modalEditarRecorrencia.setAttribute(
        'aria-hidden',
        'false'
    );

    setTimeout(() => {
        descricaoEdicaoRecorrencia.focus();
    }, 50);
}

function fecharEdicaoRecorrencia() {
    modalEditarRecorrencia.style.display =
        'none';

    modalEditarRecorrencia.setAttribute(
        'aria-hidden',
        'true'
    );

    recorrenciaEmEdicaoId.value = '';
}

function salvarEdicaoRecorrencia() {
    const id = Number(
        recorrenciaEmEdicaoId.value
    );

    const recorrencia = recorrencias.find(
        item => Number(item.id) === id
    );

    if (!recorrencia) {
        fecharEdicaoRecorrencia();

        mostrarToast(
            'Recorrência não encontrada.',
            'erro'
        );

        return;
    }

    const descricao =
        descricaoEdicaoRecorrencia.value.trim();

    const valor = Number(
        valorEdicaoRecorrencia.value
    );

    const tipo =
        tipoEdicaoRecorrencia.value;

    const categoriaId =
        categoriaEdicaoRecorrencia.value || null;

    const categoriaSelecionada =
        obterCategoriaPorId(categoriaId);

    const contaId =
        contaEdicaoRecorrencia.value;

    const contaSelecionada =
        obterContaPorId(contaId);

    const dia = Number(
        diaEdicaoRecorrencia.value
    );

    const tipoTermino =
        terminoEdicaoRecorrencia.value;

    if (!descricao) {
        mostrarToast(
            'Informe a descrição da recorrência.',
            'aviso'
        );

        descricaoEdicaoRecorrencia.focus();
        return;
    }

    if (
        categoriaId &&
        (
            !categoriaSelecionada ||
            !categoriaSelecionada.ativa ||
            categoriaSelecionada.tipo !== tipo
        )
    ) {
        mostrarToast(
            'Selecione uma categoria válida.',
            'aviso'
        );

        categoriaEdicaoRecorrencia.focus();
        return;
    }

    if (
        !contaSelecionada ||
        !contaSelecionada.ativa ||
        contaSelecionada.arquivada
    ) {
        mostrarToast(
            'Selecione uma conta ativa.',
            'aviso'
        );
        return;
    }

    if (
        !Number.isFinite(valor) ||
        valor <= 0
    ) {
        mostrarToast(
            'Informe um valor maior que zero.',
            'aviso'
        );

        valorEdicaoRecorrencia.focus();
        return;
    }

    if (
        !['salario', 'fixo', 'variavel']
            .includes(tipo)
    ) {
        mostrarToast(
            'Selecione um tipo válido.',
            'erro'
        );

        return;
    }

    if (
        !Number.isInteger(dia) ||
        dia < 1 ||
        dia > 31
    ) {
        mostrarToast(
            'Informe um dia entre 1 e 31.',
            'aviso'
        );

        diaEdicaoRecorrencia.focus();
        return;
    }

    let termino = {
        tipo: 'nunca',
        quantidade: null,
        competenciaFinal: null
    };

    if (tipoTermino === 'quantidade') {
        const quantidade = Number(
            quantidadeEdicaoRecorrencia.value
        );

        if (
            !Number.isInteger(quantidade) ||
            quantidade < 1 ||
            quantidade > 600
        ) {
            mostrarToast(
                'Informe uma quantidade entre 1 e 600 meses.',
                'aviso'
            );

            quantidadeEdicaoRecorrencia.focus();
            return;
        }

        termino = {
            tipo: 'quantidade',
            quantidade,
            competenciaFinal: null
        };
    }

    if (tipoTermino === 'competencia') {
        const competenciaFinal =
            finalEdicaoRecorrencia.value;

        if (!competenciaFinal) {
            mostrarToast(
                'Informe o último mês da recorrência.',
                'aviso'
            );

            finalEdicaoRecorrencia.focus();
            return;
        }

        if (
            competenciaFinal <
            recorrencia.competenciaInicial
        ) {
            mostrarToast(
                'O mês final não pode ser anterior ao início.',
                'aviso'
            );

            finalEdicaoRecorrencia.focus();
            return;
        }

        termino = {
            tipo: 'competencia',
            quantidade: null,
            competenciaFinal
        };
    }

    recorrencia.descricao = descricao;
    recorrencia.valor = valor;
    recorrencia.tipoLancamento = tipo;
    recorrencia.categoriaId =
        categoriaId || null;
    recorrencia.contaId = contaId;
    recorrencia.diaVencimento = dia;
    recorrencia.termino = termino;
    recorrencia.atualizadaEm =
        new Date().toISOString();

    salvarNoBanco();
    fecharEdicaoRecorrencia();
    renderizarTela();

    mostrarToast(
        'Recorrência atualizada. Os lançamentos anteriores foram preservados.',
        'sucesso'
    );
}

terminoEdicaoRecorrencia.addEventListener(
    'change',
    atualizarTerminoEdicaoRecorrencia
);

tipoEdicaoRecorrencia.addEventListener(
    'change',
    () => {
        preencherSeletorCategorias(
            categoriaEdicaoRecorrencia,
            tipoEdicaoRecorrencia.value
        );
    }
);

document
    .getElementById(
        'btnSalvarEdicaoRecorrencia'
    )
    .addEventListener(
        'click',
        salvarEdicaoRecorrencia
    );

document
    .getElementById(
        'btnCancelarEdicaoRecorrencia'
    )
    .addEventListener(
        'click',
        fecharEdicaoRecorrencia
    );

document
    .getElementById(
        'btnFecharEdicaoRecorrencia'
    )
    .addEventListener(
        'click',
        fecharEdicaoRecorrencia
    );

modalEditarRecorrencia.addEventListener(
    'click',
    evento => {
        if (
            evento.target ===
            modalEditarRecorrencia
        ) {
            fecharEdicaoRecorrencia();
        }
    }
);

document.addEventListener(
    'keydown',
    evento => {
        if (
            evento.key === 'Escape' &&
            modalEditarRecorrencia.style
                .display === 'flex'
        ) {
            fecharEdicaoRecorrencia();
        }
    }
);

if (elementos.recorrenciasLista) {
    elementos.recorrenciasLista.addEventListener(
        'click',
        evento => {
            const botao = evento.target.closest(
                '[data-acao-recorrencia][data-recorrencia-id]'
            );

            if (!botao) {
                return;
            }

            const id = Number(
                botao.dataset.recorrenciaId
            );

            const acao =
                botao.dataset.acaoRecorrencia;

            const recorrencia = recorrencias.find(
                item => Number(item.id) === id
            );

            if (!recorrencia) {
                mostrarToast(
                    'Recorrência não encontrada.',
                    'erro'
                );

                return;
            }
            if (acao === 'editar') {
    abrirEdicaoRecorrencia(recorrencia);
    return;
}

            if (acao === 'arquivar') {
                recorrencia.arquivada = true;
                recorrencia.atualizadaEm =
                    new Date().toISOString();

                salvarNoBanco();
                renderizarTela();
                mostrarToast(
                    'Recorrência arquivada. Os lançamentos foram preservados.',
                    'sucesso'
                );
                return;
            }

            if (acao === 'restaurar') {
                recorrencia.arquivada = false;
                recorrencia.atualizadaEm =
                    new Date().toISOString();

                salvarNoBanco();
                renderizarTela();
                mostrarToast(
                    'Recorrência restaurada.',
                    'sucesso'
                );
                return;
            }

            if (acao === 'excluir') {
                const confirmou = confirm(
                    `Excluir a recorrência "${recorrencia.descricao}"? Os lançamentos já criados permanecerão no histórico.`
                );

                if (!confirmou) return;

                recorrencias = recorrencias.filter(
                    item => Number(item.id) !==
                        Number(recorrencia.id)
                );

                salvarNoBanco();
                renderizarTela();
                mostrarToast(
                    'Recorrência excluída. O histórico foi preservado.',
                    'sucesso'
                );
                return;
            }

            if (acao === 'pausar') {
                recorrencia.status = 'pausada';
                recorrencia.atualizadaEm =
                    new Date().toISOString();

                salvarNoBanco();
                renderizarTela();

                mostrarToast(
                    'Recorrência pausada.',
                    'info'
                );

                return;
            }

if (acao === 'reativar') {
    abrirModalReativacao(recorrencia);
    return;
}
    

            if (acao === 'encerrar') {
                const confirmou = confirm(
                    `Encerrar a recorrência "${recorrencia.descricao}"? Os lançamentos anteriores serão preservados.`
                );

                if (!confirmou) {
                    return;
                }

                recorrencia.status = 'encerrada';
                recorrencia.atualizadaEm =
                    new Date().toISOString();

                salvarNoBanco();
                renderizarTela();

                mostrarToast(
                    'Recorrência encerrada. O histórico foi preservado.',
                    'sucesso'
                );
            }
        }
    );
}

const filtroRecorrencias =
    document.getElementById('filtroRecorrencias');

if (filtroRecorrencias) {
    filtroRecorrencias.addEventListener(
        'change',
        evento => {
            filtroRecorrenciasAtual =
                evento.target.value;
            renderizarRecorrencias();
        }
    );
}

if (elementos.competenciaPainel) {
    elementos.competenciaPainel.value =
        competenciaPainelSelecionada;

    elementos.competenciaPainel.addEventListener(
        'change',
        evento => {
            const competencia =
                normalizarCompetencia(
                    evento.target.value
                );

            if (!competencia) {
                evento.target.value =
                    competenciaPainelSelecionada;

                return;
            }

            competenciaPainelSelecionada =
                competencia;

            renderizarTela();
        }
    );
}

if (elementos.btnMesAtual) {
    elementos.btnMesAtual.addEventListener(
        'click',
        () => {
            competenciaPainelSelecionada =
                obterCompetenciaAtual();

            renderizarTela();
        }
    );
}

// ==========================================
// GERENCIAMENTO DE CATEGORIAS
// ==========================================
const categoriasLista =
    document.getElementById('categoriasLista');

const filtroCategorias =
    document.getElementById('filtroCategorias');

const categoriasVazio =
    document.getElementById('categoriasVazio');

let filtroCategoriasAtual = 'ativas';

const modalCategoria =
    document.getElementById('modalCategoria');

const categoriaEmEdicaoId =
    document.getElementById(
        'categoriaEmEdicaoId'
    );

const nomeCategoria =
    document.getElementById('nomeCategoria');

const tipoCategoria =
    document.getElementById('tipoCategoria');

const categoriaPai =
    document.getElementById('categoriaPai');

const iconeCategoria =
    document.getElementById('iconeCategoria');

const corCategoria =
    document.getElementById('corCategoria');

const ICONES_CATEGORIA = {
    tag: 'fa-tag',
    house: 'fa-house',
    car: 'fa-car',
    utensils: 'fa-utensils',
    'heart-pulse': 'fa-heart-pulse',
    'graduation-cap': 'fa-graduation-cap',
    paw: 'fa-paw',
    plane: 'fa-plane',
    gamepad: 'fa-gamepad',
    'bag-shopping': 'fa-bag-shopping',
    coins: 'fa-coins',
    'money-bill-wave': 'fa-money-bill-wave',
    'file-invoice-dollar': 'fa-file-invoice-dollar',
    repeat: 'fa-repeat',
    'basket-shopping': 'fa-basket-shopping',
    ellipsis: 'fa-ellipsis'
};

function obterIconeCategoria(icone) {
    return ICONES_CATEGORIA[icone] ||
        ICONES_CATEGORIA.tag;
}

function obterCorCategoriaSegura(cor) {
    return /^#[0-9a-f]{6}$/i.test(
        String(cor)
    )
        ? cor
        : '#8f99a8';
}

function obterTextoTipoCategoria(tipo) {
    const textos = {
        salario: 'Receita',
        fixo: 'Gasto fixo',
        variavel: 'Gasto variável'
    };

    return textos[tipo] || 'Categoria';
}

function categoriaEstaEmUso(categoriaId) {
    return (
        transacoes.some(transacao =>
            String(transacao.categoriaId) ===
            String(categoriaId)
        ) ||
        recorrencias.some(recorrencia =>
            String(recorrencia.categoriaId) ===
            String(categoriaId)
        )
    );
}

function categoriaPossuiRecorrenciaEmAberto(
    categoriaId
) {
    return recorrencias.some(recorrencia => {
        return (
            String(recorrencia.categoriaId) ===
                String(categoriaId) &&
            recorrencia.status !== 'encerrada' &&
            !recorrencia.arquivada
        );
    });
}

function obterFilhasAtivas(categoriaId) {
    return categorias.filter(categoria => {
        return (
            categoria.ativa &&
            String(categoria.categoriaPaiId) ===
                String(categoriaId)
        );
    });
}

function renderizarCategorias() {
    if (!categoriasLista) return;

    const ativas = categorias.filter(
        categoria =>
            categoria.ativa &&
            !categoria.arquivada
    ).length;

    const inativas = categorias.filter(
        categoria =>
            !categoria.ativa &&
            !categoria.arquivada
    ).length;

    const arquivadas = categorias.filter(
        categoria => categoria.arquivada
    ).length;

    document.getElementById(
        'totalCategoriasAtivas'
    ).textContent = ativas;

    document.getElementById(
        'totalCategoriasInativas'
    ).textContent = inativas;

    document.getElementById(
        'totalCategoriasArquivadas'
    ).textContent = arquivadas;

    categoriasLista.innerHTML = '';

    const categoriasVisiveis =
        categorias.filter(categoria => {
            if (filtroCategoriasAtual === 'todas') {
                return true;
            }

            if (filtroCategoriasAtual === 'arquivadas') {
                return categoria.arquivada;
            }

            if (categoria.arquivada) {
                return false;
            }

            if (filtroCategoriasAtual === 'inativas') {
                return !categoria.ativa;
            }

            return categoria.ativa;
        });

    if (categoriasVazio) {
        categoriasVazio.hidden =
            categoriasVisiveis.length > 0;
    }

    const ordenadas = [...categoriasVisiveis].sort(
        (a, b) => {
            if (a.ativa !== b.ativa) {
                return a.ativa ? -1 : 1;
            }

            if (a.tipo !== b.tipo) {
                return a.tipo.localeCompare(b.tipo);
            }

            return a.nome.localeCompare(
                b.nome,
                'pt-BR'
            );
        }
    );

    ordenadas.forEach(categoria => {
        const pai = categoria.categoriaPaiId
            ? obterCategoriaPorId(
                categoria.categoriaPaiId
            )
            : null;

        const icone = obterIconeCategoria(
            categoria.icone
        );

        const cor = obterCorCategoriaSegura(
            categoria.cor
        );

        categoriasLista.insertAdjacentHTML(
            'beforeend',
            `
                <article
                    class="categoria-card ${categoria.ativa ? '' : 'is-inativa'} ${categoria.arquivada ? 'is-arquivada' : ''}"
                    style="--categoria-cor: ${cor};"
                >
                    <div class="categoria-card-topo">
                        <div class="categoria-identidade">
                            <span class="categoria-icone">
                                <i class="fa-solid ${icone}"></i>
                            </span>

                            <div>
                                <h3>${escaparHTML(categoria.nome)}</h3>
                                <p>
                                    ${escaparHTML(obterTextoTipoCategoria(categoria.tipo))}
                                    ${pai ? ` · ${escaparHTML(pai.nome)}` : ''}
                                    ${categoria.sistema ? ' · Padrão' : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="categoria-acoes">
                        ${
                            categoria.arquivada
                                ? `
                                    <button
                                        type="button"
                                        class="btn-categoria-acao"
                                        data-acao-categoria="restaurar"
                                        data-categoria-id="${escaparHTML(categoria.id)}"
                                    >
                                        Restaurar
                                    </button>
                                `
                                : `
                                    <button
                                        type="button"
                                        class="btn-categoria-acao"
                                        data-acao-categoria="editar"
                                        data-categoria-id="${escaparHTML(categoria.id)}"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        class="btn-categoria-acao"
                                        data-acao-categoria="${categoria.ativa ? 'desativar' : 'reativar'}"
                                        data-categoria-id="${escaparHTML(categoria.id)}"
                                    >
                                        ${categoria.ativa ? 'Desativar' : 'Reativar'}
                                    </button>

                                    <button
                                        type="button"
                                        class="btn-categoria-acao"
                                        data-acao-categoria="arquivar"
                                        data-categoria-id="${escaparHTML(categoria.id)}"
                                    >
                                        Arquivar
                                    </button>
                                `
                        }

                        <button
                            type="button"
                            class="btn-categoria-acao btn-categoria-perigo"
                            data-acao-categoria="excluir"
                            data-categoria-id="${escaparHTML(categoria.id)}"
                        >
                            Excluir
                        </button>
                    </div>
                </article>
            `
        );
    });
}

function preencherCategoriasPai(
    tipo,
    categoriaAtualId = null,
    categoriaPaiSelecionadaId = null
) {
    categoriaPai.innerHTML =
        '<option value="">Nenhuma</option>';

    categorias
        .filter(categoria => {
            return (
                categoria.ativa &&
                categoria.tipo === tipo &&
                categoria.categoriaPaiId === null &&
                String(categoria.id) !==
                    String(categoriaAtualId)
            );
        })
        .sort((a, b) =>
            a.nome.localeCompare(b.nome, 'pt-BR')
        )
        .forEach(categoria => {
            const option =
                document.createElement('option');

            option.value = categoria.id;
            option.textContent = categoria.nome;
            categoriaPai.appendChild(option);
        });

    if (categoriaPaiSelecionadaId) {
        categoriaPai.value =
            String(categoriaPaiSelecionadaId);
    }
}

function abrirModalCategoria(categoria = null) {
    categoriaEmEdicaoId.value =
        categoria ? categoria.id : '';

    nomeCategoria.value =
        categoria ? categoria.nome : '';

    tipoCategoria.value =
        categoria ? categoria.tipo : 'variavel';

    iconeCategoria.value =
        categoria &&
        ICONES_CATEGORIA[categoria.icone]
            ? categoria.icone
            : 'tag';

    const corSegura = categoria
        ? obterCorCategoriaSegura(categoria.cor)
        : '#d9ad26';

    corCategoria.value = [
        ...corCategoria.options
    ].some(option => option.value === corSegura)
        ? corSegura
        : '#8f99a8';

    preencherCategoriasPai(
        tipoCategoria.value,
        categoria ? categoria.id : null,
        categoria
            ? categoria.categoriaPaiId
            : null
    );

    document.getElementById(
        'tituloModalCategoria'
    ).textContent = categoria
        ? 'Editar categoria'
        : 'Nova categoria';

    document.getElementById(
        'btnSalvarCategoria'
    ).textContent = categoria
        ? 'Salvar alterações'
        : 'Criar categoria';

    modalCategoria.style.display = 'flex';
    modalCategoria.setAttribute(
        'aria-hidden',
        'false'
    );

    setTimeout(() => nomeCategoria.focus(), 50);
}

function fecharModalCategoria() {
    modalCategoria.style.display = 'none';
    modalCategoria.setAttribute(
        'aria-hidden',
        'true'
    );
    categoriaEmEdicaoId.value = '';
}

function gerarIdCategoria() {
    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            'function'
    ) {
        return window.crypto.randomUUID();
    }

    return (
        `categoria-${Date.now()}-` +
        `${Math.floor(Math.random() * 100000)}`
    );
}

function salvarCategoria() {
    const nome = nomeCategoria.value.trim();
    const tipo = tipoCategoria.value;
    const categoriaPaiId =
        categoriaPai.value || null;
    const icone = iconeCategoria.value;
    const cor = corCategoria.value;
    const idEmEdicao =
        categoriaEmEdicaoId.value;

    if (!nome) {
        mostrarToast(
            'Informe o nome da categoria.',
            'aviso'
        );
        nomeCategoria.focus();
        return;
    }

    if (
        !['salario', 'fixo', 'variavel']
            .includes(tipo)
    ) {
        mostrarToast(
            'Selecione um tipo válido.',
            'erro'
        );
        return;
    }

    if (!ICONES_CATEGORIA[icone]) {
        mostrarToast(
            'Selecione um ícone válido.',
            'erro'
        );
        return;
    }

    if (!/^#[0-9a-f]{6}$/i.test(cor)) {
        mostrarToast(
            'Selecione uma cor válida.',
            'erro'
        );
        return;
    }

    const pai = categoriaPaiId
        ? obterCategoriaPorId(categoriaPaiId)
        : null;

    if (
        categoriaPaiId &&
        (
            !pai ||
            !pai.ativa ||
            pai.tipo !== tipo ||
            pai.categoriaPaiId !== null
        )
    ) {
        mostrarToast(
            'Selecione uma categoria principal válida.',
            'aviso'
        );
        return;
    }

    const duplicada = categorias.some(
        categoria => {
            return (
                String(categoria.id) !==
                    String(idEmEdicao) &&
                categoria.tipo === tipo &&
                String(
                    categoria.categoriaPaiId || ''
                ) === String(
                    categoriaPaiId || ''
                ) &&
                categoria.nome.toLocaleLowerCase(
                    'pt-BR'
                ) === nome.toLocaleLowerCase(
                    'pt-BR'
                )
            );
        }
    );

    if (duplicada) {
        mostrarToast(
            'Já existe uma categoria com esse nome neste grupo.',
            'aviso'
        );
        nomeCategoria.focus();
        return;
    }

    if (idEmEdicao) {
        const categoria = obterCategoriaPorId(
            idEmEdicao
        );

        if (!categoria) {
            mostrarToast(
                'Categoria não encontrada.',
                'erro'
            );
            fecharModalCategoria();
            return;
        }

        if (
            categoria.tipo !== tipo &&
            categoriaEstaEmUso(categoria.id)
        ) {
            mostrarToast(
                'O tipo não pode ser alterado porque a categoria já está em uso.',
                'aviso'
            );
            return;
        }

        const possuiSubcategorias =
            categorias.some(item => {
                return String(
                    item.categoriaPaiId
                ) === String(categoria.id);
            });

        if (
            possuiSubcategorias &&
            (
                categoriaPaiId ||
                categoria.tipo !== tipo
            )
        ) {
            mostrarToast(
                'Uma categoria com subcategorias não pode virar subcategoria nem mudar de tipo.',
                'aviso'
            );
            return;
        }

        categoria.nome = nome;
        categoria.tipo = tipo;
        categoria.categoriaPaiId =
            categoriaPaiId;
        categoria.icone = icone;
        categoria.cor = cor;
        categoria.atualizadaEm =
            new Date().toISOString();
    } else {
        categorias.push({
            id: gerarIdCategoria(),
            nome,
            tipo,
            categoriaPaiId,
            icone,
            cor,
            ativa: true,
            arquivada: false,
            sistema: false,
            criadaEm: new Date().toISOString(),
            atualizadaEm:
                new Date().toISOString()
        });
    }

    salvarNoBanco();
    fecharModalCategoria();
    renderizarTela();

    mostrarToast(
        idEmEdicao
            ? 'Categoria atualizada.'
            : 'Categoria criada.',
        'sucesso'
    );
}

document.getElementById(
    'btnNovaCategoria'
).addEventListener(
    'click',
    () => abrirModalCategoria()
);

document.getElementById(
    'btnSalvarCategoria'
).addEventListener(
    'click',
    salvarCategoria
);

document.getElementById(
    'btnCancelarCategoria'
).addEventListener(
    'click',
    fecharModalCategoria
);

document.getElementById(
    'btnFecharModalCategoria'
).addEventListener(
    'click',
    fecharModalCategoria
);

tipoCategoria.addEventListener(
    'change',
    () => {
        preencherCategoriasPai(
            tipoCategoria.value,
            categoriaEmEdicaoId.value || null
        );
    }
);

modalCategoria.addEventListener(
    'click',
    evento => {
        if (evento.target === modalCategoria) {
            fecharModalCategoria();
        }
    }
);

categoriasLista.addEventListener(
    'click',
    evento => {
        const botao = evento.target.closest(
            '[data-acao-categoria][data-categoria-id]'
        );

        if (!botao) return;

        const categoria = obterCategoriaPorId(
            botao.dataset.categoriaId
        );

        if (!categoria) {
            mostrarToast(
                'Categoria não encontrada.',
                'erro'
            );
            return;
        }

        const acao =
            botao.dataset.acaoCategoria;

        if (acao === 'editar') {
            abrirModalCategoria(categoria);
            return;
        }

        if (acao === 'arquivar') {
            const filhasAtivas =
                obterFilhasAtivas(categoria.id);

            if (filhasAtivas.length > 0) {
                mostrarToast(
                    'Arquive ou desative primeiro as subcategorias vinculadas.',
                    'aviso'
                );
                return;
            }

            if (
                categoriaPossuiRecorrenciaEmAberto(
                    categoria.id
                )
            ) {
                mostrarToast(
                    'Encerre ou arquive primeiro as recorrências desta categoria.',
                    'aviso'
                );
                return;
            }

            categoria.ativa = false;
            categoria.arquivada = true;
            categoria.atualizadaEm =
                new Date().toISOString();

            salvarNoBanco();
            renderizarTela();
            mostrarToast(
                'Categoria arquivada. O histórico foi preservado.',
                'sucesso'
            );
            return;
        }

        if (acao === 'restaurar') {
            if (categoria.categoriaPaiId) {
                const pai = obterCategoriaPorId(
                    categoria.categoriaPaiId
                );

                if (
                    !pai ||
                    pai.arquivada ||
                    !pai.ativa
                ) {
                    mostrarToast(
                        'Restaure ou reative primeiro a categoria principal.',
                        'aviso'
                    );
                    return;
                }
            }

            categoria.arquivada = false;
            categoria.ativa = true;
            categoria.atualizadaEm =
                new Date().toISOString();

            salvarNoBanco();
            renderizarTela();
            mostrarToast(
                'Categoria restaurada e reativada.',
                'sucesso'
            );
            return;
        }

        if (acao === 'excluir') {
            const possuiFilhas =
                categorias.some(item =>
                    String(item.categoriaPaiId) ===
                    String(categoria.id)
                );

            if (categoria.sistema) {
                mostrarToast(
                    'Categorias padrão podem ser arquivadas, mas não excluídas.',
                    'aviso'
                );
                return;
            }

            if (
                categoriaEstaEmUso(categoria.id) ||
                possuiFilhas
            ) {
                mostrarToast(
                    'Esta categoria possui vínculos. Arquive-a para esconder sem danificar os dados.',
                    'aviso'
                );
                return;
            }

            const confirmou = confirm(
                `Excluir definitivamente a categoria "${categoria.nome}"?`
            );

            if (!confirmou) return;

            categorias = categorias.filter(
                item =>
                    String(item.id) !==
                    String(categoria.id)
            );

            salvarNoBanco();
            renderizarTela();
            mostrarToast(
                'Categoria excluída definitivamente.',
                'sucesso'
            );
            return;
        }

        if (acao === 'desativar') {
            const filhasAtivas =
                obterFilhasAtivas(categoria.id);

            if (filhasAtivas.length > 0) {
                mostrarToast(
                    'Desative primeiro as subcategorias vinculadas.',
                    'aviso'
                );
                return;
            }

            if (
                categoriaPossuiRecorrenciaEmAberto(
                    categoria.id
                )
            ) {
                mostrarToast(
                    'Esta categoria está em uma recorrência ativa ou pausada. Edite ou encerre a recorrência primeiro.',
                    'aviso'
                );
                return;
            }

            categoria.ativa = false;
        }

        if (acao === 'reativar') {
            if (categoria.categoriaPaiId) {
                const pai = obterCategoriaPorId(
                    categoria.categoriaPaiId
                );

                if (!pai || !pai.ativa) {
                    mostrarToast(
                        'Reative primeiro a categoria principal.',
                        'aviso'
                    );
                    return;
                }
            }

            categoria.ativa = true;
        }

        categoria.atualizadaEm =
            new Date().toISOString();

        salvarNoBanco();
        renderizarTela();

        mostrarToast(
            categoria.ativa
                ? 'Categoria reativada.'
                : 'Categoria desativada. O histórico foi preservado.',
            'sucesso'
        );
    }
);

if (filtroCategorias) {
    filtroCategorias.addEventListener(
        'change',
        evento => {
            filtroCategoriasAtual =
                evento.target.value;
            renderizarCategorias();
        }
    );
}

document.addEventListener(
    'keydown',
    evento => {
        if (
            evento.key === 'Escape' &&
            modalCategoria.style.display ===
                'flex'
        ) {
            fecharModalCategoria();
        }
    }
);
