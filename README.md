# Nine Half

Plataforma mobile para gerenciamento e compartilhamento de estoque de sneakers.

## Problema resolvido
Centraliza um fluxo hoje informal (WhatsApp/Instagram) em um app com vitrine, estoque global, reserva e finalizacao de venda com controle de status.

## Tecnologias
- React Native + Expo
- TypeScript
- Firebase Auth
- Firestore
- Cloudinary (imagens dos produtos)
- React Navigation
- Expo Image Picker

## Custo
Projeto preparado para plano gratuito (Spark) e bibliotecas open source.
Nao usa Cloud Functions, API paga, gateway de pagamento, servico externo de busca ou notificacao paga.

## Instalacao
```bash
npm install
```

## Configuracao `.env`
O `.env` com as configuracoes publicas do aplicativo acompanha o repositorio. Depois de clonar, nao e necessario copiar esse arquivo. Ele conecta ao mesmo Firebase e Cloudinary do projeto.

Para usar seus proprios servicos, crie um `.env.local` (ignorado pelo Git), usando `.env.example` como base:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=...
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
```

## Rodar o app
```bash
npx expo start -c
```

## Publicar regras Firestore
1. Firebase Console -> Firestore Database -> Rules
2. Colar conteudo de `firestore.rules`
3. Publish

## Publicar regras Storage
O upload atual usa Cloudinary. As regras de Firebase Storage sao mantidas para o armazenamento legado, mas nao controlam os uploads atuais.

1. Firebase Console -> Storage -> Rules
2. Colar conteudo de `storage.rules`
3. Publish

## Criar indices Firestore
Seguir o arquivo `FIRESTORE_INDEXES.md` e os links sugeridos pelo erro de indice no Console.
Os indices sao configurados pelo Console; nao ha arquivo `firestore.indexes.json` neste repositorio.

## Fluxos principais
1. Cadastro/login/logout
2. Criacao/edicao de vitrine
3. CRUD de produtos com imagem
4. Estoque global com busca, filtros e paginacao
5. Reserva e cancelamento com `runTransaction`
6. Finalizacao de compra com `runTransaction`
7. Historico em Minhas Reservas e Minhas Transacoes

## Arquitetura
`Screen -> Hook -> Service -> Firebase`

Telas nao acessam SDK Firebase diretamente; regras de negocio ficam em services e estado de UI em hooks.

## Validacao local
```bash
node node_modules/typescript/bin/tsc --noEmit --incremental false
node scripts/test-reservation-feedback.cjs
node scripts/test-release-reservation.cjs
node scripts/test-logout.cjs
node scripts/test-navigation.cjs
```

## Estrutura e arquivos locais
- `src/`, `App.tsx` e `assets/`: codigo e imagens do aplicativo.
- `android/` e `Gerar apk/`: projeto nativo e instrucoes de build local.
- `scripts/backfill-products.mjs`: manutencao dos campos de busca de produtos antigos; nao executar como parte da instalacao.
- `materiais-locais/`: esboco, resumo e diagramas do TCC, preservados apenas neste computador e ignorados pelo Git.
- `.env`: somente configuracoes publicas do aplicativo, compartilhadas para facilitar a instalacao.
- `.env.local`, credenciais privadas, `node_modules/`, caches, exports e APKs nao devem ser versionados.
