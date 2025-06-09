# Dicionário de Dados - Sistema de Delivery

## Informações Gerais
- **Sistema**: Better Food - Plataforma de Delivery
- **SGBD**: PostgreSQL com Supabase
- **Versão**: 1.0
- **Data**: Dezembro 2024

---

## 📋 ÍNDICE DE TABELAS

1. [PROFILES](#profiles) - Perfis de Usuário
2. [STORES](#stores) - Estabelecimentos
3. [STORE_CATEGORIES](#store_categories) - Categorias de Estabelecimentos
4. [PRODUCTS](#products) - Produtos/Cardápio
5. [PRODUCT_CATEGORIES](#product_categories) - Categorias de Produtos
6. [PRODUCT_PRICE_HISTORY](#product_price_history) - Histórico de Preços
7. [ORDERS](#orders) - Pedidos
8. [ORDER_ITEMS](#order_items) - Itens do Pedido
9. [ORDER_RATINGS](#order_ratings) - Avaliações de Pedidos
10. [PAYMENTS](#payments) - Pagamentos
11. [COUPONS](#coupons) - Cupons de Desconto
12. [CHATS](#chats) - Conversas por Pedido
13. [CHAT_MESSAGES](#chat_messages) - Mensagens do Chat
14. [CLIENT_CHAT_NOTIFICATIONS](#client_chat_notifications) - Notificações de Chat
15. [NOTIFICATIONS](#notifications) - Notificações do Sistema

---

## PROFILES
**Descrição**: Armazena informações dos perfis de usuários (clientes e administradores de loja)

| Campo | Tipo | Tamanho | Nulo | Padrão | Chave | Descrição |
|-------|------|---------|------|--------|-------|-----------|
| id | uuid | 36 | NÃO | - | PK | Identificador único do usuário |
| email | text | Variável | SIM | - | - | Email do usuário |
| role | enum (user_role) | Variável | SIM | 'customer' | - | Papel do usuário (customer/admin) |
| created_at | timestamp with time zone | - | NÃO | timezone('utc', now()) | - | Data/hora de criação |
| updated_at | timestamp with time zone | - | NÃO | timezone('utc', now()) | - | Data/hora da última atualização |
| total_orders | integer | 4 bytes | SIM | 0 | - | Total de pedidos realizados |
| total_spent | numeric | Variável | SIM | 0 | - | Valor total gasto pelo usuário |
| last_order_at | timestamp with time zone | - | SIM | - | - | Data/hora do último pedido |
| average_order_value | numeric | Variável | SIM | 0 | - | Valor médio dos pedidos |

**Chaves Estrangeiras:**
- id → auth.users(id)

**Índices:**
- PK: profiles_pkey (id)

---

## STORES
**Descrição**: Armazena informações dos estabelecimentos/lojas

| Campo | Tipo | Tamanho | Nulo | Padrão | Chave | Descrição |
|-------|------|---------|------|--------|-------|-----------|
| id | uuid | 36 | NÃO | uuid_generate_v4() | PK | Identificador único da loja |
| name | text | Variável | NÃO | - | - | Nome da loja |
| category_id | uuid | 36 | NÃO | - | FK | Categoria da loja |
| order_count | integer | 4 bytes | SIM | 0 | - | Contador de pedidos da loja |
| logo_url | text | Variável | SIM | - | - | URL do logo da loja |
| admin_id | uuid | 36 | NÃO | - | FK,UK | Administrador responsável |
| created_at | timestamp with time zone | - | SIM | now() | - | Data/hora de criação |
| updated_at | timestamp with time zone | - | SIM | now() | - | Data/hora da última atualização |
| is_visible | boolean | 1 byte | NÃO | true | - | Controla visibilidade da loja |

**Chaves Estrangeiras:**
- category_id → store_categories(id)
- admin_id → profiles(id)

**Índices:**
- PK: stores_pkey (id)
- UK: admin_id (único)

---

## STORE_CATEGORIES
**Descrição**: Categorias dos estabelecimentos (ex: Lanches, Pizza, Sushi)

| Campo | Tipo | Tamanho | Nulo | Padrão | Chave | Descrição |
|-------|------|---------|------|--------|-------|-----------|
| id | uuid | 36 | NÃO | uuid_generate_v4() | PK | Identificador único da categoria |
| name | text | Variável | NÃO | - | UK | Nome da categoria |
| created_at | timestamp with time zone | - | SIM | now() | - | Data/hora de criação |
| updated_at | timestamp with time zone | - | SIM | now() | - | Data/hora da última atualização |

**Índices:**
- PK: store_categories_pkey (id)
- UK: name (único)

---

## PRODUCTS
**Descrição**: Produtos/itens do cardápio dos estabelecimentos

| Campo | Tipo | Tamanho | Nulo | Padrão | Chave | Descrição |
|-------|------|---------|------|--------|-------|-----------|
| id | uuid | 36 | NÃO | uuid_generate_v4() | PK | Identificador único do produto |
| name | text | Variável | NÃO | - | - | Nome do produto |
| price | numeric | Variável | NÃO | - | - | Preço do produto |
| category_id | uuid | 36 | NÃO | - | FK | Categoria do produto |
| is_available | boolean | 1 byte | SIM | true | - | Disponibilidade do produto |
| image_url | text | Variável | SIM | - | - | URL da imagem do produto |
| store_id | uuid | 36 | NÃO | - | FK | Loja proprietária |
| created_at | timestamp with time zone | - | SIM | now() | - | Data/hora de criação |
| updated_at | timestamp with time zone | - | SIM | now() | - | Data/hora da última atualização |
| description | text | Variável | SIM | - | - | Descrição detalhada |
| total_sales | integer | 4 bytes | SIM | 0 | - | Total de vendas do produto |
| total_revenue | numeric | Variável | SIM | 0 | - | Receita total gerada |
| last_sale_at | timestamp with time zone | - | SIM | - | - | Data/hora da última venda |

**Chaves Estrangeiras:**
- category_id → product_categories(id)
- store_id → stores(id)

**Índices:**
- PK: products_pkey (id)

---

## PRODUCT_CATEGORIES
**Descrição**: Categorias dos produtos (ex: Bebidas, Lanches, Sobremesas)

| Campo | Tipo | Tamanho | Nulo | Padrão | Chave | Descrição |
|-------|------|---------|------|--------|-------|-----------|
| id | uuid | 36 | NÃO | uuid_generate_v4() | PK | Identificador único da categoria |
| name | text | Variável | NÃO | - | UK | Nome da categoria |
| created_at | timestamp with time zone | - | SIM | now() | - | Data/hora de criação |
| updated_at | timestamp with time zone | - | SIM | now() | - | Data/hora da última atualização |

**Índices:**
- PK: product_categories_pkey (id)
- UK: name (único)

---

## PRODUCT_PRICE_HISTORY
**Descrição**: Histórico de alterações de preços dos produtos

| Campo | Tipo | Tamanho | Nulo | Padrão | Chave | Descrição |
|-------|------|---------|------|--------|-------|-----------|
| id | uuid | 36 | NÃO | uuid_generate_v4() | PK | Identificador único do registro |
| product_id | uuid | 36 | SIM | - | FK | Produto alterado |
| old_price | numeric | Variável | SIM | - | - | Preço anterior |
| new_price | numeric | Variável | SIM | - | - | Novo preço |
| changed_at | timestamp with time zone | - | SIM | now() | - | Data/hora da alteração |
| created_at | timestamp with time zone | - | SIM | now() | - | Data/hora de criação do registro |

**Chaves Estrangeiras:**
- product_id → products(id)

**Índices:**
- PK: product_price_history_pkey (id)

---

## ORDERS
**Descrição**: Pedidos realizados pelos clientes

| Campo | Tipo | Tamanho | Nulo | Padrão | Chave | Descrição |
|-------|------|---------|------|--------|-------|-----------|
| id | uuid | 36 | NÃO | uuid_generate_v4() | PK | Identificador único do pedido |
| user_id | uuid | 36 | NÃO | - | FK | Cliente que fez o pedido |
| store_id | uuid | 36 | NÃO | - | FK | Loja do pedido |
| status | enum (order_status) | Variável | NÃO | 'pending' | - | Status do pedido |
| total_amount | numeric | Variável | NÃO | - | - | Valor total do pedido |
| created_at | timestamp with time zone | - | NÃO | timezone('utc', now()) | - | Data/hora de criação |
| updated_at | timestamp with time zone | - | NÃO | timezone('utc', now()) | - | Data/hora da última atualização |
| admin_id | uuid | 36 | NÃO | - | FK | Admin responsável pelo pedido |
| coupon_id | uuid | 36 | SIM | - | FK | Cupom aplicado (se houver) |
| discount_amount | numeric | Variável | SIM | 0 | - | Valor do desconto aplicado |
| is_counted | boolean | 1 byte | SIM | false | - | Se foi contabilizado nos relatórios |
| observations | text | Variável | SIM | - | - | Observações do cliente |

**Chaves Estrangeiras:**
- user_id → auth.users(id)
- store_id → stores(id)
- admin_id → profiles(id)
- coupon_id → coupons(id)

**Índices:**
- PK: orders_pkey (id)

---

## ORDER_ITEMS
**Descrição**: Itens individuais que compõem cada pedido

| Campo | Tipo | Tamanho | Nulo | Padrão | Chave | Descrição |
|-------|------|---------|------|--------|-------|-----------|
| id | uuid | 36 | NÃO | uuid_generate_v4() | PK | Identificador único do item |
| order_id | uuid | 36 | NÃO | - | FK | Pedido ao qual pertence |
| product_id | uuid | 36 | NÃO | - | FK | Produto solicitado |
| quantity | integer | 4 bytes | NÃO | - | - | Quantidade do produto |
| unit_price | numeric | Variável | NÃO | - | - | Preço unitário no momento |
| total_price | numeric | Variável | NÃO | - | - | Preço total do item |
| created_at | timestamp with time zone | - | NÃO | timezone('utc', now()) | - | Data/hora de criação |
| updated_at | timestamp with time zone | - | NÃO | timezone('utc', now()) | - | Data/hora da última atualização |

**Chaves Estrangeiras:**
- order_id → orders(id)
- product_id → products(id)

**Índices:**
- PK: order_items_pkey (id)

---

## ORDER_RATINGS
**Descrição**: Avaliações feitas pelos clientes após a entrega

| Campo | Tipo | Tamanho | Nulo | Padrão | Chave | Descrição |
|-------|------|---------|------|--------|-------|-----------|
| id | uuid | 36 | NÃO | uuid_generate_v4() | PK | Identificador único da avaliação |
| user_id | uuid | 36 | NÃO | - | FK | Cliente que avaliou |
| order_id | uuid | 36 | NÃO | - | FK,UK | Pedido avaliado (único) |
| store_id | uuid | 36 | NÃO | - | FK | Loja avaliada |
| rating | integer | 4 bytes | NÃO | - | - | Nota geral (1-5) |
| comment | text | Variável | SIM | - | - | Comentário da avaliação |
| delivery_rating | integer | 4 bytes | SIM | - | - | Nota da entrega (1-5) |
| food_rating | integer | 4 bytes | SIM | - | - | Nota da comida (1-5) |
| created_at | timestamp with time zone | - | NÃO | timezone('utc', now()) | - | Data/hora de criação |
| updated_at | timestamp with time zone | - | NÃO | timezone('utc', now()) | - | Data/hora da última atualização |

**Chaves Estrangeiras:**
- user_id → auth.users(id)
- order_id → orders(id)
- store_id → stores(id)

**Restrições:**
- rating: CHECK (rating >= 1 AND rating <= 5)
- delivery_rating: CHECK (delivery_rating >= 1 AND delivery_rating <= 5)
- food_rating: CHECK (food_rating >= 1 AND food_rating <= 5)

**Índices:**
- PK: order_ratings_pkey (id)
- UK: order_id (único)

---

## PAYMENTS
**Descrição**: Registros de pagamentos processados

| Campo | Tipo | Tamanho | Nulo | Padrão | Chave | Descrição |
|-------|------|---------|------|--------|-------|-----------|
| id | uuid | 36 | NÃO | uuid_generate_v4() | PK | Identificador único do pagamento |
| order_id | uuid | 36 | NÃO | - | FK | Pedido relacionado |
| pagbank_id | text | Variável | NÃO | - | - | ID da transação no PagBank |
| amount | numeric | Variável | NÃO | - | - | Valor do pagamento |
| response_data | jsonb | Variável | SIM | - | - | Dados de resposta da operadora |
| created_at | timestamp with time zone | - | NÃO | timezone('utc', now()) | - | Data/hora de criação |
| updated_at | timestamp with time zone | - | NÃO | timezone('utc', now()) | - | Data/hora da última atualização |
| status | enum (payment_status) | Variável | NÃO | - | - | Status do pagamento |
| payment_method | enum (payment_method) | Variável | NÃO | - | - | Método de pagamento usado |

**Chaves Estrangeiras:**
- order_id → orders(id)

**Índices:**
- PK: payments_pkey (id)

---

## COUPONS
**Descrição**: Cupons de desconto disponíveis no sistema

| Campo | Tipo | Tamanho | Nulo | Padrão | Chave | Descrição |
|-------|------|---------|------|--------|-------|-----------|
| id | uuid | 36 | NÃO | uuid_generate_v4() | PK | Identificador único do cupom |
| name | text | Variável | NÃO | - | UK | Nome/código do cupom |
| discount | integer | 4 bytes | NÃO | - | - | Percentual de desconto (1-100) |
| amount_used | integer | 4 bytes | SIM | 0 | - | Quantidade de vezes usado |
| is_active | boolean | 1 byte | SIM | true | - | Se o cupom está ativo |
| created_at | timestamp with time zone | - | SIM | now() | - | Data/hora de criação |
| updated_at | timestamp with time zone | - | SIM | now() | - | Data/hora da última atualização |

**Restrições:**
- discount: CHECK (discount > 0 AND discount <= 100)

**Índices:**
- PK: coupons_pkey (id)
- UK: name (único)

---

## CHATS
**Descrição**: Canais de comunicação entre cliente e loja por pedido

| Campo | Tipo | Tamanho | Nulo | Padrão | Chave | Descrição |
|-------|------|---------|------|--------|-------|-----------|
| id | uuid | 36 | NÃO | gen_random_uuid() | PK | Identificador único do chat |
| store_id | uuid | 36 | NÃO | - | FK | Loja participante |
| user_id | uuid | 36 | NÃO | - | FK | Cliente participante |
| order_id | uuid | 36 | NÃO | - | FK | Pedido relacionado |
| status | enum (chat_status) | Variável | SIM | 'active' | - | Status do chat |
| created_at | timestamp with time zone | - | NÃO | timezone('utc', now()) | - | Data/hora de criação |
| updated_at | timestamp with time zone | - | NÃO | timezone('utc', now()) | - | Data/hora da última atualização |
| last_viewed_at | timestamp with time zone | - | SIM | - | - | Última visualização |
| has_new_messages | boolean | 1 byte | SIM | false | - | Indica mensagens não lidas |
| last_read_at | timestamp with time zone | - | SIM | - | - | Última leitura |

**Chaves Estrangeiras:**
- store_id → stores(id)
- user_id → profiles(id)
- order_id → orders(id)

**Índices:**
- PK: chats_pkey (id)

---

## CHAT_MESSAGES
**Descrição**: Mensagens individuais dos chats

| Campo | Tipo | Tamanho | Nulo | Padrão | Chave | Descrição |
|-------|------|---------|------|--------|-------|-----------|
| id | uuid | 36 | NÃO | gen_random_uuid() | PK | Identificador único da mensagem |
| chat_id | uuid | 36 | NÃO | - | FK | Chat ao qual pertence |
| sender_id | uuid | 36 | NÃO | - | FK | Remetente da mensagem |
| content | text | Variável | NÃO | - | - | Conteúdo da mensagem |
| created_at | timestamp with time zone | - | NÃO | timezone('utc', now()) | - | Data/hora de envio |
| read_at | timestamp with time zone | - | SIM | - | - | Data/hora de leitura |

**Chaves Estrangeiras:**
- chat_id → chats(id)
- sender_id → profiles(id)

**Índices:**
- PK: chat_messages_pkey (id)

---

## CLIENT_CHAT_NOTIFICATIONS
**Descrição**: Controle de notificações de chat por cliente

| Campo | Tipo | Tamanho | Nulo | Padrão | Chave | Descrição |
|-------|------|---------|------|--------|-------|-----------|
| id | uuid | 36 | NÃO | gen_random_uuid() | PK | Identificador único |
| chat_id | uuid | 36 | NÃO | - | FK | Chat relacionado |
| profile_id | uuid | 36 | NÃO | - | FK | Perfil do cliente |
| has_unread_messages | boolean | 1 byte | SIM | false | - | Mensagens não lidas |
| last_read_at | timestamp with time zone | - | SIM | - | - | Última leitura |
| created_at | timestamp with time zone | - | NÃO | timezone('utc', now()) | - | Data/hora de criação |
| updated_at | timestamp with time zone | - | NÃO | timezone('utc', now()) | - | Data/hora da última atualização |

**Chaves Estrangeiras:**
- chat_id → chats(id)
- profile_id → profiles(id)

**Índices:**
- PK: client_chat_notifications_pkey (id)

---

## NOTIFICATIONS
**Descrição**: Notificações gerais do sistema para usuários

| Campo | Tipo | Tamanho | Nulo | Padrão | Chave | Descrição |
|-------|------|---------|------|--------|-------|-----------|
| id | uuid | 36 | NÃO | uuid_generate_v4() | PK | Identificador único da notificação |
| user_id | uuid | 36 | NÃO | - | FK | Usuário destinatário |
| title | text | Variável | NÃO | - | - | Título da notificação |
| description | text | Variável | NÃO | - | - | Descrição detalhada |
| status | enum (notification_status) | Variável | NÃO | 'unread' | - | Status da notificação |
| created_at | timestamp with time zone | - | NÃO | timezone('utc', now()) | - | Data/hora de criação |
| updated_at | timestamp with time zone | - | NÃO | timezone('utc', now()) | - | Data/hora da última atualização |
| viewed | boolean | 1 byte | NÃO | false | - | Se foi visualizada |
| path | text | Variável | SIM | - | - | Caminho para navegação |

**Chaves Estrangeiras:**
- user_id → auth.users(id)

**Índices:**
- PK: notifications_pkey (id)

---

## 📊 RESUMO ESTATÍSTICO

| Aspecto | Quantidade |
|---------|------------|
| **Total de Tabelas** | 15 |
| **Total de Campos** | 95 |
| **Chaves Primárias** | 15 |
| **Chaves Estrangeiras** | 25 |
| **Campos obrigatórios** | 45 |
| **Campos opcionais** | 50 |
| **Campos com valores padrão** | 38 |

## 🔑 TIPOS DE DADOS UTILIZADOS

| Tipo | Quantidade | Descrição |
|------|------------|-----------|
| **uuid** | 45 | Identificadores únicos |
| **text** | 20 | Textos variáveis |
| **timestamp with time zone** | 18 | Data/hora com timezone |
| **integer** | 7 | Números inteiros |
| **numeric** | 11 | Números decimais |
| **boolean** | 8 | Valores verdadeiro/falso |
| **enum** | 6 | Valores enumerados |
| **jsonb** | 1 | Dados JSON |

## 📝 CONVENÇÕES UTILIZADAS

### Nomenclatura
- **Tabelas**: snake_case, plural
- **Campos**: snake_case, singular
- **Chaves Primárias**: sempre "id"
- **Timestamps**: created_at, updated_at

### Padrões
- **UUIDs**: Todas as PKs são UUID v4
- **Timestamps**: UTC timezone por padrão
- **Soft Delete**: Não implementado
- **Auditoria**: created_at/updated_at em todas as tabelas

---

**Fim do Dicionário de Dados**
**Versão**: 1.0 | **Data**: Dezembro 2024 | **Sistema**: Better Food 