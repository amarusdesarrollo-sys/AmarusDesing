# 🔧 Solución: Crear Índice en Firestore

## ❌ Error Actual

```
FirebaseError: The query requires an index
```

Este error ocurre porque Firestore necesita un **índice compuesto** cuando usas `where()` y `orderBy()` juntos en diferentes campos.

## ✅ Solución 1: Crear el Índice (RECOMENDADO)

### Opción A: Usar el enlace directo del error

1. **Haz clic en el enlace** que aparece en el error:
   ```
   https://console.firebase.google.com/v1/r/project/amarus-3cee9/firestore/indexes?create_composite=...
   ```

2. Firebase Console se abrirá automáticamente
3. Haz clic en **"Crear índice"** o **"Create Index"**
4. Espera 1-2 minutos mientras se crea el índice
5. ✅ Listo! El error desaparecerá

### Opción B: Crear manualmente

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `amarus-3cee9`
3. Ve a **Firestore Database** → **Indexes** (Índices)
4. Haz clic en **"Create Index"** o **"Crear índice"**
5. Configura el índice:
   - **Collection ID**: `categories`
   - **Fields to index**:
     - `active` - Ascending (Ascendente)
     - `order` - Ascending (Ascendente)
   - **Query scope**: Collection
6. Haz clic en **"Create"** o **"Crear"**
7. Espera 1-2 minutos

## ✅ Solución 2: Modificar Consulta (TEMPORAL)

Si no puedes crear el índice ahora, puedes modificar la consulta para filtrar en memoria:

**NOTA**: Esta solución es menos eficiente pero funciona. Usa Solución 1 si es posible.

```typescript
// Obtener solo categorías activas (sin índice - filtra en memoria)
export const getActiveCategories = async (): Promise<Category[]> => {
  try {
    const categoriesRef = collection(db, COLLECTION_NAME);
    // Primero obtener todas y ordenar
    const q = query(categoriesRef, orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    
    // Filtrar activas en memoria
    const categories = snapshot.docs
      .map((doc) => firestoreToCategory(doc.data(), doc.id))
      .filter((cat) => cat.active);
    
    return categories;
  } catch (error) {
    console.error("Error getting active categories:", error);
    throw error;
  }
};
```

## 📋 Índices Necesarios

Para optimizar todas las consultas, estos son los índices recomendados:

### 1. Para `getActiveCategories()`:
- Collection: `categories`
- Fields: `active` (Asc), `order` (Asc)

### 2. Para `getCategoryBySlug()`:
- Collection: `categories`
- Fields: `slug` (Asc), `active` (Asc)
- (Solo si se agrega `orderBy` después)

### 3. Para `getSubcategories()` (futuro):
- Collection: `categories`
- Fields: `parentId` (Asc), `active` (Asc), `order` (Asc)

### 4. Para `getOrdersByUserId()` (Mis pedidos):
- Collection: `orders`
- Fields: `userId` (Asc), `createdAt` (Desc)
- Si Firebase te muestra un enlace al crear el índice al usar "Mis pedidos", úsalo para crearlo.

## 🚀 Después de Crear el Índice

1. Recarga la aplicación
2. El error desaparecerá automáticamente
3. La consulta funcionará más rápido

## ⚠️ Nota Importante

- Los índices se crean **automáticamente** cuando haces clic en el enlace del error
- La creación del índice toma **1-2 minutos**
- Mientras tanto, puedes usar la Solución 2 como temporal
- Una vez creado, el índice permanece permanente
