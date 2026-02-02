# ☁️ Guía de Configuración de Cloudinary - AmarusDesign

## 📋 Configuración Inicial

### 1. Variables de Entorno

Asegúrate de tener estas variables configuradas en tu `.env.local`:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

**Importante:** `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` debe tener el prefijo `NEXT_PUBLIC_` porque se usa en el cliente.

### 2. Configuración en Vercel

Si estás usando Vercel, agrega estas variables en:
- Settings → Environment Variables
- Marca todas para Production, Preview y Development

## 🖼️ Uso de Cloudinary en el Proyecto

### Estructura de Datos de Productos

Las imágenes de productos deben tener esta estructura:

```typescript
{
  id: string;
  url: string; // URL completa de Cloudinary (opcional, se genera automáticamente)
  alt: string;
  publicId: string; // ⚠️ IMPORTANTE: El public ID de Cloudinary
  width: number;
  height: number;
  isPrimary: boolean;
}
```

### Ejemplo de Producto con Cloudinary

```typescript
{
  id: "joy-001",
  name: "Anillo de Plata",
  images: [
    {
      id: "img-001",
      url: "https://res.cloudinary.com/tu-cloud/image/upload/v123/anillo.jpg", // Opcional
      alt: "Anillo de plata con cuarzo",
      publicId: "products/joyeria/anillo-plata-cuarzo", // ⚠️ Requerido
      width: 800,
      height: 800,
      isPrimary: true,
    }
  ]
}
```

## 🛠️ Funciones Disponibles

### `getProductImageUrl(publicId, size)`

Genera una URL optimizada de Cloudinary para imágenes de productos.

```typescript
import { getProductImageUrl } from "@/lib/cloudinary";

// Tamaños disponibles:
// - "thumbnail" (200x200)
// - "small" (400x400)
// - "medium" (800x800) - por defecto
// - "large" (1200x1200)

const imageUrl = getProductImageUrl("products/joyeria/anillo", "large");
```

### `getCloudinaryUrl(publicId, options)`

Función más flexible para generar URLs con transformaciones personalizadas.

```typescript
import { getCloudinaryUrl } from "@/lib/cloudinary";

const url = getCloudinaryUrl("products/joyeria/anillo", {
  width: 600,
  height: 600,
  quality: "auto",
  format: "auto",
  crop: "fill",
  gravity: "auto",
});
```

### `isCloudinaryUrl(url)`

Verifica si una URL es de Cloudinary.

```typescript
import { isCloudinaryUrl } from "@/lib/cloudinary";

if (isCloudinaryUrl(image.url)) {
  // Es una URL de Cloudinary
}
```

### `extractPublicIdFromUrl(url)`

Extrae el publicId de una URL de Cloudinary.

```typescript
import { extractPublicIdFromUrl } from "@/lib/cloudinary";

const publicId = extractPublicIdFromUrl(
  "https://res.cloudinary.com/cloud/image/upload/v123/products/anillo.jpg"
);
// Retorna: "products/anillo"
```

## 📦 Componentes Actualizados

### ProductCard

El componente `ProductCard` ya está configurado para usar Cloudinary automáticamente:

```tsx
<ProductCard product={product} />
```

Si el producto tiene `publicId` en sus imágenes, se usará Cloudinary automáticamente.

### Página de Detalle de Producto

La página `/productos/[id]` también está configurada para Cloudinary:

- Imagen principal: tamaño `large` (1200x1200)
- Thumbnails: tamaño `thumbnail` (200x200)

### OptimizedImage

El componente `OptimizedImage` soporta Cloudinary:

```tsx
import OptimizedImage from "@/components/OptimizedImage";

<OptimizedImage
  src={image.url}
  alt="Producto"
  publicId={image.publicId} // ⚠️ Si tienes publicId, úsalo
  cloudinarySize="medium"
  width={800}
  height={800}
/>
```

## 🎯 Mejores Prácticas

### 1. Usar publicId en lugar de URL completa

