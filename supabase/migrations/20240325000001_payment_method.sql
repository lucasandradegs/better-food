-- Enum para método de pagamento
create type public.payment_method as enum (
  'credit_card', -- Cartão de crédito
  'pix' -- PIX
);

-- Adicionar coluna payment_method na tabela payments
alter table public.payments
add column payment_method payment_method; 