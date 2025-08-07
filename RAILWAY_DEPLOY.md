# 🚀 Instrucciones de Deployment en Railway

## ⚠️ Importante: Imágenes de Planetas

Antes de hacer deploy, asegúrate de que las siguientes imágenes estén en el directorio `public/`:

- `Planeta (1).png`
- `Planeta (2).png` 
- `Planeta (3).png`
- `Planeta (4).png`
- `Planeta (5).png`

Si no tienes las imágenes PNG, el juego usará los archivos SVG de placeholder que se crearon automáticamente.

## 🔧 Soluciones a Errores de Build

### 1. Error de librerías no instaladas
El error de build fue causado por referencias a librerías no instaladas en `vite.config.ts`. **SOLUCIONADO**: 
- Eliminadas referencias a `@radix-ui/react-dialog` y `@radix-ui/react-toast`
- Eliminadas referencias a `axios` y `date-fns`

### 2. Build colgado en Railway
El build se colgaba debido al script `postinstall`. **SOLUCIONADO**:
- Eliminado el script `postinstall` que causaba un loop
- Simplificado `.npmrc` con configuración mínima
- Eliminado `nixpacks.toml` para usar detección automática
- Especificado Node.js 20.x en `package.json` y `.nvmrc`

## 📝 Variables de Entorno Necesarias

Asegúrate de configurar todas estas variables en Railway:

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

## 🚂 Pasos para Deploy

1. **Verificar archivos localmente**:
   ```bash
   npm run check-planets  # Verifica imágenes de planetas
   npm run check-env      # Verifica variables de entorno
   ```

2. **Commit y Push**:
   ```bash
   git add .
   git commit -m "Fix Railway build issues"
   git push origin main
   ```

3. **En Railway**:
   - Ve a tu proyecto en Railway
   - Verifica las variables de entorno
   - El build debería completarse sin errores ahora

## 🐛 Si el Build Sigue Fallando

1. **Limpiar caché en Railway**:
   - En Railway dashboard, ve a Settings > Build > Clear build cache

2. **Verificar logs**:
   - Los logs deberían mostrar el progreso del build
   - Si se queda colgado, verifica que no haya scripts infinitos

3. **Build manual** (último recurso):
   ```bash
   # Localmente
   npm run build
   # Commit la carpeta dist
   git add dist -f
   git commit -m "Add dist folder"
   git push
   ```

## 🎮 Mejoras Aplicadas

- ✅ Planetas ahora usan imágenes PNG reales con efecto parallax
- ✅ Movimiento de derecha a izquierda simulando movimiento hacia adelante
- ✅ Diferentes velocidades y tamaños para crear sensación de profundidad
- ✅ Fallback a SVG si las imágenes PNG no están disponibles
- ✅ Build optimizado para Railway sin loops infinitos