
    // ==========================================
    // ==========================================
// CONFIGURAÇÃO DO GRÁFICO (CHART.JS)
// ==========================================
let graficoApp;

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

    renderizarTela();
};

    // ==========================================
    // 1. ELEMENTOS DA TELA
    // ==========================================
const elementos = {
    tbodyHistorico: document.getElementById('tbodyHistorico'),
    pesquisaHistorico: document.getElementById('pesquisaHistorico'),
    mesHistorico: document.getElementById('mesHistorico'),
    ordenacaoHistorico: document.getElementById('ordenacaoHistorico'),
    filtrosHistorico: document.getElementById('filtrosHistorico'),
    comparacaoHistorico: document.getElementById('comparacaoHistorico'),
    quantidadeHistorico: document.getElementById('quantidadeHistorico'),
    totalHistorico: document.getElementById('totalHistorico'),
    historicoVazio: document.getElementById('historicoVazio'),
    historicoLancamentos: document.getElementById('historicoLancamentos'),

    caixinhasGrid: document.getElementById('caixinhasGrid'),
    caixinhaSelect: document.getElementById('caixinhaSelect'),

    painelSalario: document.getElementById('painelSalario'),
    painelGuardado: document.getElementById('painelGuardado'),
    painelFixo: document.getElementById('painelFixo'),
    painelVariavel: document.getElementById('painelVariavel'),

    modalOverlay: document.querySelector('.modal-overlay'),
    sobraFlutuante: document.querySelector('.sobra-flutuante')
};

