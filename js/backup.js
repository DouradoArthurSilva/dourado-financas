// Backup dos dados em JSON.
// Fiz essa parte para o usuário conseguir trocar de computador ou recuperar
// os dados sem depender de servidor.

const BACKUP_APP = 'Dourado Finanças';
const BACKUP_VERSAO = 1;
const BACKUP_TAMANHO_MAXIMO = 10 * 1024 * 1024;

const CHAVES_BACKUP = {
    transacoes: 'dourado_transacoes',
    caixinhas: 'dourado_caixinhas',
    recorrencias: 'dourado_recorrencias',
    categorias: 'dourado_categorias',
    contas: 'dourado_contas',
    cartoes: 'dourado_cartoes'
};

let backupPendenteRestauracao = null;

function obterDadosAtuaisBackup() {
    return {
        transacoes,
        caixinhas,
        recorrencias,
        categorias,
        contas,
        cartoes
    };
}

function atualizarResumoBackup() {
    const dados = obterDadosAtuaisBackup();
    const resumos = {
        backupTotalTransacoes: dados.transacoes,
        backupTotalCaixinhas: dados.caixinhas,
        backupTotalRecorrencias: dados.recorrencias,
        backupTotalCategorias: dados.categorias,
        backupTotalContas: dados.contas,
        backupTotalCartoes: dados.cartoes
    };

    Object.entries(resumos).forEach(([elementoId, colecao]) => {
        document.getElementById(elementoId).textContent =
            String(colecao.length);
    });
}

function criarBackup() {
    return {
        aplicativo: BACKUP_APP,
        versao: BACKUP_VERSAO,
        exportadoEm: new Date().toISOString(),
        dados: obterDadosAtuaisBackup()
    };
}

function baixarBackup() {
    salvarNoBanco();

    const conteudo = JSON.stringify(criarBackup(), null, 2);
    const arquivo = new Blob(
        [conteudo],
        { type: 'application/json;charset=utf-8' }
    );
    const endereco = URL.createObjectURL(arquivo);
    const link = document.createElement('a');
    const data = new Date().toISOString().slice(0, 10);

    link.href = endereco;
    link.download = `dourado-financas-backup-${data}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => {
        URL.revokeObjectURL(endereco);
    }, 0);

    mostrarToast('Backup baixado com sucesso.', 'sucesso');
}

function possuiIdsDuplicados(colecao) {
    const ids = colecao
        .filter(item => item.id !== undefined && item.id !== null)
        .map(item => String(item.id));

    return new Set(ids).size !== ids.length;
}

// Valido tudo antes de restaurar para não substituir dados bons por arquivo inválido.
function validarBackup(backup) {
    if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
        throw new Error('O arquivo não contém um backup válido.');
    }

    if (backup.aplicativo !== BACKUP_APP) {
        throw new Error('Este arquivo não pertence ao Dourado Finanças.');
    }

    if (
        !Number.isInteger(backup.versao) ||
        backup.versao < 1 ||
        backup.versao > BACKUP_VERSAO
    ) {
        throw new Error('A versão deste backup não é compatível.');
    }

    if (!backup.dados || typeof backup.dados !== 'object') {
        throw new Error('O backup não possui a estrutura de dados esperada.');
    }

    Object.keys(CHAVES_BACKUP).forEach(nome => {
        const colecao = backup.dados[nome];

        if (
            !Array.isArray(colecao) ||
            colecao.some(item =>
                !item ||
                typeof item !== 'object' ||
                Array.isArray(item)
            )
        ) {
            throw new Error(`A coleção "${nome}" está inválida.`);
        }

        if (possuiIdsDuplicados(colecao)) {
            throw new Error(`A coleção "${nome}" possui IDs duplicados.`);
        }
    });

    return backup;
}

function formatarDataBackup(valor) {
    const data = new Date(valor);

    return Number.isNaN(data.getTime())
        ? 'data não informada'
        : data.toLocaleString('pt-BR');
}

function abrirConfirmacaoRestauracao(backup) {
    backupPendenteRestauracao = backup;

    const totalRegistros = Object.keys(CHAVES_BACKUP)
        .reduce(
            (total, nome) =>
                total + backup.dados[nome].length,
            0
        );

    document.getElementById('resumoRestaurarBackup').textContent =
        `Backup de ${formatarDataBackup(backup.exportadoEm)}, com ${totalRegistros} registros. Os dados atuais serão substituídos.`;

    const modal = document.getElementById('modalRestaurarBackup');
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
}

function fecharConfirmacaoRestauracao() {
    backupPendenteRestauracao = null;

    const modal = document.getElementById('modalRestaurarBackup');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
}

async function selecionarArquivoBackup(evento) {
    const arquivo = evento.target.files[0];
    evento.target.value = '';

    if (!arquivo) return;

    if (arquivo.size > BACKUP_TAMANHO_MAXIMO) {
        mostrarToast(
            'O arquivo de backup excede o limite de 10 MB.',
            'erro'
        );
        return;
    }

    try {
        const conteudo = await arquivo.text();
        abrirConfirmacaoRestauracao(
            validarBackup(JSON.parse(conteudo))
        );
    } catch (erro) {
        console.error('Não foi possível validar o backup.', erro);
        mostrarToast(
            erro instanceof SyntaxError
                ? 'O arquivo selecionado não contém um JSON válido.'
                : erro.message,
            'erro'
        );
    }
}

function restaurarBackupConfirmado() {
    if (!backupPendenteRestauracao) {
        fecharConfirmacaoRestauracao();
        return;
    }

    const valoresAnteriores = {};

    Object.values(CHAVES_BACKUP).forEach(chave => {
        valoresAnteriores[chave] = localStorage.getItem(chave);
    });

    try {
        Object.entries(CHAVES_BACKUP)
            .forEach(([nome, chave]) => {
                localStorage.setItem(
                    chave,
                    JSON.stringify(
                        backupPendenteRestauracao.dados[nome]
                    )
                );
            });

        window.location.reload();
    } catch (erro) {
        Object.entries(valoresAnteriores)
            .forEach(([chave, valor]) => {
                if (valor === null) {
                    localStorage.removeItem(chave);
                } else {
                    localStorage.setItem(chave, valor);
                }
            });

        console.error('Não foi possível restaurar o backup.', erro);
        fecharConfirmacaoRestauracao();
        mostrarToast(
            'Não foi possível restaurar. Seus dados anteriores foram preservados.',
            'erro'
        );
    }
}

document.getElementById('btnExportarBackup')
    .addEventListener('click', baixarBackup);

document.getElementById('btnSelecionarBackup')
    .addEventListener('click', () => {
        document.getElementById('arquivoBackup').click();
    });

document.getElementById('arquivoBackup')
    .addEventListener('change', selecionarArquivoBackup);

document.getElementById('btnCancelarRestauracao')
    .addEventListener('click', fecharConfirmacaoRestauracao);

document.getElementById('btnConfirmarRestauracao')
    .addEventListener('click', restaurarBackupConfirmado);

document.getElementById('modalRestaurarBackup')
    .addEventListener('click', evento => {
        if (evento.target.id === 'modalRestaurarBackup') {
            fecharConfirmacaoRestauracao();
        }
    });

atualizarResumoBackup();
