# Supabase Storage — AmarusDesign

## Resumen

Las imágenes y vídeos del admin se guardan en un **bucket público** de Supabase Storage. En Firestore solo se persisten la **URL pública** y la **ruta** (`publicId`, `image`, `imagePublicId`, etc.), nunca el binario.

Las URLs antiguas de Cloudinary siguen funcionando hasta ejecutar la migración.

## Variables de entorno

| Variable | Dónde | Obligatoria |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente + servidor | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente (subidas firmadas de vídeo) | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor (API, borrado, migración) | Sí |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | Opcional (default: `images`) | No |

Copia `.env.example` → `.env.local` y rellena los valores del dashboard de Supabase (Project Settings → API).

En **Vercel**, añade las mismas variables al proyecto.

## Configuración en Supabase Dashboard

### 1. Bucket `images`

1. Storage → **New bucket**
2. Nombre: `images`
3. **Public bucket**: activado (lectura pública de objetos)

### 2. Políticas (RLS)

El admin sigue protegido con **Firebase Auth** en las API routes. Las subidas y borrados usan la **service role** en el servidor; los vídeos grandes usan **signed upload URLs** generadas en el servidor.

Políticas recomendadas:

```sql
-- Lectura pública (visitantes ven las imágenes)
CREATE POLICY "Public read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Escritura solo con service role (no crear política INSERT para anon/authenticated)
-- Las API Next.js usan SUPABASE_SERVICE_ROLE_KEY.
```

No hace falta política INSERT para `anon` si todas las subidas pasan por `/api/upload-image` o `/api/storage/signed-upload` (ambas requieren admin Firebase).

### 3. Signed uploads

El bucket debe permitir `createSignedUploadUrl` (disponible en proyectos Supabase actuales con service role).

## Carpetas en el bucket

| Carpeta | Uso |
|---------|-----|
| `products/` | Imágenes de producto |
| `products/videos/` | Vídeos de producto |
| `categories/` | Imágenes de categoría |
| `team/` | Fotos del equipo |
| `blog/` | Portadas del blog |
| `content/` | Home, historia, políticas |

## Firestore — campos afectados

| Colección / doc | Campos |
|-----------------|--------|
| `products` | `images[].url`, `images[].publicId` |
| `categories` | `image`, `imageUrl` |
| `blogPosts` | `imagePublicId`, `imageUrl` |
| `teamMembers` | `imagePublicId`, `imageUrl` |
| `content/historia` | `imagePublicId`, `imageUrl` |
| `content/politicas` | `heroImagePublicId`, `heroImageUrl` |
| `content/home` | `historia.imagePublicId`, `historia.imageUrl` |

## Migración desde Cloudinary

1. Configura Supabase (bucket + env vars).
2. Despliega el código nuevo (subidas ya van a Supabase).
3. Ejecuta en local con credenciales de producción:

```bash
# Simulación
npm run migrate:storage -- --dry-run

# Migración real (toda la base)
npm run migrate:storage

# Solo productos
npm run migrate:storage -- --collection=products
```

El script descarga cada URL de Cloudinary, sube a Supabase y actualiza Firestore. Las URLs Cloudinary en documentos ya migrados se reemplazan por URLs de Supabase.

**Nota:** Si Cloudinary bloqueó la cuenta y las URLs ya no responden, habrá que recuperar archivos desde backup local o resubir desde el admin.

## Compresión automática (subidas nuevas)

Desde el deploy con `sharp`, `/api/upload-image` comprime antes de subir (WebP, max ~1920px en heroes). La clienta sube desde el iPhone igual que antes.

## Recomprimir imágenes ya en el bucket

Para heroes/productos que ya están en Supabase a ~3 MB:

```bash
# Simulación (solo muestra qué haría)
npm run recompress:storage -- --dry-run

# Aplicar en todo el bucket
npm run recompress:storage

# Solo categorías (heroes de home)
npm run recompress:storage -- --folder=categories

# Solo archivos > 300 KB
npm run recompress:storage -- --min-kb=300
```

El script **sobrescribe el mismo archivo** (`upsert`) con la versión comprimida. La URL pública y el `publicId` en Firestore **no cambian**. En el dashboard de Supabase verás el **tamaño del objeto bajar** (puede tardar unos segundos en refrescar).

Requisitos: `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` de **producción**.

### Ver tamaño total del bucket

Supabase no muestra un total claro en Storage. Usa:

```bash
npm run audit:storage
```

Lista total GB, desglose por carpeta, top vídeos e imágenes más pesadas.

### Recomprimir vídeos (`products/videos/`)

Requiere **ffmpeg** instalado en tu PC (`winget install ffmpeg` en Windows).

```bash
npm run recompress:videos -- --dry-run
npm run recompress:videos
```

Convierte a H.264 MP4 (max 1280px, optimizado para web). Mismo path → URLs en Firestore no cambian.

Las subidas nuevas de vídeo siguen yendo directo a Supabase (límite Vercel); comprimir en lote es lo más práctico hoy.

## Imágenes estáticas

Los archivos en `public/images/` no pasan por Supabase (logo, placeholders, fotos por defecto del equipo en admin).

## next.config.js

Incluye `*.supabase.co` en `images.remotePatterns` y mantiene `res.cloudinary.com` para URLs legacy hasta completar la migración.
