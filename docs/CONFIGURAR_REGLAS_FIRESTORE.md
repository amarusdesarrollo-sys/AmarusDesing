# 🔒 Configurar Reglas de Seguridad de Firestore

## ⚠️ Error: "Missing or insufficient permissions"

Este error ocurre porque las reglas de seguridad de Firestore no permiten escribir datos desde el cliente.

## 📋 Solución: Configurar Reglas en Firebase Console

### Paso 1: Ir a Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `amarus-3cee9`
3. En el menú lateral, ve a **Firestore Database**
4. Haz clic en la pestaña **"Rules"** (Reglas)

### Paso 2: Configurar Reglas Básicas (Desarrollo)

Para desarrollo, puedes usar estas reglas que permiten lectura y escritura:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para categorías
    match /categories/{categoryId} {
      allow read: if true;  // Todos pueden leer
      allow create, update, delete: if true;  // Todos pueden escribir (solo para desarrollo)
    }
    
    // Reglas para productos
    match /products/{productId} {
      allow read: if true;  // Todos pueden leer
      allow create, update, delete: if true;  // Todos pueden escribir (solo para desarrollo)
    }
    
    // Reglas para órdenes (más restrictivas)
    match /orders/{orderId} {
      allow read, write: if request.auth != null;  // Solo usuarios autenticados
    }
  }
}
```

### Paso 3: Publicar las Reglas

1. Copia las reglas de arriba
2. Pégalas en el editor de reglas de Firebase Console
3. Haz clic en **"Publish"** (Publicar)

### ⚠️ IMPORTANTE: Seguridad en Producción

Las reglas de arriba son **SOLO PARA DESARROLLO**. En producción, deberías:

1. **Implementar autenticación** (NextAuth + Firebase Auth)
2. **Restringir escritura** solo a usuarios autenticados con rol de admin
3. **Usar reglas como estas:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Función helper para verificar si es admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Categorías: lectura pública, escritura solo admin
    match /categories/{categoryId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
    
    // Productos: lectura pública, escritura solo admin
    match /products/{productId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
    
    // Órdenes: solo el usuario puede leer sus propias órdenes
    match /orders/{orderId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if isAdmin();  // Solo admin puede actualizar estado
    }
  }
}
```

## 🚀 Pasos Rápidos

1. Ve a: https://console.firebase.google.com/project/amarus-3cee9/firestore/rules
2. Reemplaza las reglas actuales con las reglas de desarrollo de arriba
3. Haz clic en **"Publish"**
4. Espera unos segundos a que se actualicen
5. Intenta crear una categoría nuevamente

## ✅ Verificar que Funciona

Después de publicar las reglas:

1. Ve a `/admin/categorias`
2. Haz clic en "Inicializar Categorías Automáticamente"
3. Debería funcionar sin errores de permisos

## 🔍 Solución de Problemas

### Error persiste después de cambiar reglas

- Espera 1-2 minutos (las reglas pueden tardar en propagarse)
- Refresca la página
- Verifica que las reglas se publicaron correctamente

### Quiero más seguridad ahora

Si quieres implementar autenticación ahora mismo, puedo ayudarte a:
1. Configurar NextAuth con Firebase
2. Crear sistema de roles (admin/user)
3. Proteger las rutas de admin

---

**Nota:** Las reglas de desarrollo permiten que cualquiera escriba. Úsalas solo durante el desarrollo y cámbialas antes de ir a producción.
