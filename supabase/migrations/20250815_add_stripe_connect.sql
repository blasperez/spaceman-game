-- Stripe Connect support migration

-- 1) Create stripe_connect_accounts table
create table if not exists public.stripe_connect_accounts (
  id bigserial primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  connect_account_id text not null unique,
  payouts_enabled boolean default false,
  charges_enabled boolean default false,
  details_submitted boolean default false,
  requirements_due jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.stripe_connect_accounts enable row level security;

-- RLS: users can view their own connect account status
create policy if not exists "Users can view own connect account" on public.stripe_connect_accounts
  for select to authenticated using (user_id = auth.uid());

-- 2) Extend withdrawals with connect account linkage (optional)
alter table if exists public.withdrawals
  add column if not exists connect_account_id text,
  add column if not exists connect_transfer_id text;

-- 3) Helpful index
create index if not exists idx_stripe_connect_accounts_user_id on public.stripe_connect_accounts(user_id);

-- 4) Comment
comment on table public.stripe_connect_accounts is 'Stripe Connect accounts linked to Supabase users';