// Controle dos cartões e das faturas.
// Essa foi uma das partes mais trabalhosas porque fechamento, vencimento e
// parcelamento precisam cair no mês certo.

let filtroCartoesAtual = 'ativos';

function obterCartaoPorId(id) {
    return cartoes.find(cartao =>
        String(cartao.id) === String(id)
    ) || null;
}

function obterCartoesAtivos() {
    return cartoes.filter(cartao =>
        cartao.ativo && !cartao.arquivado
    );
}

function somarMesesCompetencia(competencia, meses) {
    const [ano, mes] = competencia.split('-').map(Number);
    const data = new Date(ano, mes - 1 + meses, 1);
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

// Descobre em qual fatura a compra entra, considerando o dia de fechamento.
function obterCompetenciaInicialCompra(cartao, dataCompra) {
    const [ano, mes, dia] = dataCompra.split('-').map(Number);
    const competenciaCompra =
        `${ano}-${String(mes).padStart(2, '0')}`;
    const dataDaCompra = new Date(ano, mes - 1, dia);
    let competenciaFechamento = competenciaCompra;
    let dataFechamento = obterDataDaFatura(
        competenciaFechamento,
        cartao.diaFechamento
    );

    if (dataDaCompra > dataFechamento) {
        competenciaFechamento = somarMesesCompetencia(
            competenciaFechamento,
            1
        );
        dataFechamento = obterDataDaFatura(
            competenciaFechamento,
            cartao.diaFechamento
        );
    }

    return cartao.diaVencimento <= cartao.diaFechamento
        ? somarMesesCompetencia(competenciaFechamento, 1)
        : competenciaFechamento;
}

function obterComprasFatura(cartaoId, competencia) {
    return transacoes.filter(transacao =>
        String(transacao.cartaoId) === String(cartaoId) &&
        ['fixo', 'variavel'].includes(transacao.tipo) &&
        transacao.competencia === competencia
    );
}

function obterPagamentoFatura(cartaoId, competencia) {
    return transacoes.find(transacao =>
        transacao.tipo === 'pagamento_fatura' &&
        String(transacao.cartaoId) === String(cartaoId) &&
        transacao.competenciaFatura === competencia
    ) || null;
}

function calcularTotalFatura(cartaoId, competencia) {
    return obterComprasFatura(cartaoId, competencia)
        .reduce((total, compra) =>
            total + (Number(compra.valor) || 0),
        0);
}

// Somo apenas compras de faturas que ainda não foram pagas.
function calcularLimiteUtilizado(cartaoId) {
    return transacoes
        .filter(transacao =>
            ['fixo', 'variavel'].includes(transacao.tipo) &&
            String(transacao.cartaoId) === String(cartaoId) &&
            !obterPagamentoFatura(
                cartaoId,
                transacao.competencia
            )
        )
        .reduce((total, compra) =>
            total + (Number(compra.valor) || 0),
        0);
}

function obterDataDaFatura(competencia, dia) {
    const [ano, mes] = competencia.split('-').map(Number);
    const ultimoDia = new Date(ano, mes, 0).getDate();

    return new Date(
        ano,
        mes - 1,
        Math.min(Math.max(Number(dia) || 1, 1), ultimoDia)
    );
}

function formatarDataCurta(data) {
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Centralizei o status para não repetir regra de aberta, fechada ou vencida.
function obterStatusFatura(cartao, competencia, total, pagamento) {
    if (pagamento) {
        return {
            codigo: 'paga',
            texto: 'Paga'
        };
    }

    if (total <= 0) {
        return {
            codigo: 'sem-lancamentos',
            texto: 'Sem lançamentos'
        };
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const competenciaFechamento =
        cartao.diaVencimento <= cartao.diaFechamento
            ? somarMesesCompetencia(competencia, -1)
            : competencia;
    const fechamento = obterDataDaFatura(
        competenciaFechamento,
        cartao.diaFechamento
    );
    const vencimento = obterDataDaFatura(
        competencia,
        cartao.diaVencimento
    );

    if (hoje > vencimento) {
        return {
            codigo: 'vencida',
            texto: 'Vencida'
        };
    }

    if (hoje > fechamento) {
        return {
            codigo: 'fechada',
            texto: 'Fechada'
        };
    }

    return {
        codigo: 'aberta',
        texto: 'Em aberto'
    };
}

function preencherSelectCartoes(seletor, selecionado = null) {
    seletor.innerHTML = '';
    obterCartoesAtivos().forEach(cartao => {
        const option = document.createElement('option');
        option.value = cartao.id;
        option.textContent = cartao.nome;
        seletor.appendChild(option);
    });
    if (obterCartoesAtivos().some(c =>
        String(c.id) === String(selecionado)
    )) {
        seletor.value = String(selecionado);
    }
}

function renderizarCartoes() {
    const grid = document.getElementById('cartoesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const cartoesVisiveis = cartoes.filter(cartao => {
        if (filtroCartoesAtual === 'todos') return true;
        if (filtroCartoesAtual === 'arquivados') {
            return cartao.arquivado;
        }
        return cartao.ativo && !cartao.arquivado;
    });

    document.getElementById('cartoesVazio').hidden =
        cartoesVisiveis.length > 0;

    cartoesVisiveis.forEach(cartao => {
        const utilizado = calcularLimiteUtilizado(cartao.id);
        const disponivel = Math.max(cartao.limite - utilizado, 0);
        const percentual = cartao.limite > 0
            ? Math.min((utilizado / cartao.limite) * 100, 100)
            : 0;

        grid.insertAdjacentHTML('beforeend', `
            <article class="cartao-card ${cartao.arquivado ? 'is-arquivado' : ''}" style="--cartao-cor:${cartao.cor}">
                <div class="cartao-topo">
                    <span><i class="fa-solid fa-credit-card"></i></span>
                    <small>${escaparHTML(cartao.bandeira)}</small>
                </div>
                <h3>${escaparHTML(cartao.nome)}</h3>
                <div class="cartao-limites">
                    <div><span>Disponível</span><strong>R$ ${formatarMoeda(disponivel)}</strong></div>
                    <div><span>Limite</span><strong>R$ ${formatarMoeda(cartao.limite)}</strong></div>
                </div>
                <div class="cartao-barra"><span style="width:${percentual}%"></span></div>
                <p>Fecha dia ${cartao.diaFechamento} · Vence dia ${cartao.diaVencimento}</p>
                <div class="conta-acoes">
                    <button data-acao-cartao="editar" data-cartao-id="${escaparHTML(cartao.id)}">Editar</button>
                    <button data-acao-cartao="${cartao.arquivado ? 'restaurar' : 'arquivar'}" data-cartao-id="${escaparHTML(cartao.id)}">${cartao.arquivado ? 'Restaurar' : 'Arquivar'}</button>
                    <button class="conta-acao-perigo" data-acao-cartao="excluir" data-cartao-id="${escaparHTML(cartao.id)}">Excluir</button>
                </div>
            </article>
        `);
    });

    const seletor = document.getElementById('cartaoFaturaSelecionado');
    const atual = seletor.value;
    preencherSelectCartoes(seletor, atual);
    renderizarFatura();
}

function renderizarFatura() {
    const cartaoId = document.getElementById(
        'cartaoFaturaSelecionado'
    ).value;
    const competencia = document.getElementById(
        'competenciaFatura'
    ).value || obterCompetenciaAtual();
    const cartao = obterCartaoPorId(cartaoId);
    const lista = document.getElementById('faturaLista');
    lista.innerHTML = '';

    if (!cartao) {
        document.getElementById('tituloFatura').textContent = 'Selecione um cartão';
        document.getElementById('totalFatura').textContent = 'R$ 0,00';
        document.getElementById('totalFaturaFixo').textContent = 'R$ 0,00';
        document.getElementById('totalFaturaVariavel').textContent = 'R$ 0,00';
        document.getElementById('fechamentoFatura').textContent = '--';
        document.getElementById('vencimentoFatura').textContent = '--';
        const statusSemCartao = document.getElementById('statusFatura');
        statusSemCartao.textContent = 'Sem cartão';
        statusSemCartao.dataset.status = 'sem-lancamentos';
        document.getElementById('quantidadeComprasFatura').textContent = '0 compras';
        lista.innerHTML = '<p class="fatura-vazia">Selecione um cartão para consultar a fatura.</p>';
        document.getElementById('btnPagarFatura').disabled = true;
        return;
    }

    const compras = obterComprasFatura(cartao.id, competencia)
        .sort((compraA, compraB) =>
            String(compraA.descricao).localeCompare(
                String(compraB.descricao),
                'pt-BR'
            )
        );
    const total = calcularTotalFatura(cartao.id, competencia);
    const totalFixo = compras
        .filter(compra => compra.tipo === 'fixo')
        .reduce((soma, compra) => soma + (Number(compra.valor) || 0), 0);
    const totalVariavel = compras
        .filter(compra => compra.tipo === 'variavel')
        .reduce((soma, compra) => soma + (Number(compra.valor) || 0), 0);
    const pagamento = obterPagamentoFatura(cartao.id, competencia);
    const competenciaFechamento =
        cartao.diaVencimento <= cartao.diaFechamento
            ? somarMesesCompetencia(competencia, -1)
            : competencia;
    const fechamento = obterDataDaFatura(
        competenciaFechamento,
        cartao.diaFechamento
    );
    const vencimento = obterDataDaFatura(
        competencia,
        cartao.diaVencimento
    );
    const status = obterStatusFatura(
        cartao,
        competencia,
        total,
        pagamento
    );
    document.getElementById('tituloFatura').textContent =
        `${cartao.nome} · ${formatarTituloCompetencia(competencia)}`;
    document.getElementById('totalFatura').textContent =
        `R$ ${formatarMoeda(total)}`;
    document.getElementById('totalFaturaFixo').textContent =
        `R$ ${formatarMoeda(totalFixo)}`;
    document.getElementById('totalFaturaVariavel').textContent =
        `R$ ${formatarMoeda(totalVariavel)}`;
    document.getElementById('fechamentoFatura').textContent =
        formatarDataCurta(fechamento);
    document.getElementById('vencimentoFatura').textContent =
        formatarDataCurta(vencimento);
    const statusFatura = document.getElementById('statusFatura');
    statusFatura.textContent = status.texto;
    statusFatura.dataset.status = status.codigo;
    document.getElementById('quantidadeComprasFatura').textContent =
        `${compras.length} ${compras.length === 1 ? 'compra' : 'compras'}`;

    compras.forEach(compra => {
        const parcelaAtual = Number(compra.parcelaAtual) || 1;
        const totalParcelas = Number(compra.totalParcelas) || 1;
        const categoria = compra.categoriaNome || 'Sem categoria';
        const tipoTexto = compra.tipo === 'fixo'
            ? 'Gasto fixo'
            : 'Gasto variável';

        lista.insertAdjacentHTML('beforeend', `
            <article class="fatura-item">
                <div class="fatura-item-identidade">
                    <strong>${escaparHTML(compra.descricao)}</strong>
                    <span>
                        ${escaparHTML(categoria)}
                        · Parcela ${parcelaAtual}/${totalParcelas}
                        ${compra.data ? ` · ${escaparHTML(compra.data)}` : ''}
                    </span>
                </div>
                <div class="fatura-item-valor">
                    <span class="fatura-tipo fatura-tipo-${compra.tipo}">
                        ${tipoTexto}
                    </span>
                    <strong>R$ ${formatarMoeda(compra.valor)}</strong>
                </div>
            </article>
        `);
    });

    if (compras.length === 0) {
        lista.innerHTML = '<p class="fatura-vazia">Nenhuma compra nesta fatura.</p>';
    }

    const botao = document.getElementById('btnPagarFatura');
    botao.disabled = Boolean(pagamento) || total <= 0;
    botao.innerHTML = pagamento
        ? '<i class="fa-solid fa-check"></i> Fatura paga'
        : '<i class="fa-solid fa-check"></i> Pagar fatura';
}

const modalCartao = document.getElementById('modalCartao');
const modalCompraCartao = document.getElementById('modalCompraCartao');

function fecharModalCartao() {
    modalCartao.style.display = 'none';
    modalCartao.setAttribute('aria-hidden', 'true');
}

function abrirModalCartao(cartao = null) {
    document.getElementById('cartaoEmEdicaoId').value = cartao ? cartao.id : '';
    document.getElementById('nomeCartao').value = cartao ? cartao.nome : '';
    document.getElementById('bandeiraCartao').value = cartao ? cartao.bandeira : 'mastercard';
    document.getElementById('limiteCartao').value = cartao ? cartao.limite : '';
    document.getElementById('fechamentoCartao').value = cartao ? cartao.diaFechamento : 1;
    document.getElementById('vencimentoCartao').value = cartao ? cartao.diaVencimento : 10;
    document.getElementById('corCartao').value = cartao ? cartao.cor : '#9b7cff';
    preencherSeletorContas(document.getElementById('contaPagamentoCartao'), cartao ? cartao.contaPagamentoId : null);
    document.getElementById('tituloModalCartao').textContent = cartao ? 'Editar cartão' : 'Novo cartão';
    document.getElementById('btnSalvarCartao').textContent = cartao ? 'Salvar alterações' : 'Criar cartão';
    modalCartao.style.display = 'flex';
    modalCartao.setAttribute('aria-hidden', 'false');
}

function salvarCartao() {
    const id = document.getElementById('cartaoEmEdicaoId').value;
    const nome = document.getElementById('nomeCartao').value.trim();
    const limite = Number(document.getElementById('limiteCartao').value);
    const fechamento = Number(document.getElementById('fechamentoCartao').value);
    const vencimento = Number(document.getElementById('vencimentoCartao').value);
    if (!nome || !Number.isFinite(limite) || limite <= 0 ||
        !Number.isInteger(fechamento) || fechamento < 1 || fechamento > 31 ||
        !Number.isInteger(vencimento) || vencimento < 1 || vencimento > 31) {
        mostrarToast('Preencha os dados do cartão corretamente.', 'aviso');
        return;
    }
    if (limite < (id ? calcularLimiteUtilizado(id) : 0)) {
        mostrarToast('O limite não pode ser menor que o valor já utilizado.', 'aviso');
        return;
    }
    const dados = {
        nome,
        bandeira: document.getElementById('bandeiraCartao').value,
        limite,
        diaFechamento: fechamento,
        diaVencimento: vencimento,
        contaPagamentoId: document.getElementById('contaPagamentoCartao').value,
        cor: document.getElementById('corCartao').value,
        atualizadoEm: new Date().toISOString()
    };
    if (id) Object.assign(obterCartaoPorId(id), dados);
    else cartoes.push({
        id: `cartao-${gerarIdUnico()}`,
        ...dados,
        ativo: true,
        arquivado: false,
        criadoEm: new Date().toISOString()
    });
    salvarNoBanco();
    fecharModalCartao();
    renderizarTela();
    mostrarToast(id ? 'Cartão atualizado.' : 'Cartão criado.', 'sucesso');
}

function fecharCompraCartao() {
    modalCompraCartao.style.display = 'none';
    modalCompraCartao.setAttribute('aria-hidden', 'true');
}

function abrirCompraCartao() {
    if (obterCartoesAtivos().length === 0) {
        mostrarToast('Crie um cartão ativo primeiro.', 'aviso');
        return;
    }
    preencherSelectCartoes(document.getElementById('cartaoCompra'));
    document.getElementById('tipoCompraCartao').value = 'variavel';
    preencherSeletorCategorias(
        document.getElementById('categoriaCompraCartao'),
        'variavel'
    );
    document.getElementById('dataCompraCartao').value =
        new Date().toISOString().slice(0, 10);
    modalCompraCartao.style.display = 'flex';
    modalCompraCartao.setAttribute('aria-hidden', 'false');
}

function salvarCompraCartao() {
    const cartao = obterCartaoPorId(document.getElementById('cartaoCompra').value);
    const descricao = document.getElementById('descricaoCompraCartao').value.trim();
    const valorTotal = Number(document.getElementById('valorCompraCartao').value);
    const parcelas = Number(document.getElementById('parcelasCompraCartao').value);
    const dataCompra = document.getElementById('dataCompraCartao').value;
    const tipo = document.getElementById('tipoCompraCartao').value;
    const categoriaId = document.getElementById('categoriaCompraCartao').value || null;
    const categoria = categoriaId ? obterCategoriaPorId(categoriaId) : null;
    if (!cartao || !descricao || !dataCompra || !Number.isFinite(valorTotal) || valorTotal <= 0 ||
        !Number.isInteger(parcelas) || parcelas < 1 || parcelas > 60 ||
        !['fixo', 'variavel'].includes(tipo)) {
        mostrarToast('Preencha os dados da compra corretamente.', 'aviso');
        return;
    }
    if (categoria && categoria.tipo !== tipo) {
        mostrarToast('Escolha uma categoria compatível com o tipo do gasto.', 'aviso');
        return;
    }
    if (valorTotal > cartao.limite - calcularLimiteUtilizado(cartao.id)) {
        mostrarToast('Limite insuficiente neste cartão.', 'erro');
        return;
    }

    const compraId = gerarIdUnico();
    const inicial = obterCompetenciaInicialCompra(cartao, dataCompra);
    const totalCentavos = Math.round(valorTotal * 100);
    const baseCentavos = Math.floor(totalCentavos / parcelas);
    const [ano, mes, dia] = dataCompra.split('-');

    for (let indice = 0; indice < parcelas; indice += 1) {
        const centavos = indice === parcelas - 1
            ? totalCentavos - baseCentavos * (parcelas - 1)
            : baseCentavos;
        transacoes.push({
            id: gerarIdUnico() + indice,
            tipo,
            cartaoId: cartao.id,
            compraCartaoId: compraId,
            parcelaAtual: indice + 1,
            totalParcelas: parcelas,
            contaId: null,
            descricao: parcelas > 1 ? `${descricao} (${indice + 1}/${parcelas})` : descricao,
            valor: centavos / 100,
            data: `${dia}/${mes}/${ano}`,
            competencia: somarMesesCompetencia(inicial, indice),
            origem: 'cartao',
            categoriaText: tipo === 'fixo'
                ? 'Gasto Fixo'
                : 'Gasto Variável',
            categoriaId,
            categoriaNome: categoria ? categoria.nome : '',
            classeCor: 'amount-neg',
            sinal: '-',
            isPago: false
        });
    }
    salvarNoBanco();
    fecharCompraCartao();

    document.getElementById('cartaoFaturaSelecionado').value =
        String(cartao.id);
    document.getElementById('competenciaFatura').value =
        inicial;

    renderizarTela();

    const nomeCompetencia = formatarTituloCompetencia(inicial);
    mostrarToast(
        parcelas > 1
            ? `${parcelas} parcelas criadas. A primeira está na fatura de ${nomeCompetencia}.`
            : `Compra adicionada à fatura de ${nomeCompetencia}.`,
        'sucesso'
    );
}

function pagarFatura() {
    const cartao = obterCartaoPorId(document.getElementById('cartaoFaturaSelecionado').value);
    const competencia = document.getElementById('competenciaFatura').value;
    const total = cartao ? calcularTotalFatura(cartao.id, competencia) : 0;
    if (!cartao || total <= 0 || obterPagamentoFatura(cartao.id, competencia)) return;
    const conta = obterContaPorId(cartao.contaPagamentoId);
    if (!conta || !conta.ativa || conta.arquivada) {
        mostrarToast('Escolha uma conta de pagamento ativa no cartão.', 'aviso');
        return;
    }
    if (calcularSaldoConta(conta.id) < total) {
        mostrarToast(`Saldo insuficiente em ${conta.nome}.`, 'erro');
        return;
    }
    const agora = new Date();
    transacoes.push({
        id: gerarIdUnico(),
        tipo: 'pagamento_fatura',
        cartaoId: cartao.id,
        contaId: conta.id,
        competenciaFatura: competencia,
        descricao: `Pagamento da fatura ${cartao.nome}`,
        valor: total,
        data: `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth() + 1).padStart(2, '0')}/${agora.getFullYear()}`,
        competencia: obterCompetenciaAtual(),
        origem: 'fatura',
        categoriaText: 'Pagamento de fatura',
        categoriaId: null,
        categoriaNome: '',
        classeCor: 'amount-neg',
        sinal: '-',
        isPago: true
    });
    salvarNoBanco();
    renderizarTela();
    mostrarToast('Fatura paga com sucesso.', 'sucesso');
}

document.getElementById('btnNovoCartao').addEventListener('click', () => abrirModalCartao());
document.getElementById('btnNovaCompraCartao').addEventListener('click', abrirCompraCartao);
document.getElementById('btnSalvarCartao').addEventListener('click', salvarCartao);
document.getElementById('btnCancelarCartao').addEventListener('click', fecharModalCartao);
document.getElementById('btnFecharModalCartao').addEventListener('click', fecharModalCartao);
document.getElementById('btnSalvarCompraCartao').addEventListener('click', salvarCompraCartao);
document.getElementById('tipoCompraCartao').addEventListener('change', evento => {
    preencherSeletorCategorias(
        document.getElementById('categoriaCompraCartao'),
        evento.target.value
    );
});
document.getElementById('btnCancelarCompraCartao').addEventListener('click', fecharCompraCartao);
document.getElementById('btnFecharCompraCartao').addEventListener('click', fecharCompraCartao);
document.getElementById('btnPagarFatura').addEventListener('click', pagarFatura);
document.getElementById('cartaoFaturaSelecionado').addEventListener('change', renderizarFatura);
document.getElementById('competenciaFatura').value = obterCompetenciaAtual();
document.getElementById('competenciaFatura').addEventListener('change', renderizarFatura);
document.getElementById('filtroCartoes').addEventListener('change', evento => {
    filtroCartoesAtual = evento.target.value;
    renderizarCartoes();
});

document.getElementById('cartoesGrid').addEventListener('click', evento => {
    const botao = evento.target.closest('[data-acao-cartao][data-cartao-id]');
    if (!botao) return;
    const cartao = obterCartaoPorId(botao.dataset.cartaoId);
    if (!cartao) return;
    const acao = botao.dataset.acaoCartao;
    if (acao === 'editar') return abrirModalCartao(cartao);
    if (acao === 'arquivar') {
        if (calcularLimiteUtilizado(cartao.id) > 0) {
            return mostrarToast('Pague todas as faturas antes de arquivar.', 'aviso');
        }
        cartao.ativo = false;
        cartao.arquivado = true;
    }
    if (acao === 'restaurar') {
        cartao.ativo = true;
        cartao.arquivado = false;
    }
    if (acao === 'excluir') {
        if (transacoes.some(t => String(t.cartaoId) === String(cartao.id))) {
            return mostrarToast('Este cartão possui histórico. Arquive-o para preservar os dados.', 'aviso');
        }
        if (!confirm(`Excluir o cartão "${cartao.nome}"?`)) return;
        cartoes = cartoes.filter(item => String(item.id) !== String(cartao.id));
    }
    salvarNoBanco();
    renderizarTela();
});
