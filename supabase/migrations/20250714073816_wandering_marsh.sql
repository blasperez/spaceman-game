/*
  # Stripe Integration Schema

  1. New Tables
    - `stripe_customers`: Links Supabase users to Stripe customers
      - Includes `user_id` (references `auth.users`)
      - Stores Stripe `customer_id`
      - Implements soft delete

    - `stripe_subscriptions`: Manages subscription data
      - Tracks subscription status, periods, and payment details
      - Links to `stripe_customers` via `customer_id`
      - Custom enum type for subscription status
      - Implements soft delete

    - `stripe_orders`: Stores order/purchase information
      - Records checkout sessions and payment intents
      - Tracks payment amounts and status
      - Custom enum type for order status
      - Implements soft delete

    - `withdrawals`: Manages withdrawal requests
      - Tracks withdrawal requests and their status
      - Links to user accounts and payment methods
      - Implements approval workflow

    - `payment_methods`: Stores user payment methods
      - Tracks saved payment methods
      - Links to Stripe payment methods
      - Implements soft delete

  2. Views
    - `stripe_user_subscriptions`: Secure view for user subscription data
      - Joins customers and subscriptions
      - Filtered by authenticated user

    - `stripe_user_orders`: Secure view for user order history
      - Joins customers and orders
      - Filtered by authenticated user

    - `user_transaction_history`: Complete transaction history
      - Combines deposits, withdrawals, and game transactions
      - Filtered by authenticated user

  3. Security
    - Enables Row Level Security (RLS) on all tables
    - Implements policies for authenticated users to view their own data
*/

-- Enhanced transactions table with more detailed tracking
ALTER TABLE IF EXISTS transactions ADD COLUMN IF NOT EXISTS stripe_payment_id text;
ALTER TABLE IF EXISTS transactions ADD COLUMN IF NOT EXISTS stripe_payment_method_id text;
ALTER TABLE IF EXISTS transactions ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE IF EXISTS transactions ADD COLUMN IF NOT EXISTS fee_amount numeric DEFAULT 0;
ALTER TABLE IF EXISTS transactions ADD COLUMN IF NOT EXISTS net_amount numeric;
ALTER TABLE IF EXISTS transactions ADD COLUMN IF NOT EXISTS currency text DEFAULT 'usd';
ALTER TABLE IF EXISTS transactions ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
  payment_method text NOT NULL,
  account_details jsonb NOT NULL, -- Bank account, PayPal, etc.
  fee_amount numeric DEFAULT 0,
  net_amount numeric,
  currency text DEFAULT 'usd',
  stripe_payout_id text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_method_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('card', 'bank_account', 'paypal')),
  brand text, -- visa, mastercard, etc.
  last4 text,
  expiry_month integer,
  expiry_year integer,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT null
);

-- Enhanced game_history table with more details
ALTER TABLE IF EXISTS game_history ADD COLUMN IF NOT EXISTS game_type text DEFAULT 'spaceman';
ALTER TABLE IF EXISTS game_history ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed';
ALTER TABLE IF EXISTS game_history ADD COLUMN IF NOT EXISTS session_id text;
ALTER TABLE IF EXISTS game_history ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Create user transaction history view
CREATE OR REPLACE VIEW user_transaction_history AS
SELECT 
  id,
  user_id,
  'deposit' as transaction_type,
  amount,
  status,
  payment_method,
  created_at,
  description,
  fee_amount,
  net_amount,
  currency,
  metadata
FROM transactions 
WHERE type = 'deposit' AND user_id = auth.uid()

UNION ALL

SELECT 
  id,
  user_id,
  'withdrawal' as transaction_type,
  amount,
  status,
  payment_method,
  created_at,
  description,
  fee_amount,
  net_amount,
  currency,
  metadata
FROM transactions 
WHERE type = 'withdrawal' AND user_id = auth.uid()

UNION ALL

