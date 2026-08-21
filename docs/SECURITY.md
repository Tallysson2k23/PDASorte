# Segurança

## Baseline

Princípio do menor privilégio, negação por padrão, validação server-side, cookies `HttpOnly`, `Secure` e `SameSite`, proteção CSRF, CSP, rate limiting distribuído, logs estruturados e IDs de correlação.

Papéis planejados: `superadmin`, `admin`, `financeiro`, `operador`, `vendedor` e `auditor`. Custom claims aceleram decisões, mas ações críticas também verificarão estado revogável no servidor.

## Dados pessoais e LGPD

Coletar somente nome, telefone e consentimentos necessários. Separar dados públicos, mascarar visualizações, auditar revelações, definir retenção por finalidade e oferecer fluxo para direitos do titular. Nunca permitir consulta apenas por telefone.

## Segredos

Variáveis administrativas ficam somente no servidor. `.env.example` contém nomes e dados públicos, nunca valores secretos. Logs não recebem tokens, chaves privadas ou payloads pessoais completos.

## Controles implementados no Marco 2

Firebase Auth/Admin separados, sessão HttpOnly, RBAC server-side, validação de origem contra CSRF, limitação progressiva local de login, regras Firestore deny-by-default, testes de regras, bootstrap controlado do superadmin e eventos básicos de auditoria/segurança.

O limitador em memória protege a troca do token por sessão apenas no desenvolvimento; produção exigirá armazenamento distribuído e proteção de tentativas no Firebase Identity Platform. App Check, alertas externos, bloqueio progressivo completo e dupla aprovação continuam pendentes. Os testes do emulador requerem Java 21.

A CSP atual permite scripts inline necessários à hidratação do Next.js e `unsafe-eval` apenas durante desenvolvimento. Antes de produção, substituir scripts inline por uma política baseada em nonce por requisição e validar todas as rotas em navegador real.

Como o Auth Emulator não oferece comportamento confiável para session cookies do Admin SDK, o desenvolvimento usa cookie local assinado com HMAC. O segredo vem de `SESSION_SECRET`; quando vazio, há um fallback determinístico exclusivo do protótipo local, sem validade de segurança para produção. Essa alternativa só é ativada quando `FIREBASE_AUTH_EMULATOR_HOST` existe; qualquer ambiente sem emulador usa obrigatoriamente o session cookie oficial do Firebase.

## Dependências

Em 20/08/2026, `npm audit` reportou nove avisos moderados e nenhum alto ou crítico. Os avisos são transitivos de `firebase-admin` e `firebase-tools`; a correção automática oferecida exige downgrades incompatíveis. Não há uso direto das rotinas de UUID/baggage afetadas nos fluxos implementados. Risco aceito somente para o protótipo local, com reavaliação obrigatória antes de qualquer implantação.
