# Modelo de ameaças

## Ativos

Dados pessoais, números reservados/vendidos, pagamentos, resultados, comissões, documentos jurídicos, credenciais administrativas e trilha de auditoria.

## Ameaças e controles planejados

- Compra dupla: transação Firestore, expiração e idempotência.
- Pagamento forjado/repetido: assinatura, corpo bruto, conferência de valor e evento único.
- Escalada administrativa: sessão segura, RBAC no servidor e bloqueio progressivo.
- Manipulação de sorteio: congelamento, execução idempotente, aleatoriedade criptográfica e registro imutável.
- Vazamento/enumeração: projeções públicas mínimas, paginação, rate limit e tokens de alta entropia.
- Upload malicioso: detecção do tipo real, limites, recodificação, nomes aleatórios e proibição de SVG não sanitizado.
- Insider: segregação de funções, dupla aprovação e auditoria append-only.

## Riscos residuais

Comprometimento de conta privilegiada, erro de configuração IAM, indisponibilidade de terceiros, contenção em campanhas concorridas e limites de imutabilidade do Firestore. Segurança absoluta não é prometida; controles e backups precisam ser testados continuamente.
