# Instrucciones para Aplicar la Migración Completa del Sistema de Pagos

## 📋 Resumen

Esta migración agrega todas las funcionalidades necesarias para el sistema completo de pagos, incluyendo:
- Historial detallado de partidas jugadas
- Sistema de retiros con múltiples métodos de pago
- Métodos de pago guardados
- Transacciones detalladas con metadatos
- Estadísticas en tiempo real
- Seguridad RLS completa

## 🚀 Método 1: Usando el Script Automático (Recomendado)

### Paso 1: Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

**Para obtener estas credenciales:**
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Settings** > **API**
3. Copia la **Project URL** y **service_role key**

### Paso 2: Instalar Dependencias

```bash
npm install @supabase/supabase-js
```

### Paso 3: Ejecutar el Script

```bash
node apply-complete-migration.js
```

El script te guiará a través del proceso y verificará que todo se haya aplicado correctamente.

## 🔧 Método 2: Aplicar Manualmente en Supabase Dashboard

### Paso 1: Ir al SQL Editor

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor**
3. Crea una nueva consulta

### Paso 2: Copiar y Pegar la Migración

Copia todo el contenido del archivo `supabase/migrations/20250715000000_complete_payment_system.sql` y pégalo en el editor SQL.

### Paso 3: Ejecutar la Migración

Haz clic en **Run** para ejecutar la migración.

## 📊 Verificación de la Migración

### Verificar Tablas Creadas

Ejecuta estas consultas para verificar que las tablas se crearon correctamente:

```sql
-- Verificar tablas principales
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'game_history', 
  'transactions', 
  'payment_methods', 
  'withdrawals'
);

-- Verificar vistas
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_transaction_history',
  'stripe_user_subscriptions',
  'stripe_user_orders'
);
```

### Verificar Políticas RLS

```sql
-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('game_history', 'transactions', 'payment_methods', 'withdrawals');
```

### Verificar Triggers

```sql
-- Verificar triggers
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('game_history', 'transactions');
```

## 🔍 Estructura de Datos Agregada

### Nuevas Tablas

1. **`withdrawals`** - Solicitudes de retiro
   - `id` (uuid, primary key)
   - `user_id` (uuid, references auth.users)
   - `amount` (numeric, not null)
   - `status` (text: pending, approved, rejected, completed, failed)
   - `payment_method` (text, not null)
   - `account_details` (jsonb, not null)
   - `fee_amount` (numeric, default 0)
   - `net_amount` (numeric)
   - `currency` (text, default 'usd')
   - `stripe_payout_id` (text)
   - `approved_by` (uuid, references auth.users)
   - `approved_at` (timestamptz)
   - `rejection_reason` (text)
   - `created_at`, `updated_at` (timestamptz)

### Campos Agregados a Tablas Existentes

1. **`transactions`** - Campos adicionales:
   - `stripe_payment_id` (text)
   - `stripe_payment_method_id` (text)
   - `description` (text)
   - `fee_amount` (numeric, default 0)
   - `net_amount` (numeric)
   - `currency` (text, default 'usd')
   - `metadata` (jsonb)

2. **`game_history`** - Campos adicionales:
   - `game_type` (text, default 'spaceman')
   - `status` (text, default 'completed')
   - `session_id` (text)
   - `metadata` (jsonb)

3. **`payment_methods`** - Campos adicionales:
   - `brand` (text)
   - `last4` (text)
   - `expiry_month` (integer)
   - `expiry_year` (integer)
   - `is_active` (boolean, default true)
   - `updated_at` (timestamptz)
   - `deleted_at` (timestamptz)

### Vistas Creadas

1. **`user_transaction_history`** - Vista unificada que combina:
   - Depósitos
   - Retiros
   - Ganancias del juego
   - Pérdidas del juego

2. **`stripe_user_subscriptions`** - Datos de suscripciones del usuario
3. **`stripe_user_orders`** - Historial de órdenes del usuario

## 🔒 Seguridad Implementada

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas que aseguran que:
- Los usuarios solo pueden ver sus propios datos
- Los usuarios solo pueden insertar datos para sí mismos
- Los usuarios pueden actualizar solo sus propios datos

