# User Dashboard — Preparado para Klarna

Documentación del dashboard de usuario (Mi cuenta) y su alineación con Klarna Payments.

## Estructura

- **Perfil** (`/mi-cuenta/perfil`): firstName, lastName (requeridos), email (solo lectura), phone (opcional). Persistido en `users/{uid}`.
- **Direcciones** (`/mi-cuenta/direcciones`): Dirección de envío y de facturación. Opción "Usar la misma dirección para envío y facturación". Países en formato ISO-2 (ES, PT, FR, etc.).
- **Mis pedidos** (`/mi-cuenta/pedidos`): Lista de órdenes del usuario con estado y método de pago. Enlace a detalle en `/mi-cuenta/pedidos/[id]` (solo lectura, solo el dueño).

## Validación (zod + react-hook-form)

- **`src/lib/validations/schemas.ts`**:
  - `profileSchema`: firstName, lastName requeridos; phone opcional.
  - `addressSchema`: street, city, postalCode, country (ISO-2); street2, region opcionales.
  - `checkoutCustomerSchema`: datos de cliente en checkout (nombre, apellido, email, teléfono, dirección). Usado en checkout; no guarda datos financieros.

## Checkout

- Si el usuario está logueado, el checkout se prellena con:
  - Perfil: firstName, lastName, email, phone.
  - Dirección de envío por defecto (tipo `shipping` y `isDefault`), si existe.
- El checkout funciona aunque el usuario no tenga direcciones guardadas (puede rellenar manualmente).
- No se guardan datos financieros (tarjetas, etc.); el pago se delegará a Klarna.

## Firestore

- **Colección `users`**: documento por `uid` con `firstName`, `lastName`, `email`, `phone`, `addresses` (array de SavedAddress), `useSameAddressForBilling` (boolean), `updatedAt`.
- **SavedAddress**: `id`, `type` ("shipping" | "billing"), `street`, `street2?`, `postalCode`, `city`, `region?`, `country` (ISO-2), `isDefault`.

## Reglas

- No se toca el Admin Dashboard.
- Auth sin cambios (Firebase Auth existente).
- Código incremental; consistencia visual y arquitectónica con el resto de la app.
