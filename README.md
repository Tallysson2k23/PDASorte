# Sorteios da Turma

Sistema gratuito para sorteios recreativos e internos de um grupo da faculdade. A aplicação publica campanhas, permite que cada integrante reserve um número com nome e telefone e seleciona uma das reservas no servidor. Não possui apostas, venda de números, pagamentos, comissões nem prêmios em dinheiro.

## Desenvolvimento local

Requisitos: Node.js 20.9 ou superior, npm 11 e Java 21 para os emuladores Firebase.

```powershell
npm install
Copy-Item .env.example .env.local
npm.cmd run emulators
```

Em outro terminal, configure a conta administrativa e inicie a aplicação:

```powershell
npm.cmd run bootstrap:superadmin
npm.cmd run dev
```

A página pública fica em `http://localhost:3000`, o painel em `http://localhost:3000/admin` e a interface dos emuladores em `http://localhost:4000`.

## Fluxo

1. O administrador cria uma campanha em rascunho.
2. Define prêmio, intervalo de números, data e regras.
3. Publica a campanha para o grupo.
4. Os integrantes escolhem números disponíveis e informam nome e contato.
5. O organizador encerra as reservas e realiza o sorteio no painel.
6. O número definitivo aparece publicamente; nome e contato do ganhador ficam restritos ao painel.

Verificações: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:rules` e `npm run build`.
