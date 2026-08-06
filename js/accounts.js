// Parte das contas bancárias.
// A ideia aqui é sempre calcular o saldo pelas movimentações, em vez de salvar
// um saldo solto que poderia ficar diferente do histórico.

let filtroContasAtual = 'ativas';

function obterContaPorId(id) {
    return contas.find(conta =>
        String(conta.id) === String(id)
    ) || null;
}

function obterContasAtivas() {
    return contas.filter(conta =>
        conta.ativa && !conta.arquivada
    );
}

// O saldo nasce do saldo inicial e depois percorre todas as movimentações.
function calcularSaldoConta(id) {
    const conta = obterContaPorId(id);
    let saldo = conta
        ? Number(conta.saldoInicial) || 0
        : 0;

    transacoes.forEach(transacao => {
        const valor = Number(transacao.valor) || 0;

        if (transacao.tipo === 'transferencia') {
            if (String(transacao.contaOrigemId) === String(id)) saldo -= valor;
            if (String(transacao.contaDestinoId) === String(id)) saldo += valor;
            return;
        }

        if (String(transacao.contaId) !== String(id)) return;

        if (transacao.tipo === 'salario' || transacao.tipo === 'resgate') {
            saldo += valor;
        } else if (
            transacao.tipo === 'guardado' ||
            transacao.tipo === 'pagamento_fatura' ||
            (
                ['fixo', 'variavel'].includes(transacao.tipo) &&
                transacao.isPago
            )
        ) {
            saldo -= valor;
        }
    });

    return saldo;
}

function preencherSeletorContas(seletor, selecionadaId = null) {
    if (!seletor) return;
    seletor.innerHTML = '';

    obterContasAtivas()
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .forEach(conta => {
            const option = document.createElement('option');
            option.value = conta.id;
            option.textContent = `${conta.nome} · R$ ${formatarMoeda(calcularSaldoConta(conta.id))}`;
            seletor.appendChild(option);
        });

    if (obterContasAtivas().some(conta =>
        String(conta.id) === String(selecionadaId)
    )) {
        seletor.value = String(selecionadaId);
    }
}

// Antes de excluir, confiro se a conta aparece em alguma parte do sistema.
function contaEstaEmUso(id) {
    return transacoes.some(t =>
        [t.contaId, t.contaOrigemId, t.contaDestinoId]
            .some(valor => String(valor) === String(id))
    ) || recorrencias.some(r =>
        String(r.contaId) === String(id)
    ) || cartoes.some(cartao =>
        String(cartao.contaPagamentoId) ===
        String(id)
    );
}

function renderizarContas() {
    const grid = document.getElementById('contasGrid');
    if (!grid) return;

    const visiveis = contas.filter(conta => {
        if (filtroContasAtual === 'todas') return true;
        if (filtroContasAtual === 'arquivadas') return conta.arquivada;
        return conta.ativa && !conta.arquivada;
    });

    const total = contas
        .filter(conta => !conta.arquivada)
        .reduce((soma, conta) => soma + calcularSaldoConta(conta.id), 0);

    document.getElementById('saldoTotalContas').textContent =
        `R$ ${formatarMoeda(total)}`;
    grid.innerHTML = '';
    document.getElementById('contasVazio').hidden = visiveis.length > 0;

    visiveis.forEach(conta => {
        const saldo = calcularSaldoConta(conta.id);
        grid.insertAdjacentHTML('beforeend', `
            <article class="conta-card ${conta.arquivada ? 'is-arquivada' : ''}" style="--conta-cor:${conta.cor}">
                <div class="conta-card-topo">
                    <span class="conta-icone"><i class="fa-solid fa-${escaparHTML(conta.icone)}"></i></span>
                    <span>${escaparHTML(conta.tipo)}</span>
                </div>
                <h3>${escaparHTML(conta.nome)}</h3>
                <small>Saldo disponível</small>
                <strong class="${saldo < 0 ? 'text-red' : ''}">R$ ${formatarMoeda(saldo)}</strong>
                <div class="conta-acoes">
                    ${conta.arquivada
                        ? `<button type="button" data-acao-conta="restaurar" data-conta-id="${escaparHTML(conta.id)}">Restaurar</button>`
                        : `<button type="button" data-acao-conta="editar" data-conta-id="${escaparHTML(conta.id)}">Editar</button>
                           <button type="button" data-acao-conta="arquivar" data-conta-id="${escaparHTML(conta.id)}">Arquivar</button>`}
                    <button type="button" class="conta-acao-perigo" data-acao-conta="excluir" data-conta-id="${escaparHTML(conta.id)}">Excluir</button>
                </div>
            </article>
        `);
    });
}

