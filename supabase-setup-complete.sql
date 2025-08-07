-- =====================================================
-- SCRIPT COMPLETO PARA CONFIGURAR SISTEMA DE PAGOS
-- Basado en el esquema actual del usuario
-- =====================================================

-- 1. CREAR TABLAS FALTANTES (si no existen)
-- =====================================================

-- Tabla wallets (si no existe)
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  balance numeric DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT wallets_pkey PRIMARY KEY (id),
  CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Tabla withdrawal_requests (si no existe)
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  amount numeric,
  bank_clabe text,
  bank_name text,
  status text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])),
  stripe_payout_id text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT withdrawal_requests_pkey PRIMARY KEY (id),
  CONSTRAINT withdrawal_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- 2. AGREGAR COLUMNAS FALTANTES A PROFILES
-- =====================================================

-- Agregar birthdate si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'birthdate') THEN
        ALTER TABLE public.profiles ADD COLUMN birthdate date;
    END IF;
END $$;

-- Agregar age si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'age') THEN
        ALTER TABLE public.profiles ADD COLUMN age integer;
    END IF;
END $$;

-- 3. HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- 4. CREAR POLÍTICAS RLS (con DROP IF EXISTS para evitar errores)
-- =====================================================

-- Políticas para wallets
DROP POLICY IF EXISTS "Users can view their wallet" ON public.wallets;
CREATE POLICY "Users can view their wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their wallet" ON public.wallets;
CREATE POLICY "Users can insert their wallet" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their wallet" ON public.wallets;
CREATE POLICY "Users can update their wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para transactions
DROP POLICY IF EXISTS "Users can view their transactions" ON public.transactions;
CREATE POLICY "Users can view their transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their transactions" ON public.transactions;
CREATE POLICY "Users can insert their transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their transactions" ON public.transactions;
CREATE POLICY "Users can update their transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para withdrawal_requests
DROP POLICY IF EXISTS "Users can view their withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users can view their withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users can insert their withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users can update their withdrawal requests" ON public.withdrawal_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. CREAR FUNCIONES NECESARIAS
-- =====================================================

-- Eliminar funciones y triggers existentes
DROP TRIGGER IF EXISTS update_age_trigger ON public.profiles;
DROP TRIGGER IF EXISTS trigger_update_age ON public.profiles;
DROP FUNCTION IF EXISTS public.update_age_from_birthdate();
DROP FUNCTION IF EXISTS public.calculate_age(date);

-- Función para calcular edad
CREATE OR REPLACE FUNCTION public.calculate_age(birthdate date)
RETURNS integer AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(birthdate));
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar edad automáticamente
CREATE OR REPLACE FUNCTION public.update_age_from_birthdate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.birthdate IS NOT NULL THEN
    NEW.age = public.calculate_age(NEW.birthdate);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
CREATE TRIGGER update_age_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_age_from_birthdate();

-- 6. FUNCIONES RPC PARA OPERACIONES DE PAGOS
-- =====================================================

-- Eliminar funciones existentes si las hay
DROP FUNCTION IF EXISTS public.increment_wallet_balance(uuid, numeric);
DROP FUNCTION IF EXISTS public.increment_wallet_balance(p_user_id uuid, p_amount numeric);
DROP FUNCTION IF EXISTS public.withdraw_from_wallet(uuid, numeric, text, text);
DROP FUNCTION IF EXISTS public.withdraw_from_wallet(p_user_id uuid, p_amount numeric, p_bank_clabe text, p_bank_name text);

-- Función para incrementar balance de wallet
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(
  user_uuid uuid,
  amount_to_add numeric
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance)
  VALUES (user_uuid, amount_to_add)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    balance = wallets.balance + amount_to_add,
    created_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para retirar de wallet y crear solicitud
CREATE OR REPLACE FUNCTION public.withdraw_from_wallet(
  user_uuid uuid,
  amount_to_withdraw numeric,
  bank_clabe_param text,
  bank_name_param text
)
RETURNS void AS $$
BEGIN
  -- Verificar que el usuario tiene suficiente balance
  IF (SELECT balance FROM public.wallets WHERE user_id = user_uuid) < amount_to_withdraw THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Reducir balance
  UPDATE public.wallets 
  SET balance = balance - amount_to_withdraw
  WHERE user_id = user_uuid;
  
  -- Crear solicitud de retiro
  INSERT INTO public.withdrawal_requests (
    user_id, 
    amount, 
    bank_clabe, 
    bank_name, 
    status
  ) VALUES (
    user_uuid, 
    amount_to_withdraw, 
    bank_clabe_param, 
    bank_name_param, 
    'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CREAR ÍNDICES PARA MEJOR RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON public.withdrawal_requests(created_at);

-- 8. MENSAJE DE CONFIRMACIÓN
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Configuración de base de datos completada exitosamente';
  RAISE NOTICE '📊 Tablas configuradas: wallets, transactions, withdrawal_requests';
  RAISE NOTICE '🔒 RLS habilitado en todas las tablas';
  RAISE NOTICE '⚡ Funciones RPC creadas para operaciones de pagos';
  RAISE NOTICE '🎯 Sistema listo para recibir pagos con Stripe';
END $$;
