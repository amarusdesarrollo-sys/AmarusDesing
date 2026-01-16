# 📁 Manejo de Categorías Dinámicas

## 🎯 Problema Actual

Las categorías están hardcodeadas en el tipo `ProductCategory`:

```typescript
export type ProductCategory =
  | "joyeria-artesanal"
  | "minerales-del-mundo"
  | "macrame";
// ... etc
```

Esto significa que:

- ❌ No se pueden crear categorías nuevas sin modificar código
- ❌ Las páginas están fijas: `/joyeria-artesanal`, `/macrame`, etc.
- ❌ No hay gestión de categorías desde el admin

## ✅ Solución Propuesta

### 1. **Colección de Categorías en Firestore**

Crear una colección `categories` en Firestore:

```javascript
categories/
  └── {categoryId}/
      ├── id: string
      ├── name: string              // "Joyería Artesanal"
      ├── slug: string              // "joyeria-artesanal" (URL-friendly)
      ├── description: string       // Descripción de la categoría
      ├── image?: string            // Imagen de la categoría
      ├── icon?: string             // Ícono (opcional)
      ├── order: number             // Orden de visualización
      ├── active: boolean           // Si está activa/visible
      ├── parentId?: string         // Para subcategorías (opcional)
      ├── createdAt: Timestamp
      └── updatedAt: Timestamp
```

### 2. **Actualizar Tipos TypeScript**

```typescript
// Antes (hardcodeado):
export type ProductCategory = "joyeria-artesanal" | "macrame" | ...;

// Después (dinámico):
export type ProductCategory = string; // Se valida contra la BD

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  icon?: string;
  order: number;
  active: boolean;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. **Página Dinámica de Categoría**

En lugar de páginas fijas, usar una página dinámica:

```
Antes:
/src/app/joyeria-artesanal/page.tsx
/src/app/macrame/page.tsx
etc...

Después:
/src/app/categorias/[slug]/page.tsx  ← UNA SOLA página para todas
```

La página `[slug]`:

- Obtiene el `slug` de la URL
- Busca la categoría en Firestore por `slug`
- Si existe y está activa → muestra productos
- Si no existe → 404

### 4. **Funciones Helper para Categorías**

```typescript
// src/lib/firebase/categories.ts
-getAllCategories() -
  getCategoryBySlug(slug) -
  getActiveCategories() -
  createCategory(category) -
  updateCategory(id, updates) -
  deleteCategory(id); // Soft delete
```

### 5. **Actualizar Navbar y Tienda Online**

El dropdown del navbar se genera dinámicamente desde Firestore:

- Obtener categorías activas
- Ordenar por `order`
- Generar links automáticamente

## 🔄 Flujo Completo

### Crear Nueva Categoría (Admin):

1. Admin va a `/admin/categorias/nueva`
2. Completa formulario:
   - Nombre: "Nueva Categoría"
   - Slug: "nueva-categoria" (auto-generado o manual)
   - Descripción, imagen, etc.
3. Se guarda en Firestore `categories`
4. ✅ Inmediatamente disponible en:
   - Dropdown del navbar
   - Página `/categorias/nueva-categoria`
   - Al crear productos, aparece en selector

### Usar Categoría:

- Productos: El campo `category` es el `slug` de la categoría
- URL: `/categorias/{slug}` muestra productos de esa categoría
- Navbar: Se actualiza automáticamente

## 📝 Ventajas

✅ **Flexibilidad**: Crear categorías sin tocar código
✅ **Escalable**: No hay límite de categorías
✅ **Mantenible**: Una sola página dinámica vs múltiples páginas fijas
✅ **SEO**: URLs amigables con slugs
✅ **Subcategorías**: Soporte futuro con `parentId`

## 🚀 Migración

Para mantener compatibilidad con las páginas actuales:

1. Crear categorías en Firestore para las existentes
2. Redirigir páginas viejas a `/categorias/[slug]`
3. O mantener ambas durante transición
