// ==========================================
// 0. BANCO DE DADOS (LOCALSTORAGE) E ESTADO
// ==========================================
let transacoes = JSON.parse(
    localStorage.getItem('dourado_transacoes')
) || [];

const caixinhasSalvas = JSON.parse(
    localStorage.getItem('dourado_caixinhas')
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

let caixinhas = Array.isArray(caixinhasSalvas)
    ? caixinhasSalvas
    : caixinhasPadrao;

caixinhas = caixinhas.map((caixinha, indice) => {
    return {
        id: caixinha.id ?? Date.now() + indice,
        nome: String(caixinha.nome || 'Nova caixinha').trim(),
        meta: Number(caixinha.meta) || 0,
        icone: caixinha.icone || 'piggy-bank',
        cor: caixinha.cor || 'dourado',
        prazo: caixinha.prazo || '',
        criadaEm: caixinha.criadaEm || new Date().toISOString(),
        metaAtingidaAvisada: Boolean(
            caixinha.metaAtingidaAvisada
        )
    };
});

function salvarNoBanco() {
    localStorage.setItem(
        'dourado_transacoes',
        JSON.stringify(transacoes)
    );

    localStorage.setItem(
        'dourado_caixinhas',
        JSON.stringify(caixinhas)
    );
}