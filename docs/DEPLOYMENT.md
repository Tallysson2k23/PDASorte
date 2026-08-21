# Implantação

Não fazer deploy de produção nem habilitar operação real sem aprovação explícita e checklist jurídico concluído.

Preparação futura para Vercel: variáveis separadas por ambiente, segredos somente no servidor, cron autenticado, observabilidade, backup Firestore e plano de recuperação. `DEMO_MODE=true` é obrigatório no preview inicial.

Uploads gravados durante o runtime da Vercel são efêmeros. Produção precisa de `ImageStorageProvider` externo (R2, Vercel Blob ou Cloudinary) ainda não escolhido. A alternativa de imagens no repositório exige adicioná-las antes do deploy e não oferece upload administrativo persistente.

O adaptador local implementado no Marco 3 deve ser bloqueado em qualquer deploy persistente. As URLs `/uploads` só são adequadas ao desenvolvimento local ou a arquivos adicionados ao repositório antes do build.
