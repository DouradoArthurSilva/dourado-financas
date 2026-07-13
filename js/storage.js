    // 0. BANCO DE DADOS (LOCALSTORAGE) E ESTADO
    // ==========================================
    let transacoes = JSON.parse(localStorage.getItem('dourado_transacoes')) || [];
    // Se não tiver caixinhas, cria duas por padrão
    let caixinhas = JSON.parse(localStorage.getItem('dourado_caixinhas')) || [
        { id: 1, nome: 'Reserva do Casamento' },
        { id: 2, nome: 'Emergência' }
    ];
       function salvarNoBanco() {
        localStorage.setItem('dourado_transacoes', JSON.stringify(transacoes));
        localStorage.setItem('dourado_caixinhas', JSON.stringify(caixinhas));
    }