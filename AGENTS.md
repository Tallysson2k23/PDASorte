# Instruções para agentes e contribuidores

## Estrutura

- `src/app`: páginas e endpoints Next.js.
- `src/config`: validação centralizada de ambiente.
- `docs`: decisões arquiteturais, jurídicas e operacionais.
- `public/uploads`: armazenamento local efêmero de desenvolvimento.

## Comandos

Use `npm run dev`, `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.

## Convenções e segurança

- TypeScript estrito; valide entradas no servidor com Zod.
- Dinheiro sempre em centavos inteiros e datas persistidas em UTC.
- Regras de negócio de agenda usam `America/Recife`.
- Operações sensíveis nunca são confiadas ao navegador.
- Firebase Admin SDK é exclusivo do servidor; regras Firestore negam por padrão.
- Não crie cadastro administrativo público.
- Auditoria é append-only; resultados concluídos não são editados.
- Não registre segredos ou dados pessoais desnecessários.
- Nunca versione chaves privadas, tokens, cookies, webhooks ou credenciais.
- Não implemente pagamentos reais, vendas ou premiações enquanto `docs/LEGAL-CHECKLIST.md` não estiver formalmente aprovado.

## Testes obrigatórios

Cada alteração deve incluir testes proporcionais ao risco. Antes de concluir: lint, typecheck, testes e build devem passar. Fluxos críticos exigem testes de autorização, idempotência, concorrência, fuso e regras Firestore.

## Critério de conclusão

Código revisável, documentação atualizada, nenhum segredo, modo demo preservado, verificações aprovadas e riscos residuais declarados.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
