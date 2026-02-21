# Reglas Firestore completas — producción

Copia y pega estas reglas en **Firebase Console** → **Firestore** → **Reglas** para dejar todo protegido.

Sustituye `amarusdesarrollo@gmail.com` por tu email de admin (el de `src/lib/auth-admin.ts`).

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función auxiliar: es el admin
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email.matches('(?i)amarusdesarrollo@gmail.com');
    }

    // Categorías: lectura pública, solo admin puede escribir
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Productos: lectura pública, solo admin puede escribir
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Órdenes: lectura solo dueño o admin; guest puede ver su confirmación; crear cualquiera (checkout); actualizar/borrar solo admin
    match /orders/{orderId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId
        || isAdmin()
        || (resource.data.userId == 'guest');
      allow create: if true;
      allow update, delete: if isAdmin();
    }

    // Config del sitio (envíos, contacto): lectura pública, solo admin puede escribir
    match /config/{documentId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Contenido CMS (historia, políticas, home, equipo, contacto): lectura pública, solo admin puede escribir
    match /content/{documentId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Miembros del equipo: lectura pública, solo admin puede escribir
    match /teamMembers/{memberId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Perfiles de usuario: cada uno lee/escribe el suyo; admin puede leer y bloquear a cualquiera
    match /users/{userId} {
      allow read: if request.auth != null
        && (request.auth.uid == userId || isAdmin());
      allow create, update: if request.auth != null
        && (request.auth.uid == userId || isAdmin());
      allow delete: if false;
    }
  }
}
```

## Nota sobre órdenes guest

Las órdenes con `userId == 'guest'` son legibles por cualquiera que tenga el ID del documento (p. ej. en la URL de confirmación). Los IDs son aleatorios y no se pueden enumerar fácilmente, así que se considera aceptable para la página de confirmación.
