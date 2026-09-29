# Firestore Security - Nine Half

## Onde estao as regras
- Arquivo principal: `firestore.rules`

## Como publicar no Firebase Console
1. Acesse o projeto no Firebase Console.
2. Vá em `Firestore Database` > aba `Rules`.
3. Apague o conteúdo atual.
4. Cole o conteúdo do arquivo `firestore.rules`.
5. Clique em `Publish`.

## Como testar rapidamente
1. Crie dois usuarios diferentes (A e B) no app.
2. Faça login com o usuario A.
3. Confirme que A consegue ler o proprio perfil.
4. Tente buscar/atualizar o documento de `users/{uid_do_B}` via app ou Console Rules Playground autenticado como A.
5. Resultado esperado: acesso negado (`PERMISSION_DENIED`).
6. Tente deletar `users/{uid_do_A}`.
7. Resultado esperado: acesso negado.
8. Tente alterar `tipo` no documento do proprio usuario.
9. Resultado esperado: acesso negado.

## O que ja está protegido
- `users/{userId}`
- Leitura somente do proprio documento.
- Criacao somente com `userId == auth.uid`.
- Atualizacao somente do proprio documento, sem trocar `id`, `email`, `tipo` e `createdAt`.
- Delete bloqueado.

- `showcases/{showcaseId}`
- Leitura somente da propria vitrine.
- Criacao somente com `userId == auth.uid` e `id == showcaseId`.
- Atualizacao somente da propria vitrine, sem trocar `id`, `userId` e `createdAt`.
- Delete permitido apenas para o dono.

- `products/{productId}`
- Leitura somente dos proprios produtos.
- Criacao somente com `ownerId == auth.uid`, `id == productId` e `status == disponivel`.
- Atualizacao somente do proprio produto, sem trocar `id`, `ownerId`, `showcaseId`, `status` e `createdAt`.
- Delete permitido apenas para o dono.

- `products/{productId}` (estoque global)
- Leitura permitida para produto `disponivel` de vitrine publica.
- Produto `reservado` pode ser lido pelo dono e por `reservedBy`.

- `reservations/{reservationId}`
- Criacao permitida apenas para `buyerId == auth.uid`.
- Leitura permitida apenas para buyer ou seller.
- Atualizacao permitida apenas para buyer ou seller.
- Delete bloqueado.
- Transicao de status controlada: `ativa -> cancelada` ou `ativa -> concluida`.

- `transactions/{transactionId}`
- Criacao permitida apenas para buyer ou seller da transacao.
- Leitura permitida apenas para buyer ou seller.
- Update e delete bloqueados.

## Proximas colecoes
As colecoes abaixo estao bloqueadas por enquanto (`allow read, write: if false`):
- `reservations`
- `transactions`

Quando essas features forem implementadas, as regras serao abertas de forma incremental por papel/ownership e validacao de campos.
