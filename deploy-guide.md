# 🚀 Guía de Deploy Completo - Spaceman

## 📋 Resumen del Deploy

Tu juego Spaceman se desplegará en:
- **Frontend**: Vercel (React app)
- **Backend**: Railway (WebSocket server)
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth + OAuth

## 🔧 Paso 1: Configurar Supabase

### 1.1 Crear Proyecto
1. Ve a [Supabase](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que se complete la configuración

### 1.2 Configurar Base de Datos
1. Ve a **SQL Editor** en tu dashboard de Supabase
2. Copia y ejecuta el contenido de `supabase/migrations/20250629182719_red_shrine.sql`
3. Verifica que las tablas se crearon correctamente

### 1.3 Configurar OAuth
#### Google OAuth:
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto nuevo
3. Habilita Google+ API
4. Crea credenciales OAuth 2.0
5. En Supabase: **Authentication > Providers > Google**
   - Habilita Google
   - Agrega Client ID y Client Secret

#### Facebook OAuth:
1. Ve a [Facebook Developers](https://developers.facebook.com)
2. Crea una nueva app
3. Agrega Facebook Login
4. En Supabase: **Authentication > Providers > Facebook**
   - Habilita Facebook
   - Agrega App ID y App Secret

### 1.4 Obtener Credenciales
- Ve a **Settings > API**
- Copia `Project URL` y `anon public key`

## 🚂 Paso 2: Deploy Backend en Railway

### 2.1 Preparar Railway
1. Ve a [Railway](https://railway.app) y crea una cuenta
2. Conecta tu cuenta de GitHub
3. Crea un nuevo proyecto

### 2.2 Deploy del Servidor
1. Conecta tu repositorio de GitHub
2. Railway detectará automáticamente el `railway.json`
3. El servidor se desplegará automáticamente
4. Copia la URL del deploy (ej: `https://spaceman-server-production.up.railway.app`)

### 2.3 Configurar Variables de Entorno en Railway
```bash
NODE_ENV=production
PORT=8080
```

## ⚡ Paso 3: Deploy Frontend en Vercel

### 3.1 Preparar Vercel
1. Ve a [Vercel](https://vercel.com) y crea una cuenta
2. Conecta tu cuenta de GitHub
3. Importa tu repositorio

### 3.2 Configurar Variables de Entorno en Vercel
```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-supabase-anon-key
VITE_WEBSOCKET_URL=wss://tu-railway-app.up.railway.app
```

### 3.3 Deploy
1. Vercel detectará automáticamente el `vercel.json`
2. El build se ejecutará automáticamente
3. Tu app estará disponible en una URL como `https://spaceman-crash.vercel.app`

## 🔐 Paso 4: Configurar OAuth URLs

### 4.1 Actualizar Redirect URLs en Supabase
1. Ve a **Authentication > URL Configuration**
2. Agrega tu URL de Vercel:
   ```
   Site URL: https://tu-spaceman-game.vercel.app
   Redirect URLs: https://tu-spaceman-game.vercel.app/auth/callback
   ```

### 4.2 Actualizar OAuth Providers
#### Google:
- Authorized JavaScript origins: `https://tu-spaceman-game.vercel.app`
- Authorized redirect URIs: `https://tu-proyecto.supabase.co/auth/v1/callback`

#### Facebook:
- Valid OAuth Redirect URIs: `https://tu-proyecto.supabase.co/auth/v1/callback`

## 🧪 Paso 5: Testing

### 5.1 Verificar Conexiones
1. **Frontend**: Abre tu URL de Vercel
2. **WebSocket**: Verifica que aparezca "Conectado"
3. **Auth**: Prueba login con Google/Facebook
4. **Game**: Coloca una apuesta y verifica que funcione

### 5.2 Monitoreo
- **Railway**: Ve a tu dashboard para logs del servidor
- **Vercel**: Ve a tu dashboard para logs del frontend
- **Supabase**: Ve a logs de autenticación y base de datos

## 🔧 Paso 6: Configuración Adicional (Opcional)

### 6.1 Dominio Personalizado
#### Vercel:
1. Ve a tu proyecto > Settings > Domains
2. Agrega tu dominio personalizado
3. Configura DNS según las instrucciones

#### Railway:
1. Ve a tu proyecto > Settings > Domains
2. Agrega tu subdominio para el WebSocket

### 6.2 Stripe para Pagos
1. Crea cuenta en [Stripe](https://stripe.com)
2. Obtén tus API keys
3. Agrega a variables de entorno:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_tu-stripe-key
   ```

## 📊 Paso 7: Monitoreo y Analytics

### 7.1 Logs y Debugging
- **Railway**: Logs en tiempo real del servidor WebSocket
- **Vercel**: Logs de build y runtime
- **Supabase**: Logs de autenticación y queries

### 7.2 Performance Monitoring
- Configura alertas en Railway para uptime del servidor
- Monitorea métricas de Vercel para performance del frontend
- Revisa métricas de Supabase para uso de base de datos

## 🚨 Troubleshooting

### Problemas Comunes:

#### WebSocket no conecta:
- Verifica que `VITE_WEBSOCKET_URL` esté correcta
- Asegúrate que Railway esté ejecutándose
- Revisa logs de Railway para errores

#### OAuth no funciona:
- Verifica redirect URLs en providers
- Confirma que las credenciales estén correctas en Supabase
- Revisa que los dominios estén autorizados

#### Build falla en Vercel:
- Verifica que todas las variables de entorno estén configuradas
- Revisa logs de build para errores específicos
- Confirma que las dependencias estén correctas

## ✅ Checklist Final

- [ ] Supabase configurado con tablas y OAuth
- [ ] Railway desplegado y funcionando
- [ ] Vercel desplegado con variables de entorno
- [ ] WebSocket conectando correctamente
- [ ] OAuth funcionando con Google/Facebook
- [ ] Juego multijugador operativo
- [ ] Dominios personalizados configurados (opcional)
- [ ] Stripe configurado para pagos (opcional)

## 🎉 ¡Listo!

Tu juego Spaceman está ahora completamente desplegado en producción con:
- ✅ Multijugador en tiempo real
- ✅ Autenticación OAuth
- ✅ Base de datos persistente
- ✅ Escalabilidad automática
- ✅ Monitoreo y logs

**URLs de tu aplicación:**
- Frontend: `https://tu-spaceman-game.vercel.app`
- Backend: `https://tu-railway-app.up.railway.app`
- Database: `https://tu-proyecto.supabase.co`

¡Disfruta tu juego en producción! 🚀🎮
