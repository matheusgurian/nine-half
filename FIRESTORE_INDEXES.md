# Firestore Indexes - Nine Half

As consultas do Estoque Global usam filtros e ordenação com paginação. No Firebase Console, crie os índices compostos abaixo conforme necessário (o próprio erro do Firestore também fornece link direto para criação):

## Coleção `products`

1. `status` (ASC), `showcaseVisible` (ASC), `createdAt` (DESC)
- Uso: listagem padrão "mais recentes".

2. `status` (ASC), `showcaseVisible` (ASC), `precoNumber` (ASC)
- Uso: ordenação por menor preço.

3. `status` (ASC), `showcaseVisible` (ASC), `precoNumber` (DESC)
- Uso: ordenação por maior preço.

4. `status` (ASC), `showcaseVisible` (ASC), `origem` (ASC), `createdAt` (DESC)
- Uso: filtro de origem + recentes.

5. `status` (ASC), `showcaseVisible` (ASC), `numeracao` (ASC), `createdAt` (DESC)
- Uso: filtro de numeração + recentes.

6. `status` (ASC), `showcaseVisible` (ASC), `marcaLower` (ASC), `createdAt` (DESC)
- Uso: filtro de marca + recentes.

7. `status` (ASC), `showcaseVisible` (ASC), `searchKeywords` (ARRAY), `createdAt` (DESC)
- Uso: busca por palavra-chave + recentes.

8. `status` (ASC), `showcaseVisible` (ASC), `searchKeywords` (ARRAY), `precoNumber` (ASC)
- Uso: busca + menor preço.

9. `status` (ASC), `showcaseVisible` (ASC), `searchKeywords` (ARRAY), `precoNumber` (DESC)
- Uso: busca + maior preço.

10. `status` (ASC), `showcaseVisible` (ASC), `marcaLower` (ASC), `origem` (ASC), `createdAt` (DESC)
- Uso: marca + origem + recentes.

11. `status` (ASC), `showcaseVisible` (ASC), `marcaLower` (ASC), `numeracao` (ASC), `createdAt` (DESC)
- Uso: marca + numeracao + recentes.

12. `status` (ASC), `showcaseVisible` (ASC), `searchKeywords` (ARRAY), `origem` (ASC), `precoNumber` (ASC)
- Uso: busca + origem + faixa de preço/menor preço.

13. `showcaseId` (ASC), `status` (ASC)
- Uso: listagem pública por vitrines em lote (`where('showcaseId', 'in', ids)` + `where('status', '==', 'disponivel')`).

14. `ownerId` (ASC), `showcaseVisible` (ASC), `status` (ASC)
- Uso: perfil público do vendedor (somente produtos ativos e visíveis).

## Observações
- Combinações com `minPrice/maxPrice` usam `precoNumber` com operadores de faixa e podem exigir índices adicionais conforme combinação de filtros.
- Ao combinar vários filtros de igualdade (`marcaLower`, `numeracao`, `origem`) com busca e ordenação, o Firestore pode pedir índice composto específico. Use o link de criação automática do erro para gerar o índice exato necessário.
- Para reduzir custo no plano gratuito, mantenha `limit()` em todas as consultas e paginação por cursor (`startAfter`).

## Queries cobertas no código

- `src/services/globalStockService.ts`: coberto pelos índices 1-12 (com possibilidade de combinações extras conforme filtros ativos).
- `src/services/productService.ts:getPublicAvailableProducts`: usa o índice 13.
- `src/services/productService.ts:getPublicAvailableProductsByOwner`: usa o índice 14.

## Como validar rápido no Firebase Console

1. Abra o app e execute os fluxos: estoque global, perfil público de vendedor e listagem pública.
2. Se faltar índice, o Firestore retorna `FAILED_PRECONDITION` com link direto de criação.
3. Crie o índice pelo link, aguarde build e repita a ação.
