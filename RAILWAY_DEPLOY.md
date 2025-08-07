# 🚀 Instrucciones de Deployment en Railway

## ⚠️ Importante: Imágenes de Planetas

Antes de hacer deploy, asegúrate de que las siguientes imágenes estén en el directorio `public/`:

- `Planeta (1).png`
- `Planeta (2).png` 
- `Planeta (3).png`
- `Planeta (4).png`
- `Planeta (5).png`

Si no tienes las imágenes PNG, el juego usará los archivos SVG de placeholder que se crearon automáticamente.

## 🔧 Solución del Error de Build

El error de build que experimentaste fue causado por referencias a librerías no instaladas en `vite.config.ts`. Esto ya fue corregido:

1. Eliminadas referencias a `@radix-ui/react-dialog` y `@radix-ui/react-toast`
2. Eliminadas referencias a `axios` y `date-fns`
3. Simplificada la configuración de `manualChunks`

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

1. **Commit y Push**: Asegúrate de hacer commit de todos los cambios
   ```bash
   git add .
   git commit -m "Fix build errors and add planet images"
   git push origin main
   ```

2. **En Railway**:
   - Ve a tu proyecto en Railway
   - Las variables de entorno ya deberían estar configuradas
   - Railway detectará automáticamente los cambios y comenzará el build

3. **Verificación**: 
   - El build debería completarse sin errores
   - Verifica que el health check responda en `/health`
   - Las imágenes de planetas deberían aparecer en el juego

## 🐛 Debugging

Si encuentras problemas:

1. Revisa los logs de build en Railway
2. Verifica que todas las variables de entorno estén configuradas
3. Ejecuta `node check-env.cjs` localmente para verificar

## 🎮 Mejoras Aplicadas

- Planetas ahora usan imágenes PNG reales con efecto parallax
- Movimiento de derecha a izquierda simulando movimiento hacia adelante
- Diferentes velocidades y tamaños para crear sensación de profundidad
- Fallback a SVG si las imágenes PNG no están disponibles
