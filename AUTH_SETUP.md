# Guía de Configuración de Autenticación con Google

## Configuración Requerida

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```bash
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=946065921846-gr94a4clm5crfri3js950v5hgtargd4h.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=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

# Supabase Configuration
VITE_SUPABASE_URL=https://lcpsoyorsaevkabvanrw.supabase.co
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui

# App Configuration
VITE_APP_URL=http://localhost:8081
```

### 2. Configuración en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto: `spaceman-464912`
3. Ve a "APIs & Services" > "Credentials"
4. Verifica que las siguientes URLs estén configuradas:

**Authorized redirect URIs:**
- `https://spaceman-game-production.up.railway.app/auth/google/callback`
- `https://lcpsoyorsaevkabvanrw.supabase.co/auth/v1/callback`
- `http://localhost:8081/auth/google/callback`

**Authorized JavaScript origins:**
- `https://spaceman-game-production.up.railway.app`
- `http://localhost:8081`

### 3. Configuración en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a "Authentication" > "Providers"
3. Habilita Google como proveedor
4. Configura:
   - Client ID: `946065921846-gr94a4clm5crfri3js950v5hgtargd4h.apps.googleusercontent.com`
   - Client Secret: `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`
   - Enable OAuth: ✅

### 4. URLs de Redirección en Supabase

En Supabase Dashboard:
1. Ve a "Authentication" > "URL Configuration"
2. Agrega estas URLs:
   - `http://localhost:8081/auth/callback`
   - `http://localhost:8081/`

## Solución de Problemas

### Problemas Comunes y Soluciones

#### 1. Error "redirect_uri_mismatch"
**Causa:** La URL de callback no coincide con la configurada en Google Cloud
**Solución:** Verifica que las URLs en Google Cloud Console coincidan exactamente

#### 2. Error "invalid_client"
**Causa:** Client ID o Client Secret incorrectos
**Solución:** Verifica las credenciales en `.env.local`

#### 3. No redirige después del login
**Causa:** Problemas con el callback handler
**Solución:** Revisa la consola del navegador para errores

### Herramientas de Debug

#### Panel de Debug de Autenticación
Hemos agregado un componente `AuthDebug` que puedes usar para diagnosticar problemas:

```tsx
import { AuthDebug } from './components/AuthDebug';

// En tu componente principal
const [showDebug, setShowDebug] = useState(false);

return (
  <>
    <button onClick={() => setShowDebug(true)}>Debug Auth</button>
    {showDebug && <AuthDebug onClose={() => setShowDebug(false)} />}
  </>
);
```

#### Verificación Manual
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network"
3. Intenta iniciar sesión con Google
4. Observa las peticiones a:
   - `https://accounts.google.com/o/oauth2/auth`
   - `https://lcpsoyorsaevkabvanrw.supabase.co/auth/v1/authorize`
   - `http://localhost:8081/auth/callback`

### Flujo de Autenticación

1. Usuario hace clic en "Iniciar con Google"
2. Redirige a Google OAuth
3. Google redirige a `/auth/callback` con código
4. Supabase procesa el código
5. Redirige a la página principal

### Comandos para Probar

```bash
# Iniciar el servidor en modo desarrollo
npm run dev

# Verificar que el puerto 8081 esté disponible
lsof -i :8081

# Verificar variables de entorno
cat .env.local
```

### Soporte

Si continúas teniendo problemas:
1. Revisa la consola del navegador para errores
2. Verifica que todas las URLs coincidan exactamente
3. Asegúrate de que el proyecto de Google Cloud esté activo
4. Confirma que las credenciales de Supabase sean correctas
