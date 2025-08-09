-- Payments/Stripe alignment fixes

-- payment_methods: align nullable and bookkeeping cols
alter table if exists public.payment_methods
  alter column user_id drop not null,
  add column if not exists is_active boolean default true,
  add column if not exists deleted_at timestamptz;

-- ensure unique index helpful for a user's default card
create index if not exists idx_payment_methods_user_id on public.payment_methods(user_id);

-- stripe_orders: ensure enum exists and column type matches
do $$
begin
  if not exists (select 1 from pg_type where typname = 'stripe_order_status') then
    create type stripe_order_status as enum ('pending','completed','canceled','failed');
  end if;
end $$;

alter table if exists public.stripe_orders
  alter column status type stripe_order_status using status::stripe_order_status;

-- profiles: totals used by app/webhook
alter table if exists public.profiles
  add column if not exists total_deposits numeric default 0.00,
  add column if not exists total_withdrawals numeric default 0.00;

-- transactions: store stripe payment id if missing
alter table if exists public.transactions
  add column if not exists stripe_payment_id text;

-- stripe_customers (if not present)
create table if not exists public.stripe_customers (
  id bigserial primary key,
  user_id uuid not null unique references auth.users(id),
  customer_id text not null unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);