const estadoHistorico = {
    filtro: 'todos',
    pesquisa: '',
    mes: 'todos',
    ordenacao: 'recentes'
};

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
                .map(transacao => obterChaveMes(transacao.data))
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
                obterChaveMes(transacao.data) === estadoHistorico.mes;

            const textoPesquisavel = `${transacao.descricao || ''} ${transacao.categoriaText || ''}`
                .toLocaleLowerCase('pt-BR');

            const combinaPesquisa = pesquisa === '' || textoPesquisavel.includes(pesquisa);

            return combinaFiltro && combinaMes && combinaPesquisa;
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
            .filter(t => t.tipo === 'variavel' && obterChaveMes(t.data) === estadoHistorico.mes)
            .reduce((total, t) => total + t.valor, 0);

        const totalAnterior = transacoes
            .filter(t => t.tipo === 'variavel' && obterChaveMes(t.data) === chaveMesAnterior)
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

        const transacoesFiltradas = obterTransacoesFiltradas();
        elementos.tbodyHistorico.innerHTML = '';

        transacoesFiltradas.forEach(transacao => {
            const permiteAlterarStatus = transacao.tipo === 'fixo' || transacao.tipo === 'variavel';

            const statusHTML = permiteAlterarStatus
                ? `<button type="button" class="status-badge ${transacao.isPago ? 'status-pago' : 'status-pendente'}" title="Clique para alterar o status">${transacao.isPago ? 'Pago' : 'Pendente'}</button>`
                : '<span class="status-badge status-pago status-static">Efetivado</span>';

            const tr = document.createElement('tr');
            tr.setAttribute('data-id', transacao.id);
            tr.innerHTML = `
                <td>${escaparHTML(transacao.data)}</td>
                <td>
                    <div class="history-description">${escaparHTML(transacao.descricao)}</div>
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
            elementos.historicoLancamentos.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    function renderizarTela() {
        estado.totalSalario = 0;
        estado.totalGuardado = 0;
        estado.totalFixo = 0;
        estado.totalVariavel = 0;

        const saldosCaixinhas = {};
        caixinhas.forEach(caixinha => {
            saldosCaixinhas[caixinha.id] = 0;
        });

        transacoes.forEach(transacao => {
            if (transacao.tipo === 'salario') {
                estado.totalSalario += transacao.valor;
            } else if (transacao.tipo === 'guardado') {
                estado.totalGuardado += transacao.valor;

                if (saldosCaixinhas[transacao.caixinhaId] !== undefined) {
                    saldosCaixinhas[transacao.caixinhaId] += transacao.valor;
                }
            } else if (transacao.tipo === 'resgate') {
                estado.totalGuardado -= transacao.valor;

                if (saldosCaixinhas[transacao.caixinhaId] !== undefined) {
                    saldosCaixinhas[transacao.caixinhaId] -= transacao.valor;
                }
            } else if (transacao.tipo === 'fixo') {
                estado.totalFixo += transacao.valor;
            } else if (transacao.tipo === 'variavel') {
                estado.totalVariavel += transacao.valor;
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

            caixinhas.forEach(caixinha => {
    const saldoCaixinha = saldosCaixinhas[caixinha.id] || 0;
    const metaCaixinha = Number(caixinha.meta) || 0;

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

    const textoMeta = possuiMeta
        ? `Meta: R$ ${formatarMoeda(metaCaixinha)}`
        : 'Meta não definida';

    const textoPorcentagem = possuiMeta
        ? `${porcentagemExibida}%`
        : '0%';

    elementos.caixinhasGrid.innerHTML += `
        <div class="caixinha-card">
            <h3>
                ${escaparHTML(caixinha.nome)}

                <span
                    class="btn-excluir-caixinha"
                    onclick="excluirCaixinha(${caixinha.id})"
                    title="Excluir caixinha"
                >
                    ❌
                </span>
            </h3>

            <div class="caixinha-valores">
                <div class="saldo">
                    R$ ${formatarMoeda(saldoCaixinha)}
                </div>

                <div class="caixinha-meta">
                    ${textoMeta}
                </div>
            </div>

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
    `;
});
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
    // 3. CRIAR E EXCLUIR CAIXINHAS
    // ==========================================
  document.getElementById('btnNovaCaixinha').addEventListener('click', () => {
    const nome = prompt('Qual o nome do novo objetivo/caixinha?');

    if (!nome || nome.trim() === '') {
        return;
    }

    const metaInformada = prompt('Qual o valor da meta?');
    const meta = Number(
        String(metaInformada || '')
            .replace(/\./g, '')
            .replace(',', '.')
    );

    if (!Number.isFinite(meta) || meta <= 0) {
        mostrarToast(
            'Informe uma meta maior que zero.',
            'erro'
        );

        return;
    }

    caixinhas.push({
        id: Date.now(),
        nome: nome.trim(),
        meta: meta
    });

    salvarNoBanco();
    renderizarTela();

    mostrarToast(
        'Caixinha criada com sucesso.',
        'sucesso'
    );
});
    window.excluirCaixinha = function(id) {
        if(confirm("Tem certeza que deseja excluir esta caixinha? (Os lançamentos dela ficarão sem categoria)")) {
            caixinhas = caixinhas.filter(c => c.id !== id);
            salvarNoBanco();
            renderizarTela();
        }
    }

    // ==========================================
    // 4. LÓGICA DO MODAL
    // ==========================================
 const modalOverlay = document.querySelector('.modal-overlay');
const tipoLancamento = document.getElementById('tipoLancamento');
const areaCaixinha = document.getElementById('areaCaixinha');

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
        document.getElementById('modalTitle').innerText = titulo; 
        document.getElementById('areaParcelamento').style.display = (tipo === 'fixo' || tipo === 'variavel') ? 'block' : 'none';
        document.getElementById('areaPagamento').style.display = (tipo === 'fixo' || tipo === 'variavel') ? 'block' : 'none';
        
        
        // Mostra a seleção de caixinha apenas se for guardar ou resgatar dinheiro
        areaCaixinha.style.display = (tipo === 'guardado' || tipo === 'resgate') ? 'block' : 'none';
        
        modalOverlay.style.display = 'flex';
    }

    document.querySelector('.btn-cancel').addEventListener('click', () => modalOverlay.style.display = 'none');

    document.querySelector('.btn-salary').addEventListener('click', () => abrirModal('salario', 'Inserir Receita'));
    document.querySelector('.btn-saved').addEventListener('click', () => abrirModal('guardado', 'Guardar Dinheiro'));
    document.querySelector('.btn-fixed').addEventListener('click', () => abrirModal('fixo', 'Adicionar Gasto Fixo'));
    document.querySelector('.btn-variable').addEventListener('click', () => abrirModal('variavel', 'Adicionar Gasto Variável'));
    // Atualizei os dois botões de resgate para abrirem o mesmo tipo de modal agora, já que a caixinha é escolhida na lista
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
    document.querySelector('.btn-save').addEventListener('click', function() {
        const tipo = tipoLancamento.value;
        let desc = document.getElementById('descricao').value;
        const val = Number(document.getElementById('valor').value);
        const caixinhaId = Number(document.getElementById('caixinhaSelect').value); // Pega qual caixinha foi escolhida
if (desc.trim() === '' || val <= 0) {
    mostrarToast(
        'Preencha a descrição e informe um valor válido.',
        'aviso'
    );

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
    const saldoDisponivel = calcularSaldoCaixinha(caixinhaId);

    if (val > saldoDisponivel) {
        mostrarToast(
            `Saldo insuficiente. Disponível: R$ ${formatarMoeda(saldoDisponivel)}.`,
            'erro'
        );

        return;
    }
}

let categoriaText = '', classeCor = '', sinal = '';

        if (tipo === 'salario') { categoriaText = 'Salário'; classeCor = 'amount-pos'; sinal = '+'; }
        else if (tipo === 'guardado') { categoriaText = 'Reserva'; classeCor = 'amount-pos'; sinal = '+'; }
        else if (tipo === 'resgate') { categoriaText = 'Uso da Reserva'; classeCor = 'amount-neg'; sinal = '-'; }
        else if (tipo === 'fixo') { categoriaText = 'Gasto Fixo'; classeCor = 'amount-neg'; sinal = '-'; }
        else if (tipo === 'variavel') { categoriaText = 'Gasto Variável'; classeCor = 'amount-neg'; sinal = '-'; }

        const dataAtual = new Date();
        transacoes.push({
            id: Date.now(),
            tipo: tipo,
            caixinhaId: (tipo === 'guardado' || tipo === 'resgate') ? caixinhaId : null, // Salva o ID da caixinha
            descricao: desc,
            valor: val,
            data: `${String(dataAtual.getDate()).padStart(2, '0')}/${String(dataAtual.getMonth() + 1).padStart(2, '0')}/${dataAtual.getFullYear()}`,
            categoriaText: categoriaText,
            classeCor: classeCor,
            sinal: sinal,
            isPago: document.getElementById('isPago') ? document.getElementById('isPago').checked : false
        });

        salvarNoBanco();

document.getElementById('descricao').value = '';
document.getElementById('valor').value = '';

renderizarTela();

modalOverlay.style.display = 'none';

const mensagensSucesso = {
    salario: 'Receita adicionada com sucesso.',
    guardado: 'Dinheiro guardado com sucesso.',
    resgate: 'Resgate realizado com sucesso.',
    fixo: 'Gasto fixo adicionado com sucesso.',
    variavel: 'Gasto variável adicionado com sucesso.'
};

mostrarToast(
    mensagensSucesso[tipo] || 'Lançamento salvo com sucesso.',
    'sucesso'
);
    });    

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

