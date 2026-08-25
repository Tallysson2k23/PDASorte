# Arquitetura

Monólito modular em Next.js App Router com Firebase Authentication e Firestore. A página pública é somente leitura; criação, edição e sorteio passam por endpoints protegidos, sessão administrativa HttpOnly, RBAC e Firebase Admin SDK no servidor.

## Módulos

- `campaigns`: campanhas, publicação, encerramento e resultado.
- `reservations`: escolha transacional de número e identificação privada do participante.
- `draws`: registros imutáveis de cada sorteio concluído.
- `media`: imagens recodificadas e sem metadados.
- `audit`: histórico append-only das ações administrativas.
- `auth` e `security`: sessão, permissões, origem e limitação de tentativas.

Não existem módulos de pedidos, pagamentos, vendas, vendedores ou comissões.

## Invariantes

- A participação é gratuita e restrita ao grupo.
- O sorteio é executado somente no servidor.
- Cada campanha aceita no máximo um resultado.
- Cada número aceita no máximo uma reserva por campanha.
- O sorteio seleciona somente entre reservas confirmadas.
- Campanhas sorteadas não podem ser editadas.
- Toda criação, edição e conclusão gera auditoria.
- Datas são persistidas em UTC e exibidas em `America/Recife`.
