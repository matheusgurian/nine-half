# Checklist de Testes - Nine Half

## 1. Auth
- [ ] Cadastro cria usuario no Auth
- [ ] Cadastro cria `users/{uid}` no Firestore
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Usuario nao acessa perfil de outro usuario

## 2. Vitrine
- [ ] Criar vitrine
- [ ] Editar nome
- [ ] Tornar publica
- [ ] Tornar privada
- [ ] Vitrine privada nao aparece no estoque global

## 3. Produto
- [ ] Criar produto sem imagem
- [ ] Criar produto com imagem
- [ ] Editar produto
- [ ] Trocar imagem do produto
- [ ] Remover produto
- [ ] Produto aparece na propria vitrine

## 4. Upload/Storage
- [ ] Upload autentificado na propria pasta funciona
- [ ] Upload em pasta de outro usuario falha
- [ ] Upload de arquivo nao-imagem falha
- [ ] Upload > 5MB falha

## 5. Estoque global
- [ ] Carrega lista inicial limitada (paginada)
- [ ] Busca por marca funciona
- [ ] Busca por modelo funciona
- [ ] Filtro por numeracao funciona
- [ ] Filtro por origem funciona
- [ ] Filtro por faixa de preco funciona
- [ ] Ordenacao recentes funciona
- [ ] Ordenacao menor preco funciona
- [ ] Ordenacao maior preco funciona
- [ ] Carregar mais funciona
- [ ] Pull-to-refresh funciona
- [ ] Produto proprio nao aparece no global
- [ ] Produto reservado nao aparece no global
- [ ] Produto vendido nao aparece no global

## 6. Reserva
- [ ] Usuario B reserva produto disponivel de A
- [ ] Produto muda para `reservado`
- [ ] Reserva aparece em Minhas Reservas
- [ ] Cancelar reserva retorna produto para `disponivel`
- [ ] Reserva de produto proprio e bloqueada
- [ ] Reserva concorrente (2 usuarios) permite apenas um sucesso

## 7. Finalizacao
- [ ] Finalizar reserva ativa cria transaction
- [ ] `reservation.status` vira `concluida`
- [ ] `product.status` vira `vendido`
- [ ] Produto vendido nao volta para global
- [ ] Tentativa de finalizar reserva cancelada falha

## 8. Seguranca Firestore
- [ ] Nao editar produto de outro usuario
- [ ] Nao ler reserva sem ser buyer/seller
- [ ] Nao atualizar/deletar transaction como usuario comum
- [ ] Nao alterar tipo de usuario para admin pelo app

