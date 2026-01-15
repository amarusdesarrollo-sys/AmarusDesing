# 🖼️ Guía de Optimización de Imágenes - AmarusDesign

## 📁 Estructura de Carpetas

```
public/images/
├── products/                 # Imágenes originales de productos
│   ├── joyeria-artesanal/
│   ├── minerales-del-mundo/
│   ├── macrame/
│   ├── ropa-artesanal/
│   ├── tesoros-del-mundo/
│   └── coleccion-etiopia/
├── heroes/                  # Imágenes hero de secciones
├── artisans/                # Fotos de artesanos
├── about/                   # Imágenes sobre nosotros
├── gallery/                 # Galería de fotos
└── optimized/               # Imágenes optimizadas (generadas automáticamente)
    ├── products/
    ├── heroes/
    ├── artisans/
    ├── about/
    └── gallery/
```

## 🚀 Comandos Disponibles

### 1. Optimizar todas las imágenes

```bash
npm run optimize:images
```

Convierte todas las imágenes en `public/images/` a formato AVIF y las organiza en `public/images/optimized/`.

### 2. Optimizar una imagen específica

```bash
npm run optimize:image public/images/products/joyeria-artesanal/anillo1.jpg
```

Optimiza una imagen específica creando múltiples tamaños y formatos.

## 📐 Configuraciones por Tipo de Imagen

### 🏷️ Productos

- **Tamaño**: 800x800px
- **Calidad**: 90%
- **Formato**: AVIF + WebP (fallback)
- **Uso**: Catálogo de productos, páginas de detalle

### 🎨 Imágenes Hero

- **Tamaño**: 1920x1080px
- **Calidad**: 85%
- **Formato**: AVIF
- **Uso**: Banners principales, secciones destacadas

### 🖼️ Galería

- **Tamaño**: 1200x800px
- **Calidad**: 85%
- **Formato**: AVIF
- **Uso**: Galerías de fotos, contenido visual

### 👤 Artesanos

- **Tamaño**: 400x400px
- **Calidad**: 80%
- **Formato**: AVIF
- **Uso**: Fotos de perfil, thumbnails

## 🔧 Componentes de Imagen

### OptimizedImage

Componente base para todas las imágenes optimizadas:

```tsx
import OptimizedImage from "@/components/OptimizedImage";

<OptimizedImage
  src="/images/products/joyeria-artesanal/anillo1.avif"
  alt="Anillo artesanal de plata"
  width={800}
  height={800}
  className="rounded-lg"
  priority={true}
/>;
```

### ProductImage

Especializado para productos:

```tsx
import { ProductImage } from "@/components/OptimizedImage";

<ProductImage
  src="/images/products/joyeria-artesanal/anillo1.avif"
  alt="Anillo artesanal de plata"
/>;
```

### HeroImage

Para imágenes hero:

```tsx
import { HeroImage } from "@/components/OptimizedImage";

<HeroImage
  src="/images/heroes/joyeria-hero.avif"
  alt="Joyería artesanal AmarusDesign"
/>;
```

### ThumbnailImage

Para thumbnails:

```tsx
import { ThumbnailImage } from "@/components/OptimizedImage";

<ThumbnailImage
  src="/images/artisans/maria-garcia.avif"
  alt="María García - Artesana"
/>;
```

## 📱 Responsive Images

Los componentes automáticamente generan diferentes tamaños:

- **Mobile**: 400px
- **Tablet**: 800px
- **Desktop**: 1200px
- **Large Desktop**: 1600px

## 🎯 Mejores Prácticas

### 1. Nomenclatura de Archivos

```
producto-categoria-numero.avif
ejemplo: anillo-plata-001.avif
```

### 2. Alt Text Descriptivo

```tsx
// ✅ Bueno
alt = "Anillo artesanal de plata con turquesa natural";

// ❌ Malo
alt = "anillo";
```

### 3. Lazy Loading

```tsx
// Para imágenes above-the-fold
<OptimizedImage priority={true} />

// Para imágenes below-the-fold (por defecto)
<OptimizedImage priority={false} />
```

### 4. Fallbacks

```tsx
<OptimizedImage
  src="/images/product.avif"
  fallback="/images/product.jpg"
  webpSrc="/images/product.webp"
/>
```

## 🔄 Flujo de Trabajo

1. **Subir imágenes originales** a las carpetas correspondientes
2. **Ejecutar optimización**: `npm run optimize:images`
3. **Usar componentes** en lugar de `<img>` tags
4. **Verificar rendimiento** en DevTools

## 📊 Beneficios de AVIF

- **Compresión**: 50% mejor que JPEG
- **Calidad**: Mejor que WebP
- **Soporte**: 85% de navegadores modernos
- **Fallback**: WebP para compatibilidad

## 🛠️ Herramientas Adicionales

### Verificar soporte AVIF

```javascript
// En el navegador
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
const avifSupported =
  ctx.createImageData(1, 1).data.constructor === Uint8ClampedArray;
```

### Análisis de rendimiento

```bash
# Lighthouse para análisis de imágenes
npm run build
npm run start
# Luego ejecutar Lighthouse en DevTools
```

## 🚨 Solución de Problemas

### Error: "Module not found: sharp"

```bash
npm install sharp
```

### Imágenes no se optimizan

- Verificar que las imágenes estén en las carpetas correctas
- Comprobar permisos de escritura
- Revisar logs del script de optimización

### Imágenes muy pesadas

- Reducir calidad en el script
- Usar tamaños más pequeños
- Considerar compresión adicional

## 📈 Métricas de Rendimiento

Objetivos para AmarusDesign:

- **LCP**: < 2.5s (Largest Contentful Paint)
- **CLS**: < 0.1 (Cumulative Layout Shift)
- **FID**: < 100ms (First Input Delay)
- **Tamaño de imagen**: < 100KB por imagen