const modalConta = document.getElementById('modalConta');
const modalTransferencia = document.getElementById('modalTransferencia');

function fecharModalConta() {
    modalConta.style.display = 'none';
    modalConta.setAttribute('aria-hidden', 'true');
}

function abrirModalConta(conta = null) {
    document.getElementById('contaEmEdicaoId').value = conta ? conta.id : '';
    document.getElementById('nomeConta').value = conta ? conta.nome : '';
    document.getElementById('tipoConta').value = conta ? conta.tipo : 'corrente';
    document.getElementById('corConta').value = conta ? conta.cor : '#d9ad26';
    document.getElementById('saldoInicialConta').value = conta ? conta.saldoInicial : '';
    document.getElementById('tituloModalConta').textContent = conta ? 'Editar conta' : 'Nova conta';
    document.getElementById('btnSalvarConta').textContent = conta ? 'Salvar alterações' : 'Criar conta';
    modalConta.style.display = 'flex';
    modalConta.setAttribute('aria-hidden', 'false');
}

function salvarConta() {
    const id = document.getElementById('contaEmEdicaoId').value;
    const nome = document.getElementById('nomeConta').value.trim();
    const saldoInicial = Number(document.getElementById('saldoInicialConta').value || 0);
    if (!nome || !Number.isFinite(saldoInicial)) {
        mostrarToast('Informe um nome e um saldo inicial válido.', 'aviso');
        return;
    }

    const dados = {
        nome,
        tipo: document.getElementById('tipoConta').value,
        cor: document.getElementById('corConta').value,
        saldoInicial
    };

    if (id) {
        Object.assign(obterContaPorId(id), dados, {
            atualizadaEm: new Date().toISOString()
        });
    } else {
        contas.push({
            id: `conta-${gerarIdUnico()}`,
            ...dados,
            icone: dados.tipo === 'carteira' ? 'wallet' : dados.tipo === 'investimento' ? 'chart-line' : 'building-columns',
            ativa: true,
            arquivada: false,
            sistema: false,
            criadaEm: new Date().toISOString(),
            atualizadaEm: new Date().toISOString()
        });
    }

    salvarNoBanco();
    fecharModalConta();
    renderizarTela();
    mostrarToast(id ? 'Conta atualizada.' : 'Conta criada.', 'sucesso');
}

function fecharModalTransferencia() {
    modalTransferencia.style.display = 'none';
    modalTransferencia.setAttribute('aria-hidden', 'true');
}

function abrirModalTransferencia() {
    if (obterContasAtivas().length < 2) {
        mostrarToast('Crie pelo menos duas contas ativas para transferir.', 'aviso');
        return;
    }
    preencherSeletorContas(document.getElementById('contaOrigemTransferencia'));
    preencherSeletorContas(document.getElementById('contaDestinoTransferencia'));
    document.getElementById('contaDestinoTransferencia').selectedIndex = 1;
    modalTransferencia.style.display = 'flex';
    modalTransferencia.setAttribute('aria-hidden', 'false');
}

