# Implantação

Antes de publicar fora do ambiente local, configure um projeto Firebase separado, credenciais administrativas somente no servidor, backup do Firestore, monitoramento e proteção distribuída contra tentativas de login.

O armazenamento atual de imagens em `public/uploads` é adequado apenas ao desenvolvimento local. Uma implantação persistente precisa usar um provedor externo de objetos e manter a recodificação e os limites já aplicados pelo `ImageStorageProvider`.

Variáveis secretas nunca devem ser versionadas. Preserve a regra Firestore deny-by-default e execute lint, tipos, testes, regras e build antes da implantação.
