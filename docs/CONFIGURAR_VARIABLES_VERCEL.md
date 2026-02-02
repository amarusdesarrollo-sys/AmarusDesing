# 📋 Cómo Configurar Variables de Entorno en Vercel

Este documento explica cómo configurar las variables de entorno de Firebase en Vercel para que el proyecto funcione correctamente en producción.

## 🚀 Pasos para Configurar Variables de Entorno en Vercel

### 1. Accede a tu Proyecto en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Selecciona tu proyecto (o créalo si aún no lo tienes)

### 2. Ve a la Sección de Variables de Entorno

1. En tu proyecto, ve a **Settings** (Configuración)
2. En el menú lateral, haz clic en **Environment Variables** (Variables de Entorno)

### 3. Agrega las Variables de Firebase

Agrega cada una de las siguientes variables con sus valores correspondientes:

#### Variables Requeridas:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDYUXBjL_Hd6Jpih-970w4IqZe0EpnQWxk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=amarus-3cee9.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=amarus-3cee9
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=amarus-3cee9.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=261828732683
NEXT_PUBLIC_FIREBASE_APP_ID=1:261828732683:web:2df0252d21af886671640e
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-J12Q6F3C8V
```

#### Cómo Agregar Cada Variable:

1. Haz clic en **Add New** (Agregar Nueva)
2. En **Key**, escribe el nombre de la variable (ej: `NEXT_PUBLIC_FIREBASE_API_KEY`)
3. En **Value**, pega el valor correspondiente
4. Selecciona los **Environments** (Entornos) donde aplicar la variable:
   - ✅ **Production** (Producción) - para el deploy principal
   - ✅ **Preview** (Vista previa) - para PRs y previews
   - ✅ **Development** (Desarrollo) - opcional
5. Haz clic en **Save** (Guardar)

### 4. Reinicia el Build Después de Agregar Variables

Después de agregar todas las variables:

1. Ve a **Deployments** (Despliegues)
2. Encuentra el último deployment fallido o haz un nuevo deployment
3. Haz clic en los **3 puntos** (⋯) y selecciona **Redeploy** (Redesplegar)
4. O simplemente haz un nuevo push a tu repositorio

## ⚠️ Importante

- **NO** compartas estas variables públicamente en tu repositorio
- Las variables que empiezan con `NEXT_PUBLIC_` son visibles en el cliente, pero aún así deben estar configuradas
- Después de agregar las variables, el build debería funcionar correctamente

## 🔍 Verificar que las Variables Estén Configuradas

Después del deploy, puedes verificar en los logs de Vercel que las variables estén disponibles. Si ves errores de `auth/invalid-api-key`, significa que las variables no están configuradas correctamente.

## 📝 Nota sobre el Build

El código ahora está configurado para que el build no falle incluso si las variables no están configuradas (usará valores dummy). Sin embargo, **la aplicación NO funcionará correctamente en runtime** hasta que configures las variables de entorno en Vercel.

---

**Última actualización**: Variables de entorno necesarias para Firebase en Vercel