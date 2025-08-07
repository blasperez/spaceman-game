-- ========================================
-- MIGRACIÓN COMPLETA DEL SISTEMA DE PAGOS
-- ========================================
-- Ejecutar este script completo en Supabase SQL Editor

-- 1. MEJORAR TABLAS EXISTENTES
-- ========================================

-- Mejorar tabla transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS stripe_payment_id text,
ADD COLUMN IF NOT EXISTS stripe_payment_method_id text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS fee_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount numeric,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'usd',
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Mejorar tabla game_history
ALTER TABLE public.game_history 
ADD COLUMN IF NOT EXISTS game_type text DEFAULT 'spaceman',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS session_id text,
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Mejorar tabla payment_methods
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS last4 text,
ADD COLUMN IF NOT EXISTS expiry_month integer,
ADD COLUMN IF NOT EXISTS expiry_year integer,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT null;

-- 2. CREAR NUEVA TABLA DE RETIROS
-- ========================================

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
  payment_method text NOT NULL,
  account_details jsonb NOT NULL,
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

-- 3. CREAR VISTA UNIFICADA
-- ========================================

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
WHERE type = 'deposit'

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
WHERE type = 'withdrawal'

UNION ALL

SELECT 
  gh.id,
  gh.user_id,
  'game_win' as transaction_type,
  gh.win_amount as amount,
  'completed' as status,
  'game' as payment_method,
  gh.created_at,
  'Game win - ' || COALESCE(gh.game_type, 'spaceman') as description,
  0 as fee_amount,
  gh.win_amount as net_amount,
  'usd' as currency,
  jsonb_build_object(
    'game_id', gh.game_id, 
    'bet_amount', gh.bet_amount, 
    'multiplier', gh.multiplier, 
    'game_type', COALESCE(gh.game_type, 'spaceman')
  ) as metadata
FROM game_history gh
WHERE gh.win_amount > gh.bet_amount

UNION ALL

SELECT 
  gh.id,
  gh.user_id,
  'game_loss' as transaction_type,
  gh.bet_amount as amount,
  'completed' as status,
  'game' as payment_method,
  gh.created_at,
  'Game bet - ' || COALESCE(gh.game_type, 'spaceman') as description,
  0 as fee_amount,
  -gh.bet_amount as net_amount,
  'usd' as currency,
  jsonb_build_object(
    'game_id', gh.game_id, 
    'win_amount', gh.win_amount, 
    'multiplier', gh.multiplier, 
    'game_type', COALESCE(gh.game_type, 'spaceman')
  ) as metadata
FROM game_history gh;

-- 4. HABILITAR RLS
-- ========================================

ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_orders ENABLE ROW LEVEL SECURITY;

-- 5. CREAR POLÍTICAS RLS
-- ========================================

-- Políticas para game_history
DROP POLICY IF EXISTS "Users can view own game history" ON public.game_history;
CREATE POLICY "Users can view own game history" ON public.game_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own game history" ON public.game_history;
CREATE POLICY "Users can insert own game history" ON public.game_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Políticas para transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Políticas para payment_methods
DROP POLICY IF EXISTS "Users can view own payment methods" ON public.payment_methods;
CREATE POLICY "Users can view own payment methods" ON public.payment_methods
  FOR SELECT TO authenticated USING (auth.uid() = user_id AND (deleted_at IS NULL OR deleted_at IS NULL));

DROP POLICY IF EXISTS "Users can insert own payment methods" ON public.payment_methods;
CREATE POLICY "Users can insert own payment methods" ON public.payment_methods
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payment methods" ON public.payment_methods;
CREATE POLICY "Users can update own payment methods" ON public.payment_methods
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own payment methods" ON public.payment_methods;
CREATE POLICY "Users can delete own payment methods" ON public.payment_methods
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas para withdrawals
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can insert own withdrawals" ON public.withdrawals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can update own withdrawals" ON public.withdrawals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 6. CREAR ÍNDICES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON public.game_history(user_id);
CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON public.game_history(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);

-- 7. CREAR TRIGGERS AUTOMÁTICOS
-- ========================================

-- Función para actualizar balance después de cada juego
CREATE OR REPLACE FUNCTION public.update_user_balance_after_game()
RETURNS TRIGGER AS $$
BEGIN
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

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_update_balance_after_game ON public.game_history;
CREATE TRIGGER trigger_update_balance_after_game
  AFTER INSERT ON public.game_history
  FOR EACH ROW EXECUTE FUNCTION public.update_user_balance_after_game();

-- Función para actualizar balance después de transacciones
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

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_update_balance_after_transaction ON public.transactions;
CREATE TRIGGER trigger_update_balance_after_transaction
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_user_balance_after_transaction();

-- 8. PERMISOS
-- ========================================

GRANT SELECT ON public.user_transaction_history TO authenticated;

-- 9. VERIFICACIÓN FINAL
-- ========================================

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '✅ Migración completada exitosamente!';
  RAISE NOTICE '📊 Tablas actualizadas: transactions, game_history, payment_methods';
  RAISE NOTICE '🆕 Nueva tabla creada: withdrawals';
  RAISE NOTICE '👁️ Vista creada: user_transaction_history';
  RAISE NOTICE '🔒 RLS habilitado y políticas creadas';
  RAISE NOTICE '⚡ Triggers automáticos configurados';
  RAISE NOTICE '🚀 Sistema listo para usar!';
END $$;
