# Painel Administrativo - Roadmap de Implementacao (Nine Half)

## Objetivo
Definir como o painel de admin sera implementado no Nine Half sem quebrar a arquitetura atual:

`Screen -> Hook -> Service -> Firebase`

Este documento serve como base para continuar o projeto em etapas.

---

## Estado Atual
- O campo `tipo` ja existe em `users` (`admin`, `lojista`, `comum`).
- Ainda nao existem telas exclusivas de admin.
- Ainda nao existe fluxo completo de gestao administrativa.
- Regras de seguranca ainda nao concedem poderes administrativos amplos.

---

## Escopo do Painel Admin (MVP)
1. Dashboard Admin
2. Gestao de usuarios
3. Moderacao de vitrines
4. Moderacao de produtos
5. Visao de reservas/transacoes (somente leitura no MVP)
6. Acoes simples de bloqueio logico

Nao entra no MVP:
- Financeiro avancado
- Relatorios complexos com BI
- Notificacoes push
- Permissoes granulares por papel secundario

---

## Regras de Negocio (Admin)
1. Admin pode visualizar usuarios.
2. Admin pode alterar `tipo` de usuario (com validacao).
3. Admin pode bloquear/desbloquear usuario (campo novo sugerido: `ativo`).
4. Admin pode ocultar produto de forma logica (campo novo sugerido: `isHiddenByAdmin`).
5. Admin pode ocultar vitrine de forma logica (campo novo sugerido: `isHiddenByAdmin`).
6. Admin nao deve deletar historico critico (reservas/transacoes) no MVP.

---

## Estrutura Recomendada

### Pastas
```txt
src/
  screens/
    Admin/
      AdminDashboardScreen/
      AdminUsersScreen/
      AdminUserDetailsScreen/
      AdminShowcasesScreen/
      AdminProductsScreen/
      AdminTransactionsScreen/

  hooks/
    useAdmin.ts
    useAdminUsers.ts
    useAdminModeration.ts

  services/
    adminService.ts

  models/
    AdminUserModel.ts (opcional)

  constants/
    adminActions.ts (opcional)
```

---

## Navegacao
Adicionar rotas protegidas:
- `ADMIN_DASHBOARD`
- `ADMIN_USERS`
- `ADMIN_USER_DETAILS`
- `ADMIN_SHOWCASES`
- `ADMIN_PRODUCTS`
- `ADMIN_TRANSACTIONS`

Regra:
- So permitir acesso se `userProfile.tipo === 'admin'`.
- Se nao for admin, redirecionar para Dashboard comum.

---

## Ajustes de Dados Recomendados

### users
Campos atuais:
- id, nome, email, tipo, createdAt, updatedAt

Campos sugeridos:
- `ativo: boolean` (default `true`)
- `blockedReason: string | null`

### showcases
Campos sugeridos:
- `isHiddenByAdmin: boolean` (default `false`)
- `adminNote: string | null`

### products
Campos sugeridos:
- `isHiddenByAdmin: boolean` (default `false`)
- `adminNote: string | null`

### reservations / transactions
Sem alteracao obrigatoria no MVP (apenas leitura admin).

---

## Firestore Rules - Direcao
Criar helper:
```txt
function isAdmin() {
  return request.auth != null
    && exists(/databases/$(database)/documents/users/$(request.auth.uid))
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tipo == 'admin';
}
```

Aplicacoes esperadas:
1. `users`: admin pode listar/ler todos; usuario comum segue lendo apenas o proprio.
2. `users`: admin pode atualizar `tipo` e `ativo` de outros usuarios.
3. `showcases/products`: admin pode ler todos e aplicar ocultacao logica.
4. `reservations/transactions`: admin pode leitura global (sem update/delete no MVP).

Importante:
- Evitar `allow read, write: if true`.
- Manter bloqueio por padrao para colecoes nao tratadas.

---

