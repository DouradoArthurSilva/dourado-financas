# Guia rápido do código

Este arquivo serve para revisar o projeto antes de apresentar em entrevista.

## Como o projeto está dividido

- `storage.js`: carrega, normaliza e salva os dados no LocalStorage.
- `script.js`: regras principais, lançamentos, histórico, caixinhas, recorrências e dashboard.
- `accounts.js`: contas bancárias, saldos e transferências.
- `cards.js`: cartões, compras, parcelas e faturas.
- `navigation.js`: troca entre as telas sem recarregar a página.
- `backup.js`: exportação e restauração dos dados em JSON.
- `pwa.js` e `service-worker.js`: instalação como aplicativo e cache básico.

## Pontos que eu preciso saber explicar

1. **Por que usei LocalStorage?**  
   Para criar uma primeira versão sem backend e manter os dados no navegador. A limitação é que não existe sincronização automática entre dispositivos.

2. **Como o saldo de uma conta é calculado?**  
   A partir do saldo inicial, somando receitas e resgates e descontando despesas pagas, dinheiro guardado, faturas e transferências.

3. **Por que normalizar os dados?**  
   Porque o projeto evoluiu. A normalização preenche campos novos em registros antigos e evita quebrar o LocalStorage existente.

4. **Como funciona a recorrência?**  
   A recorrência é uma regra separada. Ao abrir o sistema, ele verifica os meses que ainda não foram gerados e cria os lançamentos sem duplicar os anteriores.

5. **Como funciona cartão parcelado?**  
   O sistema calcula a primeira competência pela data da compra e pelo fechamento do cartão. Depois cria cada parcela na competência seguinte.

6. **Por que existe backup?**  
   Como os dados ficam no navegador, o usuário precisa conseguir exportar um JSON e restaurar depois.

## Limitações que eu reconheço

- Não possui login ou backend.
- Os dados ficam no navegador atual.
- O `script.js` ainda ficou grande e pode ser dividido melhor numa próxima versão.
- Para vários usuários, eu migraria os dados para uma API e banco de dados.

Reconhecer essas limitações mostra que eu entendo a diferença entre um MVP local e um produto em produção.
 