# PDA DA SORTE

Protótipo web auditável para estudo de campanhas com seleção de números. **Não realiza vendas, cobranças ou premiações reais.** O projeto deve permanecer com `DEMO_MODE=true` até existir enquadramento jurídico documentado, autorização aplicável e aprovação explícita do responsável.

## Requisitos

- Node.js 20.9 ou superior (Node 24 LTS recomendado)
- npm 11

## Desenvolvimento

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Verificações: `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.

Se o PowerShell bloquear `npm.ps1`, use `npm.cmd` nos mesmos comandos, por exemplo `npm.cmd run dev`.

## Estado do projeto

Marco 3: fundação Firebase, autenticação/RBAC, dashboard, campanhas versionadas e upload local seguro implementados. Reservas, pagamentos e sorteios ainda não estão implementados.

## Painel administrativo local

O Marco 2 adiciona `/admin`. Para testar com emuladores, instale Java 21, adicione ao `.env.local` os novos campos de `.env.example`, defina `SUPERADMIN_EMAIL` e `SUPERADMIN_INITIAL_PASSWORD`, execute `npm.cmd run emulators` e, em outro terminal, `npm.cmd run bootstrap:superadmin` seguido de `npm.cmd run dev`. A interface dos emuladores fica em `http://localhost:4000`.

Não existe cadastro administrativo público. Após o primeiro bootstrap, remova a senha inicial do `.env.local`.

Consulte `docs/LEGAL-CHECKLIST.md`, `docs/ARCHITECTURE.md` e `docs/SECURITY.md` antes de contribuir.