## Services (adminService.ts) - Funcoes Sugeridas
1. `getAdminMetrics()`
2. `getUsersPaginated({ pageSize, lastVisible, searchText })`
3. `getUserById(userId)`
4. `updateUserRole({ userId, tipo })`
5. `toggleUserActive({ userId, ativo, reason })`
6. `getShowcasesForModeration({ filters, pageSize, lastVisible })`
7. `toggleShowcaseHidden({ showcaseId, hidden, note })`
8. `getProductsForModeration({ filters, pageSize, lastVisible })`
9. `toggleProductHidden({ productId, hidden, note })`
10. `getTransactionsForAdmin({ filters, pageSize, lastVisible })`

---

## Hooks - Responsabilidades

### useAdmin.ts
- Dados do painel (contadores/resumo)
- loading/error do dashboard admin

### useAdminUsers.ts
- Lista paginada de usuarios
- Filtro/busca por nome/email/tipo
- Alteracao de tipo e ativo

### useAdminModeration.ts
- Moderacao de vitrines/produtos
- Acoes de ocultar/reexibir

---

## Telas (MVP)

### AdminDashboardScreen
- KPIs simples:
  - totalUsuarios
  - totalLojistas
  - totalProdutosDisponiveis
  - totalReservasAtivas
  - totalTransacoesConcluidas

### AdminUsersScreen
- Lista com busca e filtros
- Acoes:
  - mudar tipo
  - bloquear/desbloquear

### AdminUserDetailsScreen
- Dados completos do usuario
- Historico basico (quantidade de produtos/reservas/transacoes)

### AdminShowcasesScreen
- Lista de vitrines
- Status visivel/oculta por admin

### AdminProductsScreen
- Lista de produtos com filtros
- Acao de ocultar/reexibir por admin

### AdminTransactionsScreen
- Lista de transacoes para auditoria (somente leitura)

---

## UX e Seguranca
1. Confirmacao antes de acao critica.
2. Logs de erro claros.
3. Mensagens de permissao negada amigaveis.
4. Botao admin so aparece para `tipo = admin`.
5. Evitar operacoes em lote sem feedback visual.

---

## Custos e Plano Gratuito
Para manter Spark/gratuito:
1. Paginacao em todas as listas admin.
2. Evitar listeners em tempo real para listas grandes.
3. Preferir `getDocs` paginado com `limit/startAfter`.
4. Filtrar no servidor com queries indexadas.
5. Sem Cloud Functions neste momento.

---

## Indices Provaveis (Admin)
Criar conforme queries reais:
1. `users`: `tipo ASC`, `createdAt DESC`
2. `users`: `ativo ASC`, `createdAt DESC`
3. `showcases`: `visivel ASC`, `updatedAt DESC`
4. `products`: `status ASC`, `updatedAt DESC`
5. `products`: `isHiddenByAdmin ASC`, `updatedAt DESC`
6. `transactions`: `status ASC`, `completedAt DESC`

---

## Fases de Implementacao

### Fase 1 (base)
- Rotas admin protegidas
- AdminDashboardScreen basica
- AdminUsersScreen listando usuarios

### Fase 2 (gestao de usuarios)
- Alterar tipo
- Bloquear/desbloquear usuario
- Regras Firestore atualizadas

### Fase 3 (moderacao)
- AdminProductsScreen e AdminShowcasesScreen
- Ocultacao logica

### Fase 4 (auditoria)
- AdminTransactionsScreen
- Filtros e paginacao

---

## Checklist Tecnico Antes de Iniciar
1. Confirmar modelo de permissao final (admin unico ou varios admins).
2. Definir se `isAdmin()` vira claim no futuro ou continua via `users.tipo`.
3. Revisar rules para nao abrir acesso indevido.
4. Validar indices necessarios conforme cada query.
5. Testar com 2 contas:
   - admin
   - comum/lojista

---

## Riscos Conhecidos
1. `users.tipo` direto no documento e simples, mas menos robusto que custom claims.
2. Queries admin sem paginacao podem estourar cota gratuita.
3. Regras muito permissivas para admin podem abrir superficie de risco.

---

## Recomendacao Final
Implementar primeiro **Admin Users** com regras seguras e paginacao.  
Depois evoluir para moderacao de vitrines/produtos.  
Manter tudo incremental, com testes manuais a cada fase.
