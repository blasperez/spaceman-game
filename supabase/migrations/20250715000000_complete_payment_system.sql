-- Complete Payment System Migration
-- This migration adds all necessary tables and fields for the complete payment system

-- 1. Add missing columns to existing tables
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS stripe_payment_id text,
ADD COLUMN IF NOT EXISTS stripe_payment_method_id text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS fee_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount numeric,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'usd',
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- 2. Add missing columns to game_history
ALTER TABLE public.game_history 
ADD COLUMN IF NOT EXISTS game_type text DEFAULT 'spaceman',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS session_id text,
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- 3. Add missing columns to payment_methods
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS last4 text,
ADD COLUMN IF NOT EXISTS expiry_month integer,
ADD COLUMN IF NOT EXISTS expiry_year integer,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT null;

-- 4. Create withdrawals table (replaces withdrawal_requests with enhanced structure)
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
  payment_method text NOT NULL,
  account_details jsonb NOT NULL, -- Bank account, PayPal, crypto details
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

-- 5. Create user transaction history view
CREATE OR REPLACE VIEW public.user_transaction_history AS
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

-- 6. Create custom types for Stripe
DO $$ BEGIN
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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stripe_order_status AS ENUM (
        'pending',
        'completed',
        'canceled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 7. Update stripe_subscriptions table to use the enum
ALTER TABLE public.stripe_subscriptions 
ALTER COLUMN status TYPE stripe_subscription_status USING status::stripe_subscription_status;

-- 8. Update stripe_orders table to use the enum
ALTER TABLE public.stripe_orders 
ALTER COLUMN status TYPE stripe_order_status USING status::stripe_order_status;

-- 9. Create views for user data
CREATE OR REPLACE VIEW public.stripe_user_subscriptions AS
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

CREATE OR REPLACE VIEW public.stripe_user_orders AS
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

-- 10. Enable RLS on all tables
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_orders ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies for game_history
DROP POLICY IF EXISTS "Users can view own game history" ON public.game_history;
DROP POLICY IF EXISTS "Users can insert own game history" ON public.game_history;

CREATE POLICY "Users can view own game history" ON public.game_history
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own game history" ON public.game_history
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 12. Create RLS policies for transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 13. Create RLS policies for payment_methods
DROP POLICY IF EXISTS "Users can view own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can insert own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can update own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can delete own payment methods" ON public.payment_methods;

CREATE POLICY "Users can view own payment methods" ON public.payment_methods
  FOR SELECT TO authenticated USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can insert own payment methods" ON public.payment_methods
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payment methods" ON public.payment_methods
  FOR UPDATE TO authenticated USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can delete own payment methods" ON public.payment_methods
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 14. Create RLS policies for withdrawals
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can insert own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can update own withdrawals" ON public.withdrawals;

CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own withdrawals" ON public.withdrawals
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own withdrawals" ON public.withdrawals
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 15. Create RLS policies for stripe_customers
DROP POLICY IF EXISTS "Users can view own stripe customer data" ON public.stripe_customers;

CREATE POLICY "Users can view own stripe customer data" ON public.stripe_customers
  FOR SELECT TO authenticated USING (user_id = auth.uid() AND deleted_at IS NULL);

-- 16. Create RLS policies for stripe_subscriptions
DROP POLICY IF EXISTS "Users can view own subscription data" ON public.stripe_subscriptions;

CREATE POLICY "Users can view own subscription data" ON public.stripe_subscriptions
  FOR SELECT TO authenticated USING (
    customer_id IN (
      SELECT customer_id
      FROM stripe_customers
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- 17. Create RLS policies for stripe_orders
DROP POLICY IF EXISTS "Users can view own order data" ON public.stripe_orders;

CREATE POLICY "Users can view own order data" ON public.stripe_orders
  FOR SELECT TO authenticated USING (
    customer_id IN (
      SELECT customer_id
      FROM stripe_customers
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- 18. Grant permissions on views
GRANT SELECT ON public.user_transaction_history TO authenticated;
GRANT SELECT ON public.stripe_user_subscriptions TO authenticated;
GRANT SELECT ON public.stripe_user_orders TO authenticated;

-- 19. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON public.game_history(user_id);
CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON public.game_history(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);

-- 20. Create function to update user balance after game
CREATE OR REPLACE FUNCTION public.update_user_balance_after_game()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user balance
  UPDATE public.profiles 
  SET 
    balance = balance + (NEW.win_amount - NEW.bet_amount),
    games_played = games_played + 1,
    total_wagered = total_wagered + NEW.bet_amount,
    total_won = total_won + NEW.win_amount,
    updated_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 21. Create trigger for game_history
DROP TRIGGER IF EXISTS trigger_update_balance_after_game ON public.game_history;
CREATE TRIGGER trigger_update_balance_after_game
  AFTER INSERT ON public.game_history
  FOR EACH ROW EXECUTE FUNCTION public.update_user_balance_after_game();

-- 22. Create function to update user balance after transaction
CREATE OR REPLACE FUNCTION public.update_user_balance_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    IF NEW.type = 'deposit' THEN
      UPDATE public.profiles 
      SET 
        balance = balance + NEW.amount,
        total_deposits = total_deposits + NEW.amount,
        updated_at = now()
      WHERE id = NEW.user_id;
    ELSIF NEW.type = 'withdrawal' THEN
      UPDATE public.profiles 
      SET 
        balance = balance - NEW.amount,
        total_withdrawals = total_withdrawals + NEW.amount,
        updated_at = now()
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 23. Create trigger for transactions
DROP TRIGGER IF EXISTS trigger_update_balance_after_transaction ON public.transactions;
CREATE TRIGGER trigger_update_balance_after_transaction
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_user_balance_after_transaction();

-- 24. Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    provider,
    balance
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.raw_user_meta_data->>'avatar_url',
    'google',
    1000.00
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 25. Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 26. Add comments for documentation
COMMENT ON TABLE public.game_history IS 'Historial completo de partidas jugadas por cada usuario';
COMMENT ON TABLE public.transactions IS 'Transacciones de depósitos y retiros con información detallada';
COMMENT ON TABLE public.withdrawals IS 'Solicitudes de retiro con proceso de aprobación';
COMMENT ON TABLE public.payment_methods IS 'Métodos de pago guardados por el usuario';
COMMENT ON VIEW public.user_transaction_history IS 'Vista unificada del historial de transacciones del usuario';