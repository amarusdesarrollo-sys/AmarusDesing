# 🔑 Cómo Extraer Credenciales de CLOUDINARY_URL

Si Cloudinary te proporciona una variable `CLOUDINARY_URL` en este formato:

```
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
```

## 📝 Ejemplo Real

Si tienes:
```
CLOUDINARY_URL=cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz123456@dwqd4wsrg
```

## 🔍 Cómo Extraer los Valores

De esa URL puedes extraer:

1. **Cloud Name**: `dwqd4wsrg` (lo que está después del `@`)
2. **API Key**: `123456789012345` (lo que está después de `cloudinary://` y antes de `:`)
3. **API Secret**: `abcdefghijklmnopqrstuvwxyz123456` (lo que está entre `:` y `@`)

## ✅ Configuración para el Proyecto

En tu archivo `.env.local`, usa estas variables **separadas**:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dwqd4wsrg
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

## 🎯 Resumen

| De CLOUDINARY_URL | A Variable Separada |
|-------------------|---------------------|
| `cloudinary://` | (ignorar) |
| `123456789012345` | `CLOUDINARY_API_KEY` |
| `:` | (separador) |
| `abcdefghijklmnop...` | `CLOUDINARY_API_SECRET` |
| `@` | (separador) |
| `dwqd4wsrg` | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` |

## ⚠️ Importante

- El **Cloud Name** (`dwqd4wsrg`) debe tener el prefijo `NEXT_PUBLIC_` porque se usa en el cliente
- El **API Key** y **API Secret** NO deben tener `NEXT_PUBLIC_` porque son privados

## 🔄 Alternativa: Usar CLOUDINARY_URL Directamente

Si prefieres usar `CLOUDINARY_URL` directamente, necesitaríamos modificar el código para parsear esa URL. Pero es más simple usar las variables separadas como está configurado actualmente.
