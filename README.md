# 🚀 Spaceman Multiplayer Game

Un emocionante juego multijugador de apuestas espaciales con gráficos cartoon 2D y efectos visuales mejorados.

## 🎮 Características

- **Multijugador en tiempo real** con WebSocket
- **Sistema de apuestas** con cash out automático
- **Autenticación con Google** via Supabase Auth
- **Pagos con Stripe** para recargas
- **Efectos visuales cartoon 2D** con animaciones fluidas
- **Diseño responsivo** para móvil y desktop
- **Panel de cuenta completo** con historial de juegos y transacciones

## 🛠️ Stack Tecnológico

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + WebSocket
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth + Google OAuth
- **Pagos**: Stripe
- **Hosting**: Railway

## 📋 Requisitos

- Node.js 18+
- NPM 9+
- Cuenta en Supabase
- Cuenta en Stripe
- Cuenta en Railway

## 🚀 Despliegue en Railway

### Variables de Entorno Requeridas

```env
# Supabase
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
DATABASE_URL=tu_database_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=tu_stripe_publishable_key
STRIPE_SECRET_KEY=tu_stripe_secret_key
STRIPE_WEBHOOK_SECRET=tu_stripe_webhook_secret

# App
VITE_APP_URL=https://tu-app.up.railway.app
VITE_WS_URL=wss://tu-app.up.railway.app
PORT=3000
NODE_ENV=production
```

### Configuración

1. **Supabase**: Ejecuta las migraciones en el SQL Editor
2. **Google OAuth**: Configura en Supabase Dashboard
3. **Stripe**: Configura webhooks apuntando a `/api/stripe/webhook`
4. **Railway**: Importa el repositorio y añade las variables de entorno

## 🏃‍♂️ Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar servidor de producción
npm start
```

## 📱 Características del Juego

- **Apuestas**: 1-10,000 pesos mexicanos
- **Multiplicador**: Aumenta progresivamente hasta explotar
- **Cash Out**: Manual o automático
- **Auto Bot**: Sistema de apuestas automáticas
- **Chat**: Comunicación entre jugadores
- **Estadísticas**: Historial completo de juegos

## 🔒 Seguridad

- Autenticación segura con Supabase
- Pagos procesados por Stripe
- Validación de edad (18+)
- WebSocket seguro con autenticación

## 📄 Licencia

<<<<<<< Current (Your changes)
<<<<<<< Current (Your changes)
<<<<<<< Current (Your changes)
MIT License - ver archivo LICENSE para detalles.

---

¡Disfruta jugando Spaceman! 🚀✨
=======
Todos los derechos reservados.
>>>>>>> Incoming (Background Agent changes)
=======
Todos los derechos reservados.
>>>>>>> Incoming (Background Agent changes)
=======
Todos los derechos reservados.
>>>>>>> Incoming (Background Agent changes)
