# 🔐 Configurar login de administrador

## Qué hace la protección

- Cualquier visita a `/admin` o `/admin/productos`, etc. (excepto `/admin/login`) requiere estar logueado.
- Solo el email de admin (por defecto **amarusdesign2014@gmail.com**, o el de `NEXT_PUBLIC_ADMIN_EMAIL` en Vercel) puede acceder al panel. Cualquier otro usuario que inicie sesión será desconectado y verá un mensaje de error.
- La contraseña la defines tú en Firebase (ver abajo).

## Crear el usuario administrador en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/) → tu proyecto.
2. Menú lateral → **Authentication** → pestaña **Sign-in method**.
3. Activa **Correo electrónico/Contraseña** (Email/Password) si no está activado.
4. Pestaña **Users** → **Add user**.
5. **Email:** `amarusdesign2014@gmail.com` (o el que tengas en `auth-admin.ts` / `NEXT_PUBLIC_ADMIN_EMAIL`)
6. **Contraseña:** la que quieras usar para entrar al admin (mínimo 6 caracteres).
7. Guarda.

## Cómo entrar al admin

1. Entra en tu web en `/admin` (o `/admin/login`).
2. Te redirigirá a la pantalla de login si no estás logueado.
3. Introduce el email de admin y la contraseña que creaste en Firebase.
4. Pulsa **Entrar**. Si todo es correcto, irás al panel de administración.

## Cambiar el email de administrador

Edita el archivo `src/lib/auth-admin.ts` y cambia la constante `ADMIN_EMAIL` al nuevo correo. El usuario debe existir en Firebase Authentication (creado como en los pasos de arriba).

## Cerrar sesión

En el panel admin, en el menú lateral abajo: **Cerrar sesión**. Volverás a la pantalla de login.
