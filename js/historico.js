// Timeline do histórico. Mantive a tabela sendo preenchida por trás para não quebrar filtros antigos.
(function () {
    function dataParaChave(dataBr) {
        const [dia, mes, ano] = String(dataBr || '').split('/').map(Number);
        if (!dia || !mes || !ano) return 'Sem data';

        const data = new Date(ano, mes - 1, dia);
        const hoje = new Date();
        const ontem = new Date();
        ontem.setDate(hoje.getDate() - 1);

        const mesmaData = (a, b) =>
            a.getDate() === b.getDate() &&
            a.getMonth() === b.getMonth() &&
            a.getFullYear() === b.getFullYear();

        if (mesmaData(data, hoje)) return 'Hoje';
        if (mesmaData(data, ontem)) return 'Ontem';

        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    function iconeTipo(tipo) {
        const mapa = {
            salario: 'fa-arrow-trend-up',
            fixo: 'fa-receipt',
            variavel: 'fa-cart-shopping',
            guardado: 'fa-piggy-bank',
            resgate: 'fa-arrow-rotate-left',
            transferencia: 'fa-arrow-right-arrow-left',
            pagamento_fatura: 'fa-credit-card'
        };
        return mapa[tipo] || 'fa-circle-dollar-to-slot';
    }

    function render({ container, transacoes, formatarMoeda, escaparHTML, obterApresentacao, obterContaPorId, obterPagamentoFatura, onStatus, onExcluir }) {
        if (!container) return;

        const grupos = new Map();
        transacoes.forEach(item => {
            const chave = dataParaChave(item.data);
            if (!grupos.has(chave)) grupos.set(chave, []);
            grupos.get(chave).push(item);
        });

        container.innerHTML = '';
        container.hidden = transacoes.length === 0;

        grupos.forEach((itens, titulo) => {
            const grupo = document.createElement('section');
            grupo.className = 'timeline-group';
            grupo.innerHTML = `<h3>${escaparHTML(titulo)}</h3><div class="timeline-group-list"></div>`;
            const lista = grupo.querySelector('.timeline-group-list');

            itens.forEach(transacao => {
                const apresentacao = obterApresentacao(transacao);
                const contaOrigem = obterContaPorId(transacao.contaOrigemId || transacao.contaId);
                const contaDestino = obterContaPorId(transacao.contaDestinoId);
                const contaTexto = transacao.tipo === 'transferencia'
                    ? `${contaOrigem?.nome || 'Conta'} → ${contaDestino?.nome || 'Conta'}`
                    : contaOrigem?.nome || '';
                const pagamento = transacao.cartaoId
                    ? obterPagamentoFatura(transacao.cartaoId, transacao.competencia)
                    : null;
                const permiteStatus = (transacao.tipo === 'fixo' || transacao.tipo === 'variavel') && !transacao.cartaoId;
                const status = transacao.cartaoId
                    ? (pagamento ? 'Fatura paga' : 'Na fatura')
                    : permiteStatus
                        ? (transacao.isPago ? 'Pago' : 'Pendente')
                        : 'Efetivado';

                const item = document.createElement('article');
                item.className = 'timeline-item';
                item.dataset.id = String(transacao.id);
                item.innerHTML = `
                    <span class="timeline-icon timeline-icon-${escaparHTML(transacao.tipo)}">
                        <i class="fa-solid ${iconeTipo(transacao.tipo)}"></i>
                    </span>
                    <div class="timeline-copy">
                        <div class="timeline-copy-top">
                            <strong>${escaparHTML(transacao.descricao)}</strong>
                            <span class="${escaparHTML(apresentacao.classe)}">${escaparHTML(apresentacao.sinal)} R$ ${formatarMoeda(transacao.valor)}</span>
                        </div>
                        <div class="timeline-meta">
                            <span>${escaparHTML(transacao.categoriaNome || transacao.categoriaText || 'Movimentação')}</span>
                            ${contaTexto ? `<span><i class="fa-solid fa-building-columns"></i> ${escaparHTML(contaTexto)}</span>` : ''}
                        </div>
                        <div class="timeline-actions">
                            ${permiteStatus ? `<button type="button" data-timeline-action="status" class="status-badge ${transacao.isPago ? 'status-pago' : 'status-pendente'}">${status}</button>` : `<span class="status-badge status-static ${pagamento ? 'status-pago' : ''}">${status}</span>`}
                            <button type="button" data-timeline-action="excluir" class="timeline-delete" aria-label="Excluir lançamento"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </div>
                `;
                lista.appendChild(item);
            });

            container.appendChild(grupo);
        });

        if (!container.dataset.eventsReady) {
            container.addEventListener('click', evento => {
                const item = evento.target.closest('.timeline-item');
                const botao = evento.target.closest('[data-timeline-action]');
                if (!item || !botao) return;
                const id = Number(item.dataset.id);
                if (botao.dataset.timelineAction === 'status') onStatus(id);
                if (botao.dataset.timelineAction === 'excluir') onExcluir(id);
            });
            container.dataset.eventsReady = 'true';
        }
    }

    window.DouradoHistorico = { render };
})();
