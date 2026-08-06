// Insights simples do painel. Separei aqui para o script principal não crescer ainda mais.
(function () {
    function somar(lista, tipos) {
        return lista
            .filter(item => tipos.includes(item.tipo))
            .reduce((total, item) => total + (Number(item.valor) || 0), 0);
    }

    function obterMaiorCategoria(transacoes) {
        const totais = new Map();

        transacoes
            .filter(item => item.tipo === 'fixo' || item.tipo === 'variavel')
            .forEach(item => {
                const nome = item.categoriaNome || item.categoriaText || 'Sem categoria';
                totais.set(nome, (totais.get(nome) || 0) + (Number(item.valor) || 0));
            });

        return [...totais.entries()]
            .sort((a, b) => b[1] - a[1])[0] || null;
    }

    function calcularProjecao(gastos, competencia) {
        const [ano, mes] = competencia.split('-').map(Number);
        const agora = new Date();
        const ehMesAtual = agora.getFullYear() === ano && agora.getMonth() + 1 === mes;
        const diasNoMes = new Date(ano, mes, 0).getDate();
        const diaBase = ehMesAtual ? Math.max(agora.getDate(), 1) : diasNoMes;

        if (gastos <= 0 || diaBase <= 0) return 0;
        return (gastos / diaBase) * diasNoMes;
    }

    function gerar({ transacoes, competencia, estado, caixinhas, saldosCaixinhas }) {
        const despesas = somar(transacoes, ['fixo', 'variavel']);
        const maiorCategoria = obterMaiorCategoria(transacoes);
        const projecao = calcularProjecao(despesas, competencia);
        const taxaEconomia = estado.totalSalario > 0
            ? Math.max(0, (estado.totalGuardado / estado.totalSalario) * 100)
            : 0;

        const metas = (caixinhas || [])
            .map(caixinha => {
                const meta = Number(caixinha.meta) || 0;
                const saldo = Number(saldosCaixinhas?.[caixinha.id]) || 0;
                return {
                    nome: caixinha.nome,
                    meta,
                    saldo,
                    falta: Math.max(meta - saldo, 0),
                    percentual: meta > 0 ? (saldo / meta) * 100 : 0
                };
            })
            .filter(item => item.meta > 0 && item.saldo < item.meta)
            .sort((a, b) => b.percentual - a.percentual);

        return {
            maiorCategoria,
            projecao,
            taxaEconomia,
            proximaMeta: metas[0] || null
        };
    }

    window.DouradoInsights = { gerar };
})();
