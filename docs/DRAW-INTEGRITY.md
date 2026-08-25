# Integridade do sorteio

O resultado é produzido no servidor com `node:crypto.randomInt`, selecionando uma posição dentro da lista de reservas confirmadas. Números sem participante não entram no sorteio. A atualização da campanha, o documento em `draws` e o evento de auditoria são gravados na mesma transação Firestore.

A transação impede resultados concorrentes: depois do primeiro commit, novas tentativas encontram a campanha como `drawn` e são recusadas. O resultado concluído não pode ser alterado pela edição administrativa.

O sistema registra o algoritmo, a versão das regras, o intervalo, o número, o instante e o administrador executor. O nome e o contato do ganhador ficam restritos ao painel.
