# Revisión pre-producción – AmarusDesign

Resumen de lo revisado, **correcciones ya aplicadas** y **recomendaciones** para producción.

---

## ✅ Correcciones ya aplicadas en el código

### 1. Checkout – Origen de redirección (seguridad)
- **Problema:** La API `create-checkout-session` aceptaba `baseUrl` desde el cliente para `success_url` y `cancel_url`. Un atacante podría enviar un dominio propio y redirigir al usuario tras el pago (phishing).
- **Solución:** El origen se toma **solo** de `NEXT_PUBLIC_SITE_URL` en el servidor. El cuerpo del POST sigue pudiendo llevar `baseUrl` pero la API lo ignora.
- **Qué hacer en producción:** Configura `NEXT_PUBLIC_SITE_URL` en Vercel (ej. `https://amarusdesign.com`).

### 2. Upload de imágenes – Validaciones
- **Problema:** Cualquiera podía llamar a `/api/upload-image` y subir archivos sin límite de tamaño ni tipo.
- **Solución aplicada:**
  - Límite de **5 MB** por archivo.
  - Solo tipos **image/jpeg, image/png, image/webp, image/gif**.
  - Carpeta permitida solo entre: `categories`, `products`, `team` (no se acepta cualquier string).
- **Pendiente (recomendado):** Proteger la ruta para que solo usuarios admin puedan subir. Ver sección “APIs sin protección” más abajo.

### 3. Init-categories
- **Problema:** Cualquiera puede llamar a `POST /api/init-categories` y crear las categorías iniciales si la colección está vacía.
- **Impacto:** Bajo (solo crea datos por defecto una vez), pero es mejor restringirlo a admin. Ver “APIs sin protección”.

---

## APIs protegidas (opcional)

Estas rutas tienen **validaciones** (tamaño, tipo, carpeta) y **protección por token** cuando está configurada la cuenta de servicio de Firebase:

| Ruta | Validaciones | Protección |
|------|--------------|------------|
| `POST /api/upload-image` | Máx 5 MB, solo imágenes, carpetas: categories/products/team | Si `FIREBASE_SERVICE_ACCOUNT_KEY` está definida, exige token de admin. |
| `POST /api/init-categories` | — | Si `FIREBASE_SERVICE_ACCOUNT_KEY` está definida, exige token de admin. |

Si **no** defines `FIREBASE_SERVICE_ACCOUNT_KEY`, cualquiera puede llamarlas (comportamiento actual). Para activar la protección en producción, añade en Vercel la variable con el JSON de la cuenta de servicio de Firebase.

---

## ✅ Lo que está bien

- **Webhook Stripe:** Firma verificada con `STRIPE_WEBHOOK_SECRET`; el body se lee como texto. Correcto.
- **Firestore:** Reglas documentadas en `docs/FIRESTORE_REGLAS_COMPLETAS.md`. Órdenes con `read: if true` para que la API de checkout (sin auth) pueda leer por `orderId`. Asegúrate de tenerlas desplegadas en Firebase.
- **Variables de entorno:** Claves secretas (`STRIPE_SECRET_KEY`, `CLOUDINARY_URL`, `RESEND_API_KEY`, etc.) sin `NEXT_PUBLIC_`; no se exponen al cliente.
- **No hay `dangerouslySetInnerHTML` ni `eval`** en el código revisado; menor riesgo de XSS por contenido dinámico.
- **Admin:** El layout de `/admin` comprueba Firebase Auth y `isAdminEmail()`. Las páginas del panel están protegidas en el cliente. Las APIs de upload e init-categories aceptan token de admin cuando está configurada `FIREBASE_SERVICE_ACCOUNT_KEY`.
- **robots.txt:** Desautoriza `/admin/`, `/api/`, `/checkout/`, `/mi-cuenta/`, `/login`, `/registro`. Correcto para no indexar rutas sensibles.

---

## 📋 Checklist rápido antes de producción

- [ ] **Vercel:** `NEXT_PUBLIC_SITE_URL` = URL real (ej. `https://amarusdesign.com`).
- [ ] **Vercel:** `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` (modo live si ya no usas pruebas).
- [ ] **Vercel:** Variables de Cloudinary y Resend configuradas.
- [ ] **Firebase:** Reglas de Firestore desplegadas (según `docs/FIRESTORE_REGLAS_COMPLETAS.md`).
- [ ] **Stripe:** En producción, webhook apuntando a `https://tudominio.com/api/webhooks/stripe` y `STRIPE_WEBHOOK_SECRET` actualizado.
- [ ] **Admin:** Email en `src/lib/auth-admin.ts` (o variable que uses) coincide con el que usas para iniciar sesión en el panel.
- [ ] **Admin (opcional pero recomendado):** Para que solo el admin pueda subir imágenes y usar “Inicializar categorías”, en Firebase Console genera una clave de cuenta de servicio y en Vercel añade la variable `FIREBASE_SERVICE_ACCOUNT_KEY` con el JSON completo. Instala `firebase-admin` (`npm install firebase-admin`) si no está ya. Ver `docs/REVISION_PRODUCCION.md`.

---

## Resumen

- **Checkout:** Corregido para no confiar en `baseUrl` del cliente.
- **Upload-image:** Validaciones de tamaño, tipo y carpeta aplicadas; protección por token opcional (variable `FIREBASE_SERVICE_ACCOUNT_KEY`).
- **Init-categories:** Protección por token opcional (misma variable). Sin la variable, las rutas siguen abiertas.
- **Resto:** Flujo de pago, webhook, Firestore y uso de env están coherentes con un despliegue en producción. Con el checklist y, si aplicas la variable de cuenta de servicio, el proyecto queda listo para producción.
