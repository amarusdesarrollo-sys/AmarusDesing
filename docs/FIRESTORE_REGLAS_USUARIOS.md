# Reglas Firestore para bloqueo de usuarios

Para que el admin pueda bloquear usuarios, necesitas permitir que el email de administrador escriba en la colección `users` de otros usuarios.

En **Firebase Console** → **Firestore** → **Reglas**, asegúrate de tener algo como:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios: lectura/escritura propia + admin puede escribir en cualquiera
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null
        && (request.auth.uid == userId
            || request.auth.token.email.matches('(?i)amarusdesarrollo@gmail.com'));
      allow delete: if false; // No borrado físico
    }
    
    // ... resto de tus reglas (products, orders, etc.)
  }
}
```

Sustituye `amarusdesarrollo@gmail.com` por el email que usas en `src/lib/auth-admin.ts` (`ADMIN_EMAIL`).

El admin podrá entonces bloquear/desbloquear usuarios desde **Admin** → **Usuarios**.