### Políticas RLS Creadas

```sql
-- game_history
- "Users can view own game history"
- "Users can insert own game history"

-- transactions
- "Users can view own transactions"
- "Users can insert own transactions"

-- payment_methods
- "Users can view own payment methods"
- "Users can insert own payment methods"
- "Users can update own payment methods"
- "Users can delete own payment methods"

-- withdrawals
- "Users can view own withdrawals"
- "Users can insert own withdrawals"
- "Users can update own withdrawals"
```

## ⚡ Triggers Automáticos

### Trigger para Actualizar Balance Después del Juego

```sql
-- Función: update_user_balance_after_game()
-- Trigger: trigger_update_balance_after_game
-- Se ejecuta: AFTER INSERT ON game_history
-- Acción: Actualiza balance, games_played, total_wagered, total_won
```

### Trigger para Actualizar Balance Después de Transacciones

```sql
-- Función: update_user_balance_after_transaction()
-- Trigger: trigger_update_balance_after_transaction
-- Se ejecuta: AFTER INSERT OR UPDATE ON transactions
-- Acción: Actualiza balance según tipo de transacción
```

## 📈 Índices para Rendimiento

Se crearon los siguientes índices para optimizar las consultas:

```sql
- idx_game_history_user_id ON game_history(user_id)
- idx_game_history_created_at ON game_history(created_at)
- idx_transactions_user_id ON transactions(user_id)
- idx_transactions_created_at ON transactions(created_at)
- idx_payment_methods_user_id ON payment_methods(user_id)
- idx_withdrawals_user_id ON withdrawals(user_id)
- idx_withdrawals_status ON withdrawals(status)
```

## 🎯 Tipos Personalizados

### Enums Creados

1. **`stripe_subscription_status`**:
   - not_started, incomplete, incomplete_expired
   - trialing, active, past_due, canceled, unpaid, paused

2. **`stripe_order_status`**:
   - pending, completed, canceled

## 🚨 Solución de Problemas

### Error: "relation already exists"

Si ves este error, significa que algunas tablas ya existen. La migración usa `IF NOT EXISTS` para evitar conflictos, pero si hay problemas:

```sql
-- Verificar qué tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Error: "permission denied"

Asegúrate de usar la **service_role key** y no la **anon key**:

```bash
# ✅ Correcto
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ❌ Incorrecto
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Error: "function does not exist"

Si el script no puede ejecutar `exec_sql`, puedes ejecutar la migración directamente en el SQL Editor de Supabase Dashboard.

## ✅ Verificación Final

Después de aplicar la migración, verifica que todo funcione:

1. **Crear un usuario de prueba**
2. **Insertar una partida de juego**
3. **Verificar que el balance se actualice automáticamente**
4. **Crear una transacción de depósito**
5. **Verificar que aparezca en el historial**

### Consultas de Verificación

```sql
-- Verificar que el trigger funciona
INSERT INTO game_history (user_id, game_id, bet_amount, multiplier, win_amount)
VALUES ('tu-user-id', 'test-game-1', 10.00, 2.5, 25.00);

-- Verificar balance actualizado
SELECT balance, games_played, total_wagered, total_won 
FROM profiles 
WHERE id = 'tu-user-id';

-- Verificar historial unificado
SELECT * FROM user_transaction_history 
WHERE user_id = 'tu-user-id' 
ORDER BY created_at DESC;
```

## 🎉 ¡Listo!

Una vez completada la migración, tu sistema tendrá:

✅ **Historial completo de partidas jugadas**  
✅ **Sistema de retiros con múltiples métodos**  
✅ **Métodos de pago guardados**  
✅ **Transacciones detalladas con metadatos**  
✅ **Estadísticas en tiempo real**  
✅ **Seguridad RLS completa**  
✅ **Triggers automáticos para balance**  
✅ **Vistas unificadas para el frontend**  

¡Tu sistema de pagos está listo para funcionar con todas las funcionalidades implementadas!