SELECT 
  id,
  user_id,
  'game_win' as transaction_type,
  win_amount as amount,
  'completed' as status,
  'game' as payment_method,
  created_at,
  'Game win - ' || game_type as description,
  0 as fee_amount,
  win_amount as net_amount,
  'usd' as currency,
  jsonb_build_object('game_id', game_id, 'bet_amount', bet_amount, 'multiplier', multiplier, 'game_type', game_type) as metadata
FROM game_history 
WHERE win_amount > bet_amount AND user_id = auth.uid()

UNION ALL

SELECT 
  id,
  user_id,
  'game_loss' as transaction_type,
  bet_amount as amount,
  'completed' as status,
  'game' as payment_method,
  created_at,
  'Game bet - ' || game_type as description,
  0 as fee_amount,
  -bet_amount as net_amount,
  'usd' as currency,
  jsonb_build_object('game_id', game_id, 'win_amount', win_amount, 'multiplier', multiplier, 'game_type', game_type) as metadata
FROM game_history 
WHERE user_id = auth.uid()

ORDER BY created_at DESC;

-- Enable RLS on new tables
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies for withdrawals
CREATE POLICY "Users can view own withdrawals" ON withdrawals
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own withdrawals" ON withdrawals
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own withdrawals" ON withdrawals
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Create policies for payment methods
CREATE POLICY "Users can view own payment methods" ON payment_methods
  FOR SELECT TO authenticated USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can insert own payment methods" ON payment_methods
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payment methods" ON payment_methods
  FOR UPDATE TO authenticated USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can delete own payment methods" ON payment_methods
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Grant permissions on the view
GRANT SELECT ON user_transaction_history TO authenticated;

CREATE TABLE IF NOT EXISTS stripe_customers (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) not null unique,
  customer_id text not null unique,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  deleted_at timestamp with time zone default null
);

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own customer data"
    ON stripe_customers
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE TYPE stripe_subscription_status AS ENUM (
    'not_started',
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
);

CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id bigint primary key generated always as identity,
  customer_id text unique not null,
  subscription_id text default null,
  price_id text default null,
  current_period_start bigint default null,
  current_period_end bigint default null,
  cancel_at_period_end boolean default false,
  payment_method_brand text default null,
  payment_method_last4 text default null,
  status stripe_subscription_status not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  deleted_at timestamp with time zone default null
);

ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription data"
    ON stripe_subscriptions
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT customer_id
            FROM stripe_customers
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

CREATE TYPE stripe_order_status AS ENUM (
    'pending',
    'completed',
    'canceled'
);

CREATE TABLE IF NOT EXISTS stripe_orders (
    id bigint primary key generated always as identity,
    checkout_session_id text not null,
    payment_intent_id text not null,
    customer_id text not null,
    amount_subtotal bigint not null,
    amount_total bigint not null,
    currency text not null,
    payment_status text not null,
    status stripe_order_status not null default 'pending',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    deleted_at timestamp with time zone default null
);

ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order data"
    ON stripe_orders
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT customer_id
            FROM stripe_customers
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

-- View for user subscriptions
CREATE VIEW stripe_user_subscriptions WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    s.subscription_id,
    s.status as subscription_status,
    s.price_id,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.payment_method_brand,
    s.payment_method_last4
FROM stripe_customers c
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND s.deleted_at IS NULL;

GRANT SELECT ON stripe_user_subscriptions TO authenticated;

-- View for user orders
CREATE VIEW stripe_user_orders WITH (security_invoker) AS
SELECT
    c.customer_id,
    o.id as order_id,
    o.checkout_session_id,
    o.payment_intent_id,
    o.amount_subtotal,
    o.amount_total,
    o.currency,
    o.payment_status,
    o.status as order_status,
    o.created_at as order_date
FROM stripe_customers c
LEFT JOIN stripe_orders o ON c.customer_id = o.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND o.deleted_at IS NULL;