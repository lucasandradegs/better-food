-- Enum para status do pedido
create type public.order_status as enum (
  'pending', -- Aguardando pagamento
  'processing', -- Pagamento em processamento
  'paid', -- Pago
  'preparing', -- Em preparação
  'ready', -- Pronto para entrega
  'delivering', -- Em entrega
  'delivered', -- Entregue
  'cancelled', -- Cancelado
  'refunded' -- Reembolsado
);

-- Enum para status do pagamento
create type public.payment_status as enum (
  'pending', -- Aguardando pagamento
  'processing', -- Em processamento
  'approved', -- Aprovado
  'declined', -- Recusado
  'refunded', -- Reembolsado
  'cancelled' -- Cancelado
);

-- Tabela de pedidos
create table public.orders (
  id uuid not null default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  status order_status not null default 'pending',
  total_amount decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de itens do pedido
create table public.order_items (
  id uuid not null default uuid_generate_v4() primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null,
  unit_price decimal(10,2) not null,
  total_price decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de pagamentos
create table public.payments (
  id uuid not null default uuid_generate_v4() primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  external_id text, -- ID da transação no PagBank
  status payment_status not null default 'pending',
  amount decimal(10,2) not null,
  payment_method text, -- 'credit_card', 'pix', etc
  payment_details jsonb, -- Detalhes específicos do método de pagamento
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilita RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

-- Políticas de segurança para orders
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can create own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- Políticas de segurança para order_items
create policy "Users can view own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

create policy "Users can create order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

-- Políticas de segurança para payments
create policy "Users can view own payments"
  on public.payments for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = payments.order_id
      and orders.user_id = auth.uid()
    )
  );

create policy "Users can create payments"
  on public.payments for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = payments.order_id
      and orders.user_id = auth.uid()
    )
  );

-- Triggers para updated_at
create trigger handle_updated_at before update on orders
  for each row execute procedure moddatetime();

create trigger handle_updated_at before update on order_items
  for each row execute procedure moddatetime();

create trigger handle_updated_at before update on payments
  for each row execute procedure moddatetime(); 