# Integridade do sorteio

Agenda padrão desejada: fechamento 16:30 e sorteio 17:00 em `America/Recife`, configurável por campanha.

O servidor congelará a campanha, adquirirá trava idempotente e sorteará no intervalo versionado com aleatoriedade criptograficamente segura. Serão registrados instante, regras, intervalo, entrada de transparência aplicável, resultado e falhas. Falha não autoriza escolher silenciosamente outro número.

Resultado concluído não é editável. Correção cria evento novo com justificativa e dupla aprovação. Número não vendido gera “sem ganhador” e só acumula quando o regulamento versionado permitir. O simulador usa dados isolados e nunca altera campanha.
