# Modelo de ameaças

## Ativos

Credenciais administrativas, configurações de campanhas, nomes e contatos dos participantes, associação entre pessoas e números, resultados, imagens e trilha de auditoria.

## Ameaças e controles

- Manipulação ou repetição do sorteio: transação, resultado único, aleatoriedade criptográfica e auditoria.
- Reserva duplicada: documento único por número e criação transacional.
- Exposição de participantes: disponibilidade pública contém somente números; nome e contato ficam no servidor.
- Alteração posterior das regras: versões append-only e bloqueio depois do resultado.
- Escalada administrativa: sessão segura e permissões verificadas no servidor.
- Acesso direto ao banco: regras Firestore deny-by-default.
- Upload malicioso: detecção do conteúdo, limites, recodificação e nomes aleatórios.

Riscos residuais incluem comprometimento de uma conta administrativa, erro de configuração do ambiente e perda dos dados locais dos emuladores.
