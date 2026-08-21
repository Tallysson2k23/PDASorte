# Arquitetura

## Decisão

Monólito modular em Next.js App Router. O navegador acessa páginas públicas e APIs/Server Actions validadas; operações críticas passam por serviços de domínio no servidor e pelo Firebase Admin SDK. Firebase Authentication será usado somente para administradores e vendedores autorizados.

## Módulos planejados

`campaigns`, `orders`, `payments`, `draws`, `sellers`, `commissions`, `media`, `audit` e `security`. Integrações usam interfaces: `PaymentProvider` e `ImageStorageProvider`.

## Invariantes

- Modo real permanece bloqueado por padrão.
- Estados de pedido, pagamento e número são independentes.
- Reserva é transacional; confirmação depende de evento de pagamento verificado.
- Sorteio ocorre somente no servidor após congelamento da campanha.
- Código público não contém ID interno; token de consulta é aleatório e persistido somente como hash.
- Valores monetários são inteiros em centavos.

## Operação

Vercel poderá hospedar a aplicação, mas não haverá deploy nesta fase. Upload no filesystem da Vercel não é persistente; produção exigirá armazenamento externo escolhido pelo responsável.

## Autenticação administrativa

O navegador autentica com Firebase Auth e envia o ID token somente à API de sessão. O servidor verifica revogação e perfil ativo em `users`, emite cookie de sessão HttpOnly e revalida cookie, status e função em cada acesso administrativo. Custom claims não são a única fonte de autorização.

## Marco 3 — campanhas e mídia

Campanhas passam por uma DAL marcada como `server-only`. Cada criação/edição grava o documento corrente, uma versão imutável em `campaignVersions` e um evento em `auditLogs` na mesma transação. O modelo não contém estado comercial real: `demo_active` é explicitamente demonstrativo.

Uploads usam `ImageStorageProvider`. O adaptador local identifica o conteúdo, limita 5 MB e 5000 × 5000 pixels, recodifica para WebP sem metadados, produz card/miniatura e usa nomes UUID. Nenhum caminho enviado pelo usuário é usado no filesystem.