**✅ Bueno:**
```typescript
{
  publicId: "products/joyeria/anillo",
  url: "" // Opcional, se genera automáticamente
}
```

**❌ Evitar:**
```typescript
{
  url: "https://res.cloudinary.com/cloud/image/upload/v123/products/anillo.jpg",
  publicId: "" // Sin publicId, no se puede optimizar
}
```

### 2. Organizar publicIds por categoría

```
products/
  ├── joyeria-artesanal/
  │   ├── anillo-001
  │   ├── anillo-002
  │   └── colgante-001
  ├── minerales-del-mundo/
  │   ├── cuarzo-rosa-001
  │   └── amatista-001
  └── macrame/
      ├── tapiz-001
      └── bolso-001
```

### 3. Subir imágenes a Cloudinary

Cuando subas imágenes desde el admin:

1. Sube la imagen a Cloudinary
2. Guarda el `publicId` en Firestore (no la URL completa)
3. El sistema generará las URLs optimizadas automáticamente

### 4. Formatos automáticos

Cloudinary detecta automáticamente el mejor formato (AVIF, WebP, etc.) según el navegador del usuario.

## 🔧 Transformaciones Automáticas

El sistema aplica automáticamente estas transformaciones:

- **Formato:** `auto` (AVIF/WebP según soporte)
- **Calidad:** `auto` (optimizada por Cloudinary)
- **Crop:** `fill` (rellena el espacio manteniendo aspecto)
- **Gravity:** `auto` (centro inteligente)

## 📊 Tamaños Predefinidos

| Tamaño | Dimensiones | Uso |
|--------|-------------|-----|
| `thumbnail` | 200x200 | Thumbnails, miniaturas |
| `small` | 400x400 | Listas de productos (móvil) |
| `medium` | 800x800 | Cards de productos, catálogo |
| `large` | 1200x1200 | Página de detalle |

## 🚀 Subida de Imágenes desde Admin

Cuando implementes la gestión de productos en admin:

**⚠️ IMPORTANTE:** El SDK de Cloudinary solo funciona en el servidor. Úsalo en:
- API Routes (`/app/api/...`)
- Server Actions
- Server Components

```typescript
// ⚠️ SOLO en el servidor (API Routes, Server Actions)
import cloudinary from "@/lib/cloudinary-server";

// Subir imagen (ejemplo en API Route)
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  
  const result = await cloudinary.uploader.upload(file, {
    folder: "products/joyeria-artesanal",
    public_id: `anillo-${Date.now()}`,
    resource_type: "image",
  });

  // Guardar en Firestore
  const productImage = {
    id: generateId(),
    url: result.secure_url, // Opcional
    alt: "Anillo de plata",
    publicId: result.public_id, // ⚠️ IMPORTANTE
    width: result.width,
    height: result.height,
    isPrimary: true,
  };
  
  return Response.json({ success: true, image: productImage });
}
```

## ⚠️ Notas Importantes

1. **No optimizar imágenes de Cloudinary con Next.js**: Las imágenes de Cloudinary ya están optimizadas, por eso usamos `unoptimized={true}`.

2. **PublicId es requerido**: Para aprovechar las optimizaciones, siempre guarda el `publicId` en Firestore.

3. **URLs dinámicas**: Las URLs se generan dinámicamente, así que no necesitas guardar URLs completas en la base de datos.

4. **Fallback automático**: Si no hay `publicId`, el sistema usa la URL directa como fallback.

## 🔍 Verificación

Para verificar que Cloudinary está funcionando:

1. Abre DevTools → Network
2. Busca imágenes con dominio `res.cloudinary.com`
3. Verifica que las URLs incluyan transformaciones como `w_800,h_800,c_fill,q_auto,f_auto`

## 📚 Recursos

- [Documentación de Cloudinary](https://cloudinary.com/documentation)
- [Transformaciones de Imágenes](https://cloudinary.com/documentation/image_transformations)
- [Next.js Image Optimization](https://nextjs.org/docs/pages/api-reference/components/image)
