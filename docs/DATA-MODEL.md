# Modelo de dados

## Coleções planejadas

`users`, `roles`, `campaigns`, `campaignVersions`, `numbers`, `orders`, `payments`, `paymentEvents`, `draws`, `prizeLedger`, `sellers`, `commissions`, `commissionPayments`, `media`, `settings`, `auditLogs`, `securityEvents`, `scheduledJobs` e `legalDocuments`.

Números serão documentos pagináveis em `campaigns/{campaignId}/numbers`; nunca um array gigante. Valores monetários usam centavos inteiros. Datas são UTC com agenda calculada em `America/Recife`.

## Estados

Pedido: `created`, `awaiting_payment`, `paid`, `expired`, `cancelled`, `refunded`, `under_review`. Número: `available`, `reserved`, `sold`, `blocked`. Pagamento mantém máquina de estados própria.

## Proteção

Dados pessoais ficam fora de projeções públicas. Tokens de acompanhamento são armazenados como hash. Eventos de pagamento, prêmio e auditoria são append-only. Índices, paginação, retenção e custos serão definidos antes da criação das coleções.

## Campanhas implementadas

`campaigns` guarda a versão corrente, contadores resumidos e `demoOnly=true`. `campaignVersions` guarda snapshots completos numerados e append-only. Alterações críticas são recusadas quando `soldCount > 0`. Estados disponíveis: `draft`, `demo_active`, `paused`, `blocked` e `archived`; não existe `active` comercial.

`media` registra tipo original detectado, dimensões, tamanho, URLs derivadas, provedor, autor e instante do upload. O arquivo original não é preservado no adaptador local.
