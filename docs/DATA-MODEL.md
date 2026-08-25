# Modelo de dados

## `campaigns`

Documento corrente com título, descrição, imagem, descrição do prêmio simples, intervalo numérico, data do sorteio em UTC, fuso, regras, status, versão e resultado opcional.

Estados: `draft`, `published`, `closed`, `drawn` e `archived`. O estado `drawn` só é produzido pelo serviço de sorteio.

## `campaignVersions`

Snapshots append-only das regras e configurações de cada versão, vinculados à campanha e ao administrador responsável.

## `draws`

Registro imutável com campanha, versão, intervalo, número selecionado, algoritmo, autor e instante. O resultado também é projetado na campanha para leitura pública.

## `campaigns/{campaignId}/reservations`

Uma reserva por número, identificada pelo número normalizado. Guarda número, nome, telefone e instante. A criação é transacional para impedir duplicidade. Nome e telefone não fazem parte da disponibilidade pública e só são exibidos ao administrador quando a reserva é vencedora.

## `users`, `media`, `auditLogs` e `securityEvents`

Perfis administrativos, metadados de imagens, trilha de auditoria e eventos de segurança. O navegador não acessa o Firestore diretamente; as regras negam por padrão.
