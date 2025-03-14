# Better Food - Documentação do Sistema

## 📖 Sobre o Projeto

Better Food é uma plataforma de delivery de comida inspirada no iFood, desenvolvida com tecnologias modernas e focada em proporcionar uma experiência fluida tanto para clientes quanto para estabelecimentos parceiros.

## 🚀 Tecnologias Principais

- **Frontend**: Next.js 14 com TypeScript
- **Estilização**: Tailwind CSS
- **Banco de Dados**: Supabase
- **Autenticação**: Supabase Auth
- **Pagamentos**: PagBank
- **Deploy**: Vercel

## 🏗️ Estrutura do Projeto

```
better-food/
├── app/                    # Diretório principal do Next.js
│   ├── api/               # Endpoints da API
│   ├── (auth)/           # Páginas de autenticação
│   ├── auth/             # Rota de autenticação
│   └── login/            # Página de login
├── components/           # Componentes React reutilizáveis
│   ├── Admin/           # Componentes específicos para administradores
│   ├── Cart/            # Componentes do carrinho de compras
│   ├── Checkout/        # Componentes do processo de checkout
│   ├── OrderCard/       # Cards de pedidos
│   ├── Store/           # Componentes da loja
│   └── ui/              # Componentes de UI genéricos
├── contexts/            # Contextos React
├── hooks/              # Hooks personalizados
├── lib/                # Bibliotecas e configurações
├── services/           # Serviços de integração
├── utils/              # Funções utilitárias
└── public/             # Arquivos estáticos
```

## 👥 Perfis de Usuário

### 🏪 Administradores (Lojistas)
- Cadastro e gerenciamento de estabelecimento
- Dashboard com métricas e estatísticas
  - Quantidade de pedidos
  - Valores arrecadados
  - Avaliações dos clientes
- Gerenciamento de produtos
- Controle de pedidos

### 👤 Clientes
- Navegação por estabelecimentos
- Realização de pedidos
- Sistema de avaliação pós-pedido
- Acompanhamento de pedidos
- Histórico de compras

## 💳 Sistema de Pagamento

O sistema está integrado com o PagBank, oferecendo:
- Pagamentos via cartão de crédito
- Processamento seguro de transações
- Gestão de reembolsos (quando necessário)

## 🔐 Autenticação e Autorização

- Sistema de login e registro
- Proteção de rotas por perfil de usuário
- Tokens JWT para autenticação
- Middleware de autorização para funções administrativas

## 📱 Principais Funcionalidades

### Para Administradores
- Dashboard administrativo
- Gestão de cardápio
- Controle de pedidos
- Visualização de métricas
- Gestão de estabelecimento

### Para Clientes
- Busca de estabelecimentos
- Filtros por categoria
- Carrinho de compras
- Checkout seguro
- Sistema de avaliação
- Histórico de pedidos

## 🗃️ Estrutura de Dados Principal

### 🔢 Tipos Enumerados

#### Status de Pedido (`order_status`)
- `pending`: Aguardando processamento
- `processing`: Em processamento
- `paid`: Pago
- `preparing`: Em preparação
- `ready`: Pronto
- `delivering`: Em entrega
- `delivered`: Entregue
- `cancelled`: Cancelado
- `refunded`: Reembolsado

#### Status de Pagamento (`payment_status`)
- `pending`: Aguardando
- `processing`: Processando
- `approved`: Aprovado
- `declined`: Recusado
- `refunded`: Reembolsado
- `cancelled`: Cancelado

#### Status de Notificação (`notification_status`)
- `read`: Lida
- `unread`: Não lida

#### Papel do Usuário (`user_role`)
- `admin`: Administrador
- `customer`: Cliente

### Tabelas do Sistema

#### 👤 Profiles (Usuários)
- `id` (UUID): Identificador único do usuário
- `email` (Text): Email do usuário
- `role` ('admin' | 'customer'): Papel do usuário no sistema
- `created_at` (Timestamp): Data de criação
- `updated_at` (Timestamp): Data de atualização
**Relacionamentos**:
- One-to-One com a tabela `users`

