# ✅ Google Authentication - SOLUCIONADO

## 🔧 Cambios Aplicados

### 1. **Eliminado Sistema Duplicado**
- ❌ Eliminado Passport.js del servidor (conflictaba con Supabase)
- ❌ Eliminado `server/auth.js` y `server/authRoutes.js`
- ✅ Mantenido solo **Supabase Auth** en el frontend

### 2. **Servidor Limpiado** 
- Removido middleware de autenticación obsoleto
- Simplificado `server/gameServer.cjs`
- Eliminadas rutas de auth conflictivas

### 3. **Frontend Optimizado**
- Componente `AuthCallback.tsx` mejorado
- Manejo robusto de errores de OAuth
- Auto-creación de perfiles de usuario

## 🚀 Configuración Requerida

### **Paso 1: Supabase Dashboard**

Ve a: https://supabase.com/dashboard/project/lcpsoyorsaevkabvanrw/auth/url-configuration

**URL Configuration:**
```
Site URL: https://spaceman-game-production.up.railway.app

Redirect URLs (agregar ambas):
- https://spaceman-game-production.up.railway.app/auth/callback
- http://localhost:8081/auth/callback
```

### **Paso 2: Google OAuth Provider**

Ve a: https://supabase.com/dashboard/project/lcpsoyorsaevkabvanrw/auth/providers

**Habilitar Google Provider:**
```
Client ID: 946065921846-gr94a4clm5crfri3js950v5hgtargd4h.apps.googleusercontent.com
Client Secret: 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
```

### **Paso 3: Google Cloud Console**

Ve a: https://console.cloud.google.com/apis/credentials/oauthclient/946065921846-gr94a4clm5crfri3js950v5hgtargd4h.apps.googleusercontent.com?project=spaceman-464912

**Agregar Redirect URIs:**
```
- https://lcpsoyorsaevkabvanrw.supabase.co/auth/v1/callback
- https://spaceman-game-production.up.railway.app/auth/callback
```

### **Paso 4: Base de Datos - SQL CORREGIDO** ⚠️

Ve a: https://supabase.com/dashboard/project/lcpsoyorsaevkabvanrw/sql-editor

**Ejecutar este SQL (MANEJA POLÍTICAS EXISTENTES):**
```sql
-- SIMPLE FIX for Supabase Policies Error
-- Este SQL maneja el error "policy already exists"

-- Step 1: Clean up existing policies (won't error if they don't exist)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;  
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Step 2: Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  provider TEXT DEFAULT 'google',
  balance DECIMAL(10,2) DEFAULT 1000.00,
  age INTEGER,
  country TEXT,
  phone TEXT,
  kyc_verified BOOLEAN DEFAULT FALSE,
  withdrawal_methods JSONB DEFAULT '[]'::jsonb,
  deposit_limit DECIMAL(10,2) DEFAULT 1000.00,
  withdrawal_limit DECIMAL(10,2) DEFAULT 1000.00,
  total_deposits DECIMAL(10,2) DEFAULT 0,
  total_withdrawals DECIMAL(10,2) DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  total_wagered DECIMAL(10,2) DEFAULT 0,
  total_won DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create fresh policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 5: Create auto-profile function
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

-- Step 6: Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Create additional tables for game functionality
CREATE TABLE IF NOT EXISTS public.game_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  bet_amount DECIMAL(10,2) NOT NULL,
  multiplier DECIMAL(10,4) NOT NULL,
  win_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own game history" ON public.game_history;
DROP POLICY IF EXISTS "Users can insert own game history" ON public.game_history;

CREATE POLICY "Users can view own game history" ON public.game_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game history" ON public.game_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 8: Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('deposit', 'withdrawal')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  payment_method TEXT NOT NULL,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 9: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON public.game_history(user_id);
CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON public.game_history(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- Success message
SELECT 'Profiles setup completed successfully! 🎉' as status;
```

## 🧪 Testing

### **Verificar Configuración:**
```bash
npm install
node test-supabase-auth.cjs
```

### **Probar en Desarrollo:**
```bash
npm run dev
```

### **Probar en Producción:**
```bash
npm run build
npm start
```

## 🔍 Flujo de Autenticación

1. **Usuario hace clic en "Continuar con Google"**
2. **Supabase redirige a Google OAuth**
3. **Google autentica y redirige a `/auth/callback`**
4. **`AuthCallback.tsx` procesa la respuesta**
5. **Se crea/actualiza perfil automáticamente**
6. **Usuario redirigido a la app principal**

## ⚠️ Errores Comunes

### **"redirect_uri_mismatch"**
- Verificar que las URLs coincidan EXACTAMENTE
- Incluir tanto development como production URLs

### **"invalid_client"**
- Verificar Google Client ID/Secret en Supabase
- Confirmar que el proyecto de Google Cloud está activo

### **"policy already exists"** ✅ SOLUCIONADO
- El nuevo SQL usa `DROP POLICY IF EXISTS` para limpiar primero
- Ejecuta el SQL corregido en el Paso 4

### **"No session found"**
- Verificar que la tabla `profiles` existe
- Revisar que los triggers estén creados

## 🎯 Estado Actual

- ✅ Variables de entorno configuradas
- ✅ Supabase cliente configurado
- ✅ Componente de login actualizado
- ✅ Sistema de auth unificado
- ✅ Callback handler robusto
- ✅ SQL corregido para políticas existentes
- ⚠️ Pendiente: Configuración en dashboards

## 📋 Checklist Final

- [x] Código corregido y limpiado
- [x] SQL corregido para políticas existentes
- [ ] Configurar URLs en Supabase dashboard
- [ ] Habilitar Google provider en Supabase
- [ ] Agregar redirect URIs en Google Cloud
- [ ] Ejecutar SQL CORREGIDO en Supabase SQL editor
- [ ] Hacer deploy a Railway (ya hecho)
- [ ] Probar login en producción

## 🔧 Notas Importantes

- **El SQL ahora maneja políticas existentes** sin errores
- **Usa `DROP POLICY IF EXISTS`** para limpiar antes de crear
- **Incluye todas las tablas necesarias** (profiles, game_history, transactions)
- **Auto-crea perfiles** cuando usuarios se registran con Google

Una vez completados estos pasos, la autenticación de Google debería funcionar perfectamente tanto en desarrollo como en producción.