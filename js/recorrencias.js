// Funções pequenas das recorrências. Assim a regra de data fica em um lugar só.
(function () {
    function competenciaParaData(competencia, dia) {
        const [ano, mes] = String(competencia || '').split('-').map(Number);
        if (!ano || !mes) return null;
        const ultimoDia = new Date(ano, mes, 0).getDate();
        return new Date(ano, mes - 1, Math.min(Number(dia) || 1, ultimoDia));
    }

    function proximaCompetencia(recorrencia) {
        if (!recorrencia || recorrencia.status !== 'ativa') return null;

        const agora = new Date();
        const competenciaAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
        const processadas = Array.isArray(recorrencia.competenciasProcessadas)
            ? recorrencia.competenciasProcessadas
            : [];

        let [ano, mes] = String(recorrencia.competenciaInicial || competenciaAtual)
            .split('-')
            .map(Number);

        for (let tentativa = 0; tentativa < 240; tentativa += 1) {
            const competencia = `${ano}-${String(mes).padStart(2, '0')}`;
            const data = competenciaParaData(competencia, recorrencia.diaVencimento);

            if (data && data >= new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()) && !processadas.includes(competencia)) {
                return data;
            }

            mes += 1;
            if (mes > 12) {
                mes = 1;
                ano += 1;
            }
        }

        return null;
    }

    function formatarData(data) {
        return data
            ? data.toLocaleDateString('pt-BR')
            : 'Sem próxima cobrança';
    }

    window.DouradoRecorrencias = {
        proximaCompetencia,
        formatarData
    };
})();