#### 🏪 Stores (Estabelecimentos)
- `id` (UUID): Identificador único da loja
- `name` (Text): Nome da loja
- `category_id` (UUID): Categoria da loja
- `logo_url` (Text | null): URL do logo
- `admin_id` (UUID): ID do administrador
- `created_at` (Timestamp): Data de criação
- `updated_at` (Timestamp): Data de atualização
**Relacionamentos**:
- Many-to-One com `users` através de `admin_id`
- Many-to-One com `store_categories` através de `category_id`

#### 📦 Products (Produtos)
- `id` (UUID): Identificador único do produto
- `name` (Text): Nome do produto
- `price` (Numeric): Preço
- `category_id` (UUID): Categoria do produto
- `is_available` (Boolean): Disponibilidade
- `image_url` (Text | null): URL da imagem
- `store_id` (UUID): ID da loja
- `created_at` (Timestamp): Data de criação
- `updated_at` (Timestamp): Data de atualização
**Relacionamentos**:
- Many-to-One com `product_categories` através de `category_id`
- Many-to-One com `stores` através de `store_id`

#### 🛍️ Orders (Pedidos)
- `id` (UUID): Identificador único do pedido
- `user_id` (UUID): ID do usuário
- `store_id` (UUID): ID da loja
- `admin_id` (UUID): ID do administrador
- `status` (order_status): Status do pedido
- `total_amount` (Numeric): Valor total
- `coupon_id` (UUID | null): ID do cupom aplicado
- `discount_amount` (Numeric): Valor do desconto
- `created_at` (Timestamp): Data de criação
- `updated_at` (Timestamp): Data de atualização
**Relacionamentos**:
- Many-to-One com `users` através de `user_id`
- Many-to-One com `stores` através de `store_id`
- Many-to-One com `users` através de `admin_id`
- Many-to-One com `coupons` através de `coupon_id`

#### 🔔 Notifications (Notificações)
- `id` (UUID): Identificador único da notificação
- `user_id` (UUID): ID do usuário
- `title` (Text): Título
- `description` (Text): Descrição
- `status` ('read' | 'unread'): Status
- `viewed` (Boolean): Status de visualização
- `path` (Text | null): Caminho de redirecionamento
- `created_at` (Timestamp): Data de criação
- `updated_at` (Timestamp): Data de atualização
**Relacionamentos**:
- Many-to-One com `users` através de `user_id`

### 🔄 Funções do Banco

#### get_unread_notifications_count
- **Parâmetros**: `p_user_id` (UUID)
- **Retorno**: number
- **Descrição**: Retorna a quantidade de notificações não lidas para um usuário específico

### Relacionamentos Principais

1. **Profiles -> Users**: Relacionamento um-para-um com a tabela de usuários
2. **Stores -> Users**: Uma loja pertence a um administrador (user)
3. **Stores -> Categories**: Uma loja pertence a uma categoria
4. **Products -> Categories**: Um produto pertence a uma categoria
5. **Products -> Stores**: Um produto pertence a uma loja
6. **Orders -> Users**: Um pedido pertence a um usuário e um administrador
7. **Orders -> Stores**: Um pedido pertence a uma loja
8. **Orders -> Coupons**: Um pedido pode ter um cupom aplicado
9. **Notifications -> Users**: Uma notificação pertence a um usuário

## 🔄 Fluxo de Pedido

1. Cliente seleciona estabelecimento
2. Adiciona produtos ao carrinho
3. Realiza checkout
4. Processa pagamento via PagBank
5. Estabelecimento recebe e processa o pedido
6. Cliente pode avaliar após a entrega

## 📦 Dependências Principais

```json
{
  "next": "^14.x",
  "react": "^18.x",
  "tailwindcss": "^3.x",
  "@supabase/supabase-js": "latest"
}
```

## 🚀 Como Iniciar o Projeto

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env.local`
   - Adicione as configurações necessárias
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🔧 Configuração do Ambiente

### Variáveis de Ambiente Necessárias
- Credenciais do Supabase
- Chaves do PagBank
- Configurações de API
- URLs do ambiente

## 📈 Próximos Passos

- [ ] Revisão da estrutura do banco de dados
- [ ] Documentação detalhada das APIs
- [ ] Guia de contribuição
- [ ] Documentação de deployment 