function salvarTransferencia() {
    const origem = document.getElementById('contaOrigemTransferencia').value;
    const destino = document.getElementById('contaDestinoTransferencia').value;
    const valor = Number(document.getElementById('valorTransferencia').value);
    if (!origem || !destino || origem === destino || !Number.isFinite(valor) || valor <= 0) {
        mostrarToast('Informe contas diferentes e um valor válido.', 'aviso');
        return;
    }
    if (valor > calcularSaldoConta(origem)) {
        mostrarToast('Saldo insuficiente na conta de origem.', 'erro');
        return;
    }

    const agora = new Date();
    transacoes.push({
        id: gerarIdUnico(),
        tipo: 'transferencia',
        contaId: origem,
        contaOrigemId: origem,
        contaDestinoId: destino,
        descricao: document.getElementById('descricaoTransferencia').value.trim() || 'Transferência entre contas',
        valor,
        data: `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth() + 1).padStart(2, '0')}/${agora.getFullYear()}`,
        competencia: obterCompetenciaAtual(),
        origem: 'transferencia',
        categoriaText: 'Transferência',
        categoriaId: null,
        categoriaNome: '',
        classeCor: '',
        sinal: '↔',
        isPago: true
    });
    salvarNoBanco();
    fecharModalTransferencia();
    renderizarTela();
    mostrarToast('Transferência realizada.', 'sucesso');
}

document.getElementById('btnNovaConta').addEventListener('click', () => abrirModalConta());
document.getElementById('btnSalvarConta').addEventListener('click', salvarConta);
document.getElementById('btnCancelarConta').addEventListener('click', fecharModalConta);
document.getElementById('btnFecharModalConta').addEventListener('click', fecharModalConta);
document.getElementById('btnNovaTransferencia').addEventListener('click', abrirModalTransferencia);
document.getElementById('btnSalvarTransferencia').addEventListener('click', salvarTransferencia);
document.getElementById('btnCancelarTransferencia').addEventListener('click', fecharModalTransferencia);
document.getElementById('btnFecharModalTransferencia').addEventListener('click', fecharModalTransferencia);
document.getElementById('filtroContas').addEventListener('change', evento => {
    filtroContasAtual = evento.target.value;
    renderizarContas();
});

document.getElementById('contasGrid').addEventListener('click', evento => {
    const botao = evento.target.closest('[data-acao-conta][data-conta-id]');
    if (!botao) return;
    const conta = obterContaPorId(botao.dataset.contaId);
    if (!conta) return;
    const acao = botao.dataset.acaoConta;

    if (acao === 'editar') return abrirModalConta(conta);
    if (acao === 'arquivar') {
        if (obterContasAtivas().length <= 1) {
            return mostrarToast('Mantenha pelo menos uma conta ativa.', 'aviso');
        }
        if (Math.abs(calcularSaldoConta(conta.id)) > 0.009) {
            return mostrarToast('Transfira ou ajuste o saldo para zero antes de arquivar.', 'aviso');
        }
        if (recorrencias.some(r => String(r.contaId) === String(conta.id) && r.status !== 'encerrada' && !r.arquivada)) {
            return mostrarToast('Edite ou encerre as recorrências desta conta primeiro.', 'aviso');
        }
        if (cartoes.some(cartao =>
            String(cartao.contaPagamentoId) ===
                String(conta.id) &&
            cartao.ativo &&
            !cartao.arquivado
        )) {
            return mostrarToast('Altere a conta de pagamento dos cartões vinculados primeiro.', 'aviso');
        }
        conta.ativa = false;
        conta.arquivada = true;
    }
    if (acao === 'restaurar') {
        conta.ativa = true;
        conta.arquivada = false;
    }
    if (acao === 'excluir') {
        if (conta.sistema || contaEstaEmUso(conta.id)) {
            return mostrarToast('Esta conta possui vínculos. Arquive-a para preservar os dados.', 'aviso');
        }
        if (!confirm(`Excluir a conta "${conta.nome}"?`)) return;
        contas = contas.filter(item => String(item.id) !== String(conta.id));
    }
    salvarNoBanco();
    renderizarTela();
    mostrarToast(acao === 'excluir' ? 'Conta excluída.' : acao === 'restaurar' ? 'Conta restaurada.' : 'Conta arquivada.', 'sucesso');
});
