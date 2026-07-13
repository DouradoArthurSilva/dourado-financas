    let sobraTotal = 0; 
    let totalSalario = 0;
    let totalGuardado = 0;
    let totalFixo = 0;
    let totalVariavel = 0;
    // ==========================================
    // CONFIGURAÇÃO DO GRÁFICO (CHART.JS)
    // ==========================================
    let graficoApp;
    window.onload = function() {
        const canvasGrafico = document.getElementById('graficoResumo');
        if (canvasGrafico) {
            const ctx = canvasGrafico.getContext('2d');
            graficoApp = new Chart(ctx, {
                type: 'doughnut', 
                data: {
                    labels: ['Despesas', 'Sobra'],
                    datasets: [{ data: [0, 100], backgroundColor: ['#e74c3c', '#27ae60'], borderWidth: 2 }]
                },
                options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom' } } }
            });
        }
        renderizarTela();
    };

    // ==========================================
    // 1. ELEMENTOS DA TELA
    // ==========================================
    const tbodyHistorico = document.querySelector('.history-section tbody');
    const caixinhasGrid = document.getElementById('caixinhasGrid');
    const caixinhaSelect = document.getElementById('caixinhaSelect');

    // ==========================================
    // 2. RENDERIZADOR PRINCIPAL (A MÁGICA)
    // ==========================================
    function renderizarTela() {
        totalSalario = 0; totalGuardado = 0; totalFixo = 0; totalVariavel = 0;
        if(tbodyHistorico) tbodyHistorico.innerHTML = '';
        
        // Objeto para guardar o saldo de cada caixinha separadamente
        let saldosCaixinhas = {};
        caixinhas.forEach(c => saldosCaixinhas[c.id] = 0);

        // Passa por cada transação salva
        transacoes.forEach(t => {
            if (t.tipo === 'salario') totalSalario += t.valor;
            else if (t.tipo === 'guardado') {
                totalGuardado += t.valor;
                if(saldosCaixinhas[t.caixinhaId] !== undefined) saldosCaixinhas[t.caixinhaId] += t.valor;
            } 
            else if (t.tipo === 'resgate') {
                totalGuardado -= t.valor;
                if(saldosCaixinhas[t.caixinhaId] !== undefined) saldosCaixinhas[t.caixinhaId] -= t.valor;
            } 
            else if (t.tipo === 'fixo') totalFixo += t.valor;
            else if (t.tipo === 'variavel') totalVariavel += t.valor;

            if(tbodyHistorico) {
                let statusHTML = (t.tipo === 'fixo' || t.tipo === 'variavel') ? 
                    (t.isPago ? '<span class="status-badge status-pago">Pago</span>' : '<span class="status-badge status-pendente">Pendente</span>') : 
                    '<span class="status-badge status-pago">Efetivado</span>';

                const tr = document.createElement('tr');
                tr.setAttribute('data-id', t.id);
                tr.innerHTML = `
                    <td>${t.data}</td>
                    <td>${t.descricao}</td>
                    <td>${t.categoriaText}</td>
                    <td>${statusHTML}</td>
                    <td class="${t.classeCor}">${t.sinal} R$ ${formatarMoeda(t.valor)} <span class="btn-excluir" style="cursor: pointer; margin-left: 15px;" title="Excluir">🗑️</span></td>
                `;
                tbodyHistorico.prepend(tr);
            }
        });

        sobraTotal = totalSalario - totalFixo - totalVariavel;
        
        // Atualiza Painéis
        document.getElementById('painelSalario').innerText = `R$ ${formatarMoeda(totalSalario)}`;
        document.getElementById('painelGuardado').innerText = `R$ ${formatarMoeda(totalGuardado)}`;
        document.getElementById('painelFixo').innerText = `R$ ${formatarMoeda(totalFixo)}`;
        document.getElementById('painelVariavel').innerText = `R$ ${formatarMoeda(totalVariavel)}`;

        // Renderiza as Caixinhas na tela
        if(caixinhasGrid) {
            caixinhasGrid.innerHTML = '';
            caixinhas.forEach(c => {
                const saldoCaixinha = saldosCaixinhas[c.id] || 0;
                caixinhasGrid.innerHTML += `
                    <div class="caixinha-card">
                        <h3>${c.nome} <span class="btn-excluir-caixinha" onclick="excluirCaixinha(${c.id})">❌</span></h3>
                        <div class="saldo">R$ ${formatarMoeda(saldoCaixinha)}</div>
                    </div>
                `;
            });
        }

        // Atualiza Select do Modal
        if(caixinhaSelect) {
            caixinhaSelect.innerHTML = '';
            caixinhas.forEach(c => {
                caixinhaSelect.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
            });
        }

        // Atualiza Gráfico e Flutuante
        if (graficoApp) {
            let percDespesas = totalSalario > 0 ? ((totalFixo + totalVariavel) / totalSalario) * 100 : 0;
            let percSobra = totalSalario > 0 ? (sobraTotal / totalSalario) * 100 : 100;
            if (percSobra < 0) { percSobra = 0; percDespesas = 100; }
            graficoApp.data.datasets[0].data = [percDespesas, percSobra];
            graficoApp.update(); 
        }

        const divFlutuante = document.querySelector('.sobra-flutuante');
        if (divFlutuante) {
            divFlutuante.innerHTML = sobraTotal < 0 ? `🚨 Faltando: <span class="text-red">R$ ${formatarMoeda(sobraTotal)}</span>` : `💰 Sobra Atual: <span class="text-green">R$ ${formatarMoeda(sobraTotal)}</span>`;
            divFlutuante.style.borderColor = sobraTotal < 0 ? '#e74c3c' : '#18bc9c'; 
        }
    }

    // ==========================================
    // 3. CRIAR E EXCLUIR CAIXINHAS
    // ==========================================
    document.getElementById('btnNovaCaixinha').addEventListener('click', () => {
        const nome = prompt("Qual o nome do novo objetivo/caixinha?");
        if(nome && nome.trim() !== '') {
            caixinhas.push({ id: Date.now(), nome: nome });
            salvarNoBanco();
            renderizarTela();
        }
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
    document.querySelector('.btn-save').addEventListener('click', function() {
        const tipo = tipoLancamento.value;
        let desc = document.getElementById('descricao').value;
        const val = Number(document.getElementById('valor').value);
        const caixinhaId = Number(document.getElementById('caixinhaSelect').value); // Pega qual caixinha foi escolhida

        if (desc === '' || val <= 0) return alert('Preencha os dados corretamente.');
        if ((tipo === 'guardado' || tipo === 'resgate') && !caixinhaId) return alert('Por favor, crie uma Caixinha primeiro.');

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
    });    

    // Ações da Tabela e Filtros
    if(tbodyHistorico) {
        tbodyHistorico.addEventListener('click', function(evento) {
            const elementoClicado = evento.target;
            const linha = elementoClicado.closest('tr');
            if(!linha) return;
            const idTransacao = Number(linha.getAttribute('data-id'));
            
            if (elementoClicado.classList.contains('status-badge')) {
                const transacaoIndex = transacoes.findIndex(t => t.id === idTransacao);
                if (transacaoIndex !== -1) {
                    transacoes[transacaoIndex].isPago = !transacoes[transacaoIndex].isPago;
                    salvarNoBanco(); renderizarTela();
                }
            }
            if (elementoClicado.classList.contains('btn-excluir')) {
                transacoes = transacoes.filter(t => t.id !== idTransacao);
                salvarNoBanco(); renderizarTela();
            }
        });
    }