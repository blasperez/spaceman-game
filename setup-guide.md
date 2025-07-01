# 🚀 Guía de Configuración - Spaceman

## 📋 Pasos para configurar OAuth y Base de Datos

### 1. 🗄️ Configurar Supabase

#### 1.1 Crear Proyecto
1. Ve a [Supabase](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que se complete la configuración (2-3 minutos)

#### 1.2 Configurar Base de Datos
1. Ve a **SQL Editor** en tu dashboard de Supabase
2. Copia y ejecuta el contenido del archivo `supabase/migrations/20250629182719_red_shrine.sql`
3. Verifica que las tablas se crearon correctamente en **Table Editor**

#### 1.3 Obtener Credenciales
1. Ve a **Settings > API**
2. Copia:
   - `Project URL` 
   - `anon public key`

### 2. 🔐 Configurar OAuth

#### 2.1 Google OAuth
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto nuevo o selecciona uno existente
3. Ve a **APIs & Services > Credentials**
4. Clic en **Create Credentials > OAuth 2.0 Client IDs**
5. Configura:
   - Application type: **Web application**
   - Authorized JavaScript origins: 
     - `http://localhost:5173` (desarrollo)
     - `https://tu-dominio.vercel.app` (producción)
   - Authorized redirect URIs:
     - `https://tu-proyecto.supabase.co/auth/v1/callback`

6. En Supabase Dashboard:
   - Ve a **Authentication > Providers**
   - Habilita **Google**
   - Agrega tu **Client ID** y **Client Secret**

#### 2.2 Facebook OAuth
1. Ve a [Facebook Developers](https://developers.facebook.com)
2. Crea una nueva app
3. Agrega **Facebook Login** product
4. En **Facebook Login > Settings**:
   - Valid OAuth Redirect URIs: `https://tu-proyecto.supabase.co/auth/v1/callback`

5. En Supabase Dashboard:
   - Ve a **Authentication > Providers**
   - Habilita **Facebook**
   - Agrega tu **App ID** y **App Secret**

#### 2.3 Twitter OAuth
1. Ve a [Twitter Developer Portal](https://developer.twitter.com)
2. Crea una nueva app
3. En **App settings > Authentication settings**:
   - Enable 3-legged OAuth
   - Callback URLs: `https://tu-proyecto.supabase.co/auth/v1/callback`

4. En Supabase Dashboard:
   - Ve a **Authentication > Providers**
   - Habilita **Twitter**
   - Agrega tu **API Key** y **API Secret**

### 3. ⚙️ Configurar Variables de Entorno

#### 3.1 Crear archivo .env
Copia `.env.example` a `.env` y completa:

```bash
# Supabase (OBLIGATORIO)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-supabase-anon-key

# WebSocket Server (OPCIONAL - para multijugador)
VITE_WEBSOCKET_URL=wss://tu-railway-app.up.railway.app

# OAuth (OPCIONAL - si no se configura, usa modo demo)
VITE_GOOGLE_CLIENT_ID=tu-google-client-id
VITE_FACEBOOK_APP_ID=tu-facebook-app-id
VITE_TWITTER_CLIENT_ID=tu-twitter-client-id
```

### 4. 🚀 Ejecutar la Aplicación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# (Opcional) Ejecutar servidor multijugador
npm run server
```

### 5. ✅ Verificar Configuración

#### 5.1 Verificar Supabase
- [ ] Proyecto creado
- [ ] Tablas creadas (profiles, game_history, transactions)
- [ ] Variables de entorno configuradas

#### 5.2 Verificar OAuth
- [ ] Google OAuth configurado
- [ ] Facebook OAuth configurado  
- [ ] Twitter OAuth configurado
- [ ] URLs de redirect correctas

#### 5.3 Verificar Aplicación
- [ ] App carga sin errores
- [ ] Login con Google funciona
- [ ] Login con Facebook funciona
- [ ] Login con Twitter funciona
- [ ] Modo demo funciona
- [ ] Datos se guardan en Supabase

## 🔧 Troubleshooting

### Problemas Comunes

#### OAuth no funciona:
1. Verifica que las URLs de redirect estén correctas
2. Confirma que las credenciales estén bien copiadas
3. Revisa que los dominios estén autorizados en cada provider

#### Base de datos no conecta:
1. Verifica las variables de entorno
2. Confirma que las migraciones se ejecutaron
3. Revisa los logs en Supabase Dashboard

#### Servidor desconectado:
- Es normal si no tienes el servidor WebSocket ejecutándose
- La app funciona en modo local sin servidor
- Para multijugador real, necesitas desplegar el servidor

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del navegador (F12 > Console)
2. Verifica la configuración paso a paso
3. Asegúrate de que todas las URLs estén correctas

¡Una vez configurado, tendrás autenticación OAuth real funcionando! 🎉
