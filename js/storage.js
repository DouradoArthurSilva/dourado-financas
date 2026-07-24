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

const categoriasSalvas = lerJSONLocalStorage(
    'dourado_categorias',
    null
);

const categoriasPadrao = [
    {
        id: 'receita-salario',
        nome: 'Salário',
        tipo: 'salario',
        categoriaPaiId: null,
        icone: 'money-bill-wave',
        cor: '#4f97ff'
    },
    {
        id: 'receita-extra',
        nome: 'Renda extra',
        tipo: 'salario',
        categoriaPaiId: null,
        icone: 'coins',
        cor: '#31cc70'
    },
    {
        id: 'fixo-moradia',
        nome: 'Moradia',
        tipo: 'fixo',
        categoriaPaiId: null,
        icone: 'house',
        cor: '#ffad19'
    },
    {
        id: 'fixo-contas',
        nome: 'Contas',
        tipo: 'fixo',
        categoriaPaiId: null,
        icone: 'file-invoice-dollar',
        cor: '#4f97ff'
    },
    {
        id: 'fixo-assinaturas',
        nome: 'Assinaturas',
        tipo: 'fixo',
        categoriaPaiId: null,
        icone: 'repeat',
        cor: '#9b7cff'
    },
    {
        id: 'fixo-saude',
        nome: 'Saúde',
        tipo: 'fixo',
        categoriaPaiId: null,
        icone: 'heart-pulse',
        cor: '#ff5b5b'
    },
    {
        id: 'fixo-educacao',
        nome: 'Educação',
        tipo: 'fixo',
        categoriaPaiId: null,
        icone: 'graduation-cap',
        cor: '#9b7cff'
    },
    {
        id: 'variavel-alimentacao',
        nome: 'Alimentação',
        tipo: 'variavel',
        categoriaPaiId: null,
        icone: 'utensils',
        cor: '#ffad19'
    },
    {
        id: 'variavel-mercado',
        nome: 'Mercado',
        tipo: 'variavel',
        categoriaPaiId: null,
        icone: 'basket-shopping',
        cor: '#31cc70'
    },
    {
        id: 'variavel-transporte',
        nome: 'Transporte',
        tipo: 'variavel',
        categoriaPaiId: null,
        icone: 'car',
        cor: '#4f97ff'
    },
    {
        id: 'variavel-lazer',
        nome: 'Lazer',
        tipo: 'variavel',
        categoriaPaiId: null,
        icone: 'gamepad',
        cor: '#9b7cff'
    },
    {
        id: 'variavel-compras',
        nome: 'Compras',
        tipo: 'variavel',
        categoriaPaiId: null,
        icone: 'bag-shopping',
        cor: '#ff5b5b'
    },
    {
        id: 'variavel-outros',
        nome: 'Outros',
        tipo: 'variavel',
        categoriaPaiId: null,
        icone: 'ellipsis',
        cor: '#8f99a8'
    }
];

function normalizarCategoria(categoria, indice) {
    const dados =
        categoria && typeof categoria === 'object'
            ? categoria
            : {};

    const tiposPermitidos = [
        'salario',
        'fixo',
        'variavel'
    ];

    return {
        id: String(
            dados.id ||
            `categoria-${Date.now()}-${indice}`
        ),
        nome: String(
            dados.nome || 'Nova categoria'
        ).trim(),
        tipo: tiposPermitidos.includes(dados.tipo)
            ? dados.tipo
            : 'variavel',
        categoriaPaiId:
            dados.categoriaPaiId === null ||
            dados.categoriaPaiId === undefined
                ? null
                : String(dados.categoriaPaiId),
        icone: String(
            dados.icone || 'tag'
        ),
        cor: String(
            dados.cor || '#8f99a8'
        ),
        ativa: dados.ativa !== false,
        sistema: dados.sistema === true,
        criadaEm:
            dados.criadaEm ||
            new Date().toISOString(),
        atualizadaEm:
            dados.atualizadaEm ||
            dados.criadaEm ||
            new Date().toISOString()
    };
}

let categorias = (
    Array.isArray(categoriasSalvas)
        ? categoriasSalvas
        : categoriasPadrao.map(categoria => ({
            ...categoria,
            sistema: true
        }))
).map(normalizarCategoria);

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

        categoriaId:
            dados.categoriaId === null ||
            dados.categoriaId === undefined
                ? null
                : String(dados.categoriaId),

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

    localStorage.setItem(
        'dourado_categorias',
        JSON.stringify(categorias)
    );
}
