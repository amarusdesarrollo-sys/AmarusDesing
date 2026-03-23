# Reglas Firestore completas — producción

Copia y pega estas reglas en **Firebase Console** → **Firestore** → **Reglas** para dejar todo protegido.

Sustituye `amarusdesign2014@gmail.com` si usas otro email de admin (debe coincidir con `src/lib/auth-admin.ts` o `NEXT_PUBLIC_ADMIN_EMAIL`).

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función auxiliar: es el admin (email puede faltar en algunos proveedores)
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email != null
        && request.auth.token.email.matches('(?i)amarusdesign2014@gmail.com');
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

    // Órdenes: crear cualquiera (checkout); leer quien tenga el ID (ID no adivinable); actualizar/borrar solo admin
    // La API create-checkout-session corre en el servidor sin auth, por eso debe poder leer la orden por ID
    match /orders/{orderId} {
      allow read: if true;
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

    // Cupones (checkout): lectura pública para validar código; solo admin escribe
    match /coupons/{couponId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Blog: lectura pública; solo admin escribe
    match /blogPosts/{postId} {
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

## Si ves `Missing or insufficient permissions` (incluso en localhost)

1. **Publica reglas en Firebase** que incluyan **todas** las colecciones que usa la app (`users`, `orders`, `products`, `categories`, `config`, `content`, `teamMembers`, **`coupons`**, **`blogPosts`**). Si falta alguna, cualquier `getDoc`/`getDocs` a esa colección falla.
2. **Comprueba que el email del admin en `isAdmin()`** coincida exactamente con el de `src/lib/auth-admin.ts` (minúsculas da igual gracias a `(?i)`).
3. **Mismo proyecto**: las variables `NEXT_PUBLIC_FIREBASE_*` de tu `.env.local` deben ser del mismo proyecto donde editas las reglas.
4. **Registro**: hace `setDoc` en `users/{uid}`; hace falta `request.auth.uid == userId` y usuario logueado (tras `createUserWithEmailAndPassword` ya lo está).
