# Implantação

Antes de publicar fora do ambiente local, configure um projeto Firebase separado, credenciais administrativas somente no servidor, backup do Firestore, monitoramento e proteção distribuída contra tentativas de login.

## Variáveis obrigatórias na Vercel

Configure as variáveis abaixo em **Settings → Environment Variables** para Production e Preview, sem espaços antes ou depois dos valores:

- `INTERNAL_USE_ONLY=true`
- `APP_TIME_ZONE=America/Recife`
- todas as variáveis `NEXT_PUBLIC_FIREBASE_*` listadas em `.env.example`
- `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false`
- `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL` e `FIREBASE_ADMIN_PRIVATE_KEY` obtidas de uma conta de serviço do Firebase
- `SESSION_SECRET` com um valor aleatório forte

Não configure `FIRESTORE_EMULATOR_HOST` nem `FIREBASE_AUTH_EMULATOR_HOST` na Vercel. Em `FIREBASE_ADMIN_PRIVATE_KEY`, preserve o valor completo, incluindo `-----BEGIN PRIVATE KEY-----`, `-----END PRIVATE KEY-----` e as quebras de linha como `\n`. Depois de alterar variáveis públicas ou secretas, faça um novo deploy: variáveis `NEXT_PUBLIC_*` são incorporadas durante o build.

A página pública apresenta um aviso temporário, em vez de responder com erro 500, caso o Firestore esteja momentaneamente indisponível. Isso não substitui a configuração das credenciais: campanhas, reservas e administração dependem do Firebase Admin.

O armazenamento atual de imagens em `public/uploads` é adequado apenas ao desenvolvimento local. Uma implantação persistente precisa usar um provedor externo de objetos e manter a recodificação e os limites já aplicados pelo `ImageStorageProvider`.

Variáveis secretas nunca devem ser versionadas. Preserve a regra Firestore deny-by-default e execute lint, tipos, testes, regras e build antes da implantação.
