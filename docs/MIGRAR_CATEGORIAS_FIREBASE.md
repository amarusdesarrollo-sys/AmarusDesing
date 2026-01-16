# 📦 Migrar Categorías Existentes a Firebase

## 📋 Guía para Migrar Categorías desde Mock Data a Firestore

### Paso 1: Preparar los Datos

Las categorías que tienes actualmente en mock data deben migrarse a Firestore. Aquí están las 6 categorías actuales:

```javascript
const categoriasExistentes = [
  {
    name: "Joyería Artesanal",
    slug: "joyeria-artesanal",
    description:
      "Piezas únicas hechas a mano con los mejores materiales naturales",
    order: 1,
    active: true,
  },
  {
    name: "Minerales del Mundo",
    slug: "minerales-del-mundo",
    description: "Minerales y cristales únicos de diferentes partes del mundo",
    order: 2,
    active: true,
  },
  {
    name: "Macramé",
    slug: "macrame",
    description:
      "Arte textil hecho a mano con nudos únicos y diseños originales",
    order: 3,
    active: true,
  },
  {
    name: "Tesoros del Mundo",
    slug: "tesoros-del-mundo",
    description:
      "Piezas únicas y auténticas de diferentes culturas alrededor del mundo",
    order: 4,
    active: true,
  },
  {
    name: "Ropa Artesanal",
    slug: "ropa-artesanal",
    description:
      "Prendas hechas a mano con materiales naturales y técnicas tradicionales",
    order: 5,
    active: true,
  },
  {
    name: "Colección Etiopía",
    slug: "coleccion-etiopia",
    description:
      "Piezas únicas de la cultura etíope, elaboradas con técnicas ancestrales",
    order: 6,
    active: true,
  },
];
```

### Paso 2: Opción A - Crear desde el Admin Panel

**Recomendado**: Usar el panel de administración que acabamos de crear:

1. Ve a `/admin/categorias`
2. Haz clic en "Nueva Categoría"
3. Completa el formulario para cada categoría:
   - Nombre
   - Slug (se genera automáticamente)
   - Descripción
   - Orden
   - Marca como activa
4. Guarda cada categoría

### Paso 3: Opción B - Script de Migración Automática

Si prefieres hacerlo automáticamente, crea un script temporal:

**Archivo: `scripts/migrate-categories.js`**

```javascript
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import firebaseConfig from "../src/lib/firebase.ts"; // O importa la config directamente

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const categoriasExistentes = [
  {
    name: "Joyería Artesanal",
    slug: "joyeria-artesanal",
    description:
      "Piezas únicas hechas a mano con los mejores materiales naturales",
    order: 1,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    name: "Minerales del Mundo",
    slug: "minerales-del-mundo",
    description: "Minerales y cristales únicos de diferentes partes del mundo",
    order: 2,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    name: "Macramé",
    slug: "macrame",
    description:
      "Arte textil hecho a mano con nudos únicos y diseños originales",
    order: 3,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    name: "Tesoros del Mundo",
    slug: "tesoros-del-mundo",
    description:
      "Piezas únicas y auténticas de diferentes culturas alrededor del mundo",
    order: 4,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    name: "Ropa Artesanal",
    slug: "ropa-artesanal",
    description:
      "Prendas hechas a mano con materiales naturales y técnicas tradicionales",
    order: 5,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    name: "Colección Etiopía",
    slug: "coleccion-etiopia",
    description:
      "Piezas únicas de la cultura etíope, elaboradas con técnicas ancestrales",
    order: 6,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

async function migrateCategories() {
  try {
    console.log("Iniciando migración de categorías...");

    const categoriesRef = collection(db, "categories");

    for (const categoria of categoriasExistentes) {
      const docRef = await addDoc(categoriesRef, categoria);
      console.log(`✅ Categoría creada: ${categoria.name} (ID: ${docRef.id})`);
    }

    console.log("✅ Migración completada exitosamente!");
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
  }
}

migrateCategories();
```

**Ejecutar el script:**

```bash
node scripts/migrate-categories.js
```

### Paso 4: Opción C - Crear Manualmente en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `amarus-3cee9`
3. Ve a **Firestore Database**
4. Haz clic en **"Iniciar colección"**
5. Nombre de la colección: `categories`
6. Crea cada documento con estos campos:

**Documento 1:**

- Campo: `name` → Tipo: `string` → Valor: `Joyería Artesanal`
- Campo: `slug` → Tipo: `string` → Valor: `joyeria-artesanal`
- Campo: `description` → Tipo: `string` → Valor: `Piezas únicas hechas a mano...`
- Campo: `order` → Tipo: `number` → Valor: `1`
- Campo: `active` → Tipo: `boolean` → Valor: `true`
- Campo: `createdAt` → Tipo: `timestamp` → Valor: `[usar servidor]`
- Campo: `updatedAt` → Tipo: `timestamp` → Valor: `[usar servidor]`

Repite para las otras 5 categorías.

### Paso 5: Verificar la Migración

1. Ve a `/admin/categorias`
2. Deberías ver todas las categorías listadas
3. Verifica que el navbar muestre las categorías en el dropdown
4. Verifica que las URLs funcionen:
   - `/categorias/joyeria-artesanal`
   - `/categorias/minerales-del-mundo`
   - etc.

### Notas Importantes

⚠️ **Importante:**

- Asegúrate de que los `slug` coincidan exactamente con los que tienes en mock data
- Si cambias un `slug`, las URLs antiguas dejarán de funcionar
- El campo `order` determina el orden de aparición en el navbar

✅ **Después de migrar:**

- El navbar cargará las categorías desde Firestore
- Las páginas dinámicas funcionarán con las categorías de Firestore
- Puedes crear nuevas categorías desde el admin panel
- Ya no necesitarás el fallback de mock data (pero se mantiene por compatibilidad)

---

**¿Necesitas ayuda?** Si tienes problemas con la migración, revisa:

1. Que las credenciales de Firebase estén correctas en `.env.local`
2. Que Firestore esté habilitado en tu proyecto
3. Que las reglas de seguridad permitan lectura/escritura (al menos temporalmente para admin)
