# Segurança

O painel usa Firebase Authentication, sessão HttpOnly, RBAC no servidor, validação de origem contra CSRF e limitação de tentativas. O Firestore nega todo acesso direto do navegador; operações passam pelo Firebase Admin SDK.

Resultados são sensíveis à integridade: geração, gravação do resultado e auditoria ocorrem no servidor e na mesma transação. Campanhas concluídas são imutáveis pela interface comum.

Reservas públicas validam nome, telefone e intervalo no servidor. O número é a chave única da reserva, e uma transação impede duplicidade. A API pública de disponibilidade retorna somente números ocupados, nunca nomes ou contatos. O endpoint possui limitação de tentativas por campanha e origem.

Uploads têm tipo real identificado, limite de tamanho e dimensões, recodificação WebP sem metadados e nome aleatório. SVG não é aceito.

O limitador em memória e a sessão HMAC alternativa existem somente para o desenvolvimento com emuladores. Produção deve usar cookies oficiais do Firebase, proteção distribuída, observabilidade e revisão de permissões.
