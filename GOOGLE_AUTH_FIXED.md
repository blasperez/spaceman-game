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

### **Paso 4: Base de Datos**

Ve a: https://supabase.com/dashboard/project/lcpsoyorsaevkabvanrw/sql-editor

**Ejecutar este SQL:**
```sql
-- Create profiles table
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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, avatar_url, provider
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.raw_user_meta_data->>'avatar_url',
    'google'
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
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

### **"No session found"**
- Verificar que la tabla `profiles` existe
- Revisar que los triggers estén creados

## 🎯 Estado Actual

- ✅ Variables de entorno configuradas
- ✅ Supabase cliente configurado
- ✅ Componente de login actualizado
- ✅ Sistema de auth unificado
- ✅ Callback handler robusto
- ⚠️ Pendiente: Configuración en dashboards

## 📋 Checklist Final

- [ ] Configurar URLs en Supabase dashboard
- [ ] Habilitar Google provider en Supabase
- [ ] Agregar redirect URIs en Google Cloud
- [ ] Ejecutar SQL en Supabase SQL editor
- [ ] Hacer deploy a Railway
- [ ] Probar login en producción

Una vez completados estos pasos, la autenticación de Google debería funcionar perfectamente tanto en desarrollo como en producción.