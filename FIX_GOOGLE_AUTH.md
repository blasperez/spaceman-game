# Guía para Solucionar Errores de Autenticación con Google y Supabase

He analizado el código de tu aplicación y la lógica de autenticación es correcta. El problema casi con seguridad está en la configuración. Sigue estos pasos para solucionarlo.

### Paso 1: Verifica las Variables de Entorno (`.env`)

Este es el culpable más común. Tu aplicación necesita dos claves para conectarse a Supabase.

1.  **Localiza tu archivo `.env`**: En la raíz de tu proyecto (`spaceman-game`), busca un archivo llamado `.env`. Si no existe, créalo.
2.  **Añade tus claves de Supabase**: Abre el archivo `.env` y asegúrate de que contenga las siguientes líneas, reemplazando los valores con tus propias claves de Supabase:

    ```
    VITE_SUPABASE_URL=https://<ID_DE_TU_PROYECTO>.supabase.co
    VITE_SUPABASE_ANON_KEY=<TU_CLAVE_ANON>
    ```

3.  **¿Dónde encontrar las claves?**
    *   Ve a tu [Dashboard de Supabase](https://app.supabase.com).
    *   Selecciona tu proyecto.
    *   Ve a **Project Settings** (el ícono de engrane) > **API**.
    *   Ahí encontrarás el **Project URL** (`https://...supabase.co`) y la **Project API Key** de tipo `anon` (la pública).

4.  **Reinicia tu aplicación**: Después de guardar los cambios en `.env`, detén tu servidor de desarrollo (con `Ctrl + C` en la terminal) y vuelve a iniciarlo (`npm run dev`).

### Paso 2: Configura la URL del Sitio y las URLs de Redirección

Supabase necesita saber cuál es la URL principal de tu sitio Y a qué URL específica debe redirigir a los usuarios. **Este es un paso crítico para el error de "intercambio de código".**

1.  **Ve a la Configuración de URLs de Supabase**:
    *   En tu Dashboard de Supabase, ve a **Authentication** (el ícono de usuario).
    *   En la sección **Configuration**, haz clic en **URL Configuration**.

2.  **Configura la URL del Sitio (Site URL)**:
    *   Este campo DEBE estar configurado con la URL base donde se ejecuta tu aplicación.
    *   Para desarrollo local, usa:
        ```
        http://localhost:5173
        ```
    *   **Importante**: Asegúrate de que la URL sea exacta (sin `/` al final). `5173` es el puerto por defecto de Vite. Si usas otro puerto, cámbialo.

3.  **Añade la URL de Redirección Adicional**:
    *   En el campo **Redirect URLs**, añade la siguiente URL específica para el callback:
        ```
        http://localhost:5173/auth/callback
        ```
    *   Guarda los cambios.


### Paso 3: Revisa la Configuración del Proveedor de Google en Supabase

1.  **Ve a la sección de Proveedores**:
    *   En el menú de **Authentication** de Supabase, haz clic en **Providers**.
2.  **Habilita y configura Google**:
    *   Asegúrate de que **Google** esté habilitado.
    *   Verifica que el **Client ID** y el **Client Secret** estén pegados correctamente. Si tienes dudas, vuelve a generarlos en la Google Cloud Console y pégalos de nuevo.
    *   **MUY IMPORTANTE**: Abre las opciones de Google y asegúrate de que la opción **"Proof Key for Code Exchange (PKCE)"** esté **HABILITADA**. El código de la aplicación está diseñado para usar este flujo de seguridad.
    *   Guarda los cambios.


### Paso 4: Verifica las URIs de Redirección en Google Cloud Console

Google también necesita saber qué URLs son seguras para redirigir a los usuarios.

1.  **Abre tu proyecto en Google Cloud Console**:
    *   Ve a la [página de Credenciales](https://console.cloud.google.com/apis/credentials).
    *   Selecciona tu proyecto.
2.  **Edita tu Cliente OAuth 2.0**:
    *   En la lista de "OAuth 2.0 Client IDs", haz clic en el nombre del cliente que estás usando para esta aplicación.
3.  **Añade la URI de redirección autorizada**:
    *   Busca la sección **Authorized redirect URIs**.
    *   Haz clic en **ADD URI**.
    *   Pega la siguiente URL:
        ```
        https://<ID_DE_TU_PROYECTO>.supabase.co/auth/v1/callback
        ```
    *   Reemplaza `<ID_DE_TU_PROYECTO>` con el ID de tu proyecto de Supabase.
    *   Guarda los cambios.

### Paso 5 (Opcional): Revisa las Políticas de RLS en tu Base de Datos

Si después de todo lo anterior sigues teniendo problemas (por ejemplo, el login funciona pero no carga tu perfil), puede ser un problema con los permisos de la base de datos.

1.  **Ve a las Políticas de Autenticación de Supabase**:
    *   En el Dashboard de Supabase, ve a **Authentication** > **Policies**.
2.  **Asegúrate de que existan políticas para la tabla `profiles`**:
    *   Deberías tener al menos una política que permita a los usuarios leer (`SELECT`) su propio perfil y otra que les permita crearlo/actualizarlo (`INSERT`, `UPDATE`).
    *   Si no hay políticas, créalas usando las plantillas de Supabase. Una política común es:
        *   **Para SELECT**: `(auth.uid() = id)` - "Los usuarios pueden ver su propio perfil."
        *   **Para INSERT/UPDATE**: `(auth.uid() = id)` - "Los usuarios pueden crear o actualizar su propio perfil."

Después de seguir estos pasos, tu autenticación con Google debería funcionar correctamente.
