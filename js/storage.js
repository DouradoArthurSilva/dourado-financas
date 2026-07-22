// ==========================================
// 0. BANCO DE DADOS (LOCALSTORAGE) E ESTADO
// ==========================================

function lerJSONLocalStorage(chave, valorPadrao) {
    const valorSalvo = localStorage.getItem(chave);

    if (valorSalvo === null) {
        return valorPadrao;
    }

    try {
        return JSON.parse(valorSalvo);
    } catch (erro) {
        console.error(
            `Não foi possível ler "${chave}" do LocalStorage.`,
            erro
        );

        return valorPadrao;
    }
}

function obterCompetenciaAtual() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');

    return `${ano}-${mes}`;
}

function normalizarCompetencia(valor, valorPadrao = '') {
    const competencia = String(valor || '').slice(0, 7);

    return /^\d{4}-(0[1-9]|1[0-2])$/.test(competencia)
        ? competencia
        : valorPadrao;
}

let transacoes = lerJSONLocalStorage(
    'dourado_transacoes',
    []
);

const caixinhasSalvas = lerJSONLocalStorage(
    'dourado_caixinhas',
    null
);

const recorrenciasSalvas = lerJSONLocalStorage(
    'dourado_recorrencias',
    []
);

const caixinhasPadrao = [
    {
        id: 1,
        nome: 'Reserva do Casamento',
        meta: 0,
        icone: 'rings-wedding',
        cor: 'dourado',
        prazo: '',
        criadaEm: new Date().toISOString(),
        metaAtingidaAvisada: false
    },
    {
        id: 2,
        nome: 'Emergência',
        meta: 0,
        icone: 'shield-heart',
        cor: 'verde',
        prazo: '',
        criadaEm: new Date().toISOString(),
        metaAtingidaAvisada: false
    }
];

if (!Array.isArray(transacoes)) {
    transacoes = [];
}

let caixinhas = Array.isArray(caixinhasSalvas)
    ? caixinhasSalvas
    : caixinhasPadrao;

caixinhas = caixinhas.map((caixinha, indice) => {
    return {
        id: caixinha.id ?? Date.now() + indice,
        nome: String(
            caixinha.nome || 'Nova caixinha'
        ).trim(),
        meta: Number(caixinha.meta) || 0,
        icone: caixinha.icone || 'piggy-bank',
        cor: caixinha.cor || 'dourado',
        prazo: caixinha.prazo || '',
        criadaEm:
            caixinha.criadaEm ||
            new Date().toISOString(),
        metaAtingidaAvisada: Boolean(
            caixinha.metaAtingidaAvisada
        )
    };
});

function normalizarTerminoRecorrencia(termino) {
    const terminoSalvo =
        termino && typeof termino === 'object'
            ? termino
            : {};

    const tiposPermitidos = [
        'nunca',
        'quantidade',
        'competencia'
    ];

    let tipo = tiposPermitidos.includes(terminoSalvo.tipo)
        ? terminoSalvo.tipo
        : 'nunca';

    // Compatibilidade com o modelo anterior.
    if (terminoSalvo.tipo === 'data') {
        tipo = 'competencia';
    }

    if (terminoSalvo.tipo === 'repeticoes') {
        tipo = 'quantidade';
    }

    const quantidade = Number(
        terminoSalvo.quantidade ??
        terminoSalvo.repeticoes
    );

    const competenciaFinal = normalizarCompetencia(
        terminoSalvo.competenciaFinal ??
        terminoSalvo.data
    );

    if (
        tipo === 'quantidade' &&
        (!Number.isInteger(quantidade) || quantidade < 1)
    ) {
        tipo = 'nunca';
    }

    if (
        tipo === 'competencia' &&
        !competenciaFinal
    ) {
        tipo = 'nunca';
    }

    return {
        tipo,
        quantidade:
            tipo === 'quantidade'
                ? quantidade
                : null,
        competenciaFinal:
            tipo === 'competencia'
                ? competenciaFinal
                : null
    };
}

function normalizarRecorrencia(recorrencia, indice) {
    const dados =
        recorrencia && typeof recorrencia === 'object'
            ? recorrencia
            : {};

    const statusPermitidos = [
        'ativa',
        'pausada',
        'encerrada'
    ];

    let status = statusPermitidos.includes(dados.status)
        ? dados.status
        : 'ativa';

    // Compatibilidade com o campo antigo "ativo".
    if (
        !dados.status &&
        dados.ativo === false
    ) {
        status = 'pausada';
    }

    const tiposPermitidos = [
        'salario',
        'fixo',
        'variavel'
    ];

    const tipoAnterior =
        dados.tipoLancamento ||
        dados.categoria;

    const tipoLancamento =
        tiposPermitidos.includes(tipoAnterior)
            ? tipoAnterior
            : 'fixo';

    const diaInformado = Number(
        dados.diaVencimento ??
        dados.dia
    );

    const diaVencimento =
        Number.isInteger(diaInformado) &&
        diaInformado >= 1 &&
        diaInformado <= 31
            ? diaInformado
            : 1;

    const competenciaInicial = normalizarCompetencia(
        dados.competenciaInicial ??
        dados.inicio,
        obterCompetenciaAtual()
    );

    const competenciasAnteriores =
        dados.competenciasProcessadas ??
        dados.competenciasGeradas ??
        [];

    const competenciasProcessadas = Array.isArray(
        competenciasAnteriores
    )
        ? [
            ...new Set(
                competenciasAnteriores
                    .map(item =>
                        normalizarCompetencia(item)
                    )
                    .filter(Boolean)
            )
        ]
        : [];

    return {
        id:
            dados.id ??
            Date.now() + indice,

        status,

        frequencia: 'mensal',

        descricao: String(
            dados.descricao || ''
        ).trim(),

        valor: Number(dados.valor) || 0,

        tipoLancamento,

        pagamento: dados.pagamento || '',

        caixinhaId:
            dados.caixinhaId ?? null,

        diaVencimento,

        competenciaInicial,

        termino: normalizarTerminoRecorrencia(
            dados.termino
        ),

        competenciasProcessadas,

        criadaEm:
            dados.criadaEm ||
            new Date().toISOString(),

        atualizadaEm:
            dados.atualizadaEm ||
            dados.criadoEm ||
            new Date().toISOString()
    };
}

let recorrencias = Array.isArray(recorrenciasSalvas)
    ? recorrenciasSalvas.map(normalizarRecorrencia)
    : [];

function salvarNoBanco() {
    localStorage.setItem(
        'dourado_transacoes',
        JSON.stringify(transacoes)
    );

    localStorage.setItem(
        'dourado_caixinhas',
        JSON.stringify(caixinhas)
    );

    localStorage.setItem(
        'dourado_recorrencias',
        JSON.stringify(recorrencias)
    );
}