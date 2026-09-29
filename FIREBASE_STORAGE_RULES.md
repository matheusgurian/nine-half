# Firebase Storage Rules - Nine Half

## Onde estão as regras
- Arquivo: `storage.rules`

## Como publicar no Firebase Console
1. Firebase Console -> Build -> Storage.
2. Abra a aba `Rules`.
3. Cole o conteúdo de `storage.rules`.
4. Clique em `Publish`.

## O que as regras fazem
- Upload permitido apenas para usuário autenticado na própria pasta:
  - `products/{userId}/{productId}/{fileName}`
- Impede upload na pasta de outro usuário.
- Aceita apenas arquivos de imagem (`image/*`).
- Limita tamanho para 5 MB por arquivo.
- Leitura pública das imagens dos produtos para exibição no app.

## Testes recomendados
1. Usuário autenticado faz upload em `products/{seuUid}/...`: deve funcionar.
2. Usuário autenticado tenta upload em `products/{outroUid}/...`: deve falhar.
3. Upload de arquivo não-imagem: deve falhar.
4. Upload acima de 5 MB: deve falhar.

