-- =====================================================
-- CONFIGURACIÓN COMPLETA PARA SISTEMA DE PAGOS STRIPE
-- =====================================================

-- 1. CREAR TABLAS PRINCIPALES
-- =====================================================

-- Tabla de wallets (saldo de usuarios)
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- Tabla de transacciones (recargas, retiros, juegos)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text CHECK (type IN ('deposit', 'withdrawal', 'game')),
  amount numeric,
  status text CHECK (status IN ('pending', 'completed', 'failed')),
  stripe_payment_id text,
  created_at timestamp DEFAULT now()
);

-- Tabla de solicitudes de retiro
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric,
  bank_clabe text,
  bank_name text,
  status text CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stripe_payout_id text,
  created_at timestamp DEFAULT now()
);

-- 2. AGREGAR CAMPOS A TABLA PROFILES
-- =====================================================

-- Agregar fecha de nacimiento y edad a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthdate date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age integer;

-- 3. ACTIVAR ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activar RLS en todas las tablas
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- 4. CREAR POLÍTICAS DE SEGURIDAD
-- =====================================================

-- Políticas para wallets
CREATE POLICY "Users can view their wallet" ON wallets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their wallet" ON wallets FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert their wallet" ON wallets FOR INSERT WITH CHECK (user_id = auth.uid());

-- Políticas para transactions
CREATE POLICY "Users can view their transactions" ON transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their transactions" ON transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their transactions" ON transactions FOR UPDATE USING (user_id = auth.uid());

-- Políticas para withdrawal_requests
CREATE POLICY "Users can view their withdrawals" ON withdrawal_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their withdrawals" ON withdrawal_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their withdrawals" ON withdrawal_requests FOR UPDATE USING (user_id = auth.uid());

-- 5. FUNCIÓN PARA CALCULAR EDAD
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_age(birthdate date)
RETURNS integer AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(birthdate));
END;
$$ LANGUAGE plpgsql;

-- 6. TRIGGER PARA ACTUALIZAR EDAD AUTOMÁTICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION update_age_from_birthdate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.birthdate IS NOT NULL THEN
    NEW.age = calculate_age(NEW.birthdate);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_update_age ON profiles;
CREATE TRIGGER trigger_update_age
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_age_from_birthdate();

-- 7. FUNCIÓN PARA INCREMENTAR SALDO DE WALLET
-- =====================================================

CREATE OR REPLACE FUNCTION increment_wallet_balance(p_user_id uuid, p_amount numeric)
RETURNS void AS $$
BEGIN
  -- Insertar o actualizar wallet
  INSERT INTO wallets (user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET balance = wallets.balance + EXCLUDED.balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FUNCIÓN PARA RETIRAR DE WALLET
-- =====================================================

CREATE OR REPLACE FUNCTION withdraw_from_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_bank_clabe text,
  p_bank_name text
)
RETURNS void AS $$
DECLARE
  current_balance numeric;
BEGIN
  -- Obtener saldo actual
  SELECT balance INTO current_balance 
  FROM wallets 
  WHERE user_id = p_user_id;
  
  -- Verificar saldo suficiente
  IF current_balance IS NULL OR current_balance < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;
  
  -- Descontar saldo
  UPDATE wallets 
  SET balance = balance - p_amount 
  WHERE user_id = p_user_id;
  
  -- Crear solicitud de retiro
  INSERT INTO withdrawal_requests (user_id, amount, bank_clabe, bank_name, status)
  VALUES (p_user_id, p_amount, p_bank_clabe, p_bank_name, 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. ÍNDICES PARA MEJOR RENDIMIENTO
-- =====================================================

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);

-- 10. MENSAJE DE CONFIRMACIÓN
-- =====================================================

-- Esta query no hace nada, solo confirma que todo se ejecutó
SELECT '✅ Configuración de Stripe y Supabase completada exitosamente' as status;
