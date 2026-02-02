# ☁️ Guía Paso a Paso: Configurar Cloudinary

## 📋 Paso 1: Crear Cuenta en Cloudinary

1. Ve a [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Completa el formulario de registro:
   - Email
   - Nombre
   - Contraseña
   - Confirma que aceptas los términos
3. Haz clic en "Create Account"
4. Verifica tu email si es necesario

## 🔑 Paso 2: Obtener las Credenciales

Una vez que inicies sesión en Cloudinary:

1. Ve al **Dashboard** (deberías estar ahí automáticamente)
2. En la parte superior verás un panel con tu información:
   - **Cloud name** (ejemplo: `dxyz123abc`)
   - **API Key** (ejemplo: `123456789012345`)
   - **API Secret** (ejemplo: `abcdefghijklmnopqrstuvwxyz123456`)

   ⚠️ **IMPORTANTE:** El API Secret es privado, no lo compartas públicamente.

3. Si no ves esta información, haz clic en el ícono de usuario (arriba a la derecha) → **Dashboard**

## 🔧 Paso 3: Configurar Variables de Entorno Local

1. Abre el archivo `.env.local` en la raíz del proyecto
2. Si no existe, créalo
3. Agrega estas variables:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name-aqui
CLOUDINARY_API_KEY=tu-api-key-aqui
CLOUDINARY_API_SECRET=tu-api-secret-aqui
```

**Ejemplo real:**
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxyz123abc
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

⚠️ **NOTA:** 
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` debe tener el prefijo `NEXT_PUBLIC_` porque se usa en el cliente
- `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` NO deben tener el prefijo `NEXT_PUBLIC_` porque son privados

## 🌐 Paso 4: Configurar Variables en Vercel (si ya tienes deploy)

1. Ve a tu proyecto en [Vercel](https://vercel.com)
2. Ve a **Settings** → **Environment Variables**
3. Agrega las tres variables:
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` → Valor: tu cloud name
   - `CLOUDINARY_API_KEY` → Valor: tu API key
   - `CLOUDINARY_API_SECRET` → Valor: tu API secret
4. Marca las tres para **Production**, **Preview** y **Development**
5. Haz clic en **Save**
6. **Re-deploy** tu aplicación para que tome las nuevas variables

## ✅ Paso 5: Verificar la Configuración

### Opción 1: Verificar en el código

Abre la consola del navegador (F12) y ejecuta:

```javascript
console.log(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
```

Deberías ver tu cloud name. Si ves `undefined`, las variables no están configuradas correctamente.

### Opción 2: Probar subiendo una imagen

Cuando implementes la funcionalidad de subir imágenes desde el admin, podrás probar que funciona.

## 🚨 Solución de Problemas

### Error: "Cloudinary cloud name no configurado"

**Causa:** La variable `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` no está configurada.

**Solución:**
1. Verifica que el archivo `.env.local` existe en la raíz del proyecto
2. Verifica que la variable tiene el prefijo `NEXT_PUBLIC_`
3. Reinicia el servidor de desarrollo: `npm run dev`

### Error: "Module not found: Can't resolve 'fs'"

**Causa:** Estás importando el SDK de Cloudinary en un componente del cliente.

**Solución:** 
- Para generar URLs: usa `@/lib/cloudinary` (funciones de utilidad)
- Para subir imágenes: usa `@/lib/cloudinary-server` (solo en API Routes)

### Las imágenes no se optimizan

**Causa:** No estás usando `publicId` en las imágenes.

**Solución:** Asegúrate de que tus productos en Firestore tengan `publicId` en las imágenes:

```typescript
{
  images: [{
    publicId: "products/joyeria/anillo-001", // ⚠️ Requerido
    url: "", // Opcional
    alt: "Anillo de plata"
  }]
}
```

## 📚 Recursos Adicionales

- [Documentación oficial de Cloudinary](https://cloudinary.com/documentation)
- [Guía de Next.js + Cloudinary](https://cloudinary.com/documentation/nextjs_integration)
- [Dashboard de Cloudinary](https://console.cloudinary.com/)

## 💡 Tips

1. **Plan Gratuito:** Cloudinary ofrece un plan gratuito generoso (25 créditos/mes), perfecto para empezar
2. **Organización:** Organiza tus imágenes por carpetas en Cloudinary (ej: `products/joyeria/`, `products/macrame/`)
3. **Nomenclatura:** Usa nombres descriptivos para los `publicId` (ej: `anillo-plata-cuarzo-001`)
4. **Optimización:** Cloudinary optimiza automáticamente las imágenes (formato, tamaño, calidad)

## 🎯 Próximos Pasos

Una vez configurado Cloudinary:

1. ✅ Las funciones de generación de URLs ya funcionan
2. ⏳ Implementar subida de imágenes desde el admin (usando `@/lib/cloudinary-server`)
3. ⏳ Migrar imágenes existentes a Cloudinary (si las tienes)

---

**¿Necesitas ayuda?** Revisa la documentación en `docs/CLOUDINARY_SETUP.md` para más detalles sobre cómo usar Cloudinary en el proyecto.
