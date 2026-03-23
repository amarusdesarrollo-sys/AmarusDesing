# Qué te queda por hacer — AmarusDesign

Lista concreta de pasos en **Vercel**, **Firebase**, **Stripe**, **Cloudinary** y **Resend**. Marca cada ítem cuando lo tengas.

---

## 1. Vercel (variables de entorno)

En **Vercel** → tu proyecto → **Settings** → **Environment Variables** añade estas variables. Usa **Production** (y si quieres también Preview) para todas.

### Obligatorias

| Variable | Dónde sacarla | Ejemplo |
|----------|----------------|--------|
| `NEXT_PUBLIC_SITE_URL` | Tu dominio en producción | `https://amarusdesign.com` (o la URL que te dé Vercel si aún no tienes dominio) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Configuración del proyecto → General | `AIza...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Mismo sitio | `tu-proyecto.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Mismo sitio | `tu-proyecto` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Mismo sitio | Número |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Mismo sitio | `1:123...:web:...` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Mismo sitio (opcional para Analytics) | `G-XXXX` |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys | `sk_live_...` (producción) o `sk_test_...` (pruebas) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks (ver punto 3) | `whsec_...` |
| `CLOUDINARY_URL` **o** las 3 por separado | Cloudinary Dashboard → Settings → API Keys | Ver sección 4 |
| `RESEND_API_KEY` | resend.com → API Keys | `re_...` |

### Opcionales

| Variable | Para qué |
|----------|----------|
| `EMAIL_FROM` | Remitente de los emails (ej. `pedidos@amarusdesign.com`). Si no la pones, Resend usa `onboarding@resend.dev`. |
| `ADMIN_NOTIFY_EMAIL` | Email donde recibir el aviso de “nuevo pedido”. Si no la pones, se usa el de `src/lib/auth-admin.ts`. |
| `NEXT_PUBLIC_GA_ID` | Si usas Google Analytics. |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Para que solo el admin pueda subir imágenes y usar “Inicializar categorías”. Ver sección 5. |

---

## 2. Firebase

### 2.1 Reglas de Firestore (obligatorio)

1. Entra en **Firebase Console** → tu proyecto → **Firestore Database** → pestaña **Reglas**.
2. Abre en tu repo el archivo **`docs/FIRESTORE_REGLAS_COMPLETAS.md`**.
3. Copia todo el bloque de reglas (desde `rules_version` hasta el cierre `}`).
4. En la regla, el `matches('(?i)...')` debe ser el **mismo email con el que entras al panel admin** (`src/lib/auth-admin.ts` o `NEXT_PUBLIC_ADMIN_EMAIL`). El ejemplo en `docs/FIRESTORE_REGLAS_COMPLETAS.md` usa `amarusdesign2014@gmail.com`.
5. Pega en la consola de Firebase y pulsa **Publicar**.

Así la base de datos queda protegida: solo ese email puede crear/editar categorías, productos, contenido, etc.; el resto solo puede leer y crear órdenes (checkout).

### 2.2 Cuenta de servicio (opcional — para proteger subida de imágenes)

Solo si quieres que **solo el admin** pueda subir imágenes y usar “Inicializar categorías” desde el panel:

1. Firebase Console → **Configuración del proyecto** (engranaje) → **Cuentas de servicio**.
2. **Generar nueva clave privada** (o usar la que ya tengas).
3. Se descarga un JSON. **No lo subas al repo.**  
4. En Vercel, crea una variable **`FIREBASE_SERVICE_ACCOUNT_KEY`** y pega **todo el contenido del JSON** como valor (una sola línea, entre comillas si hace falta).
5. Redeploy para que coja la variable.

Si no pones esta variable, la web funciona igual; solo que cualquiera podría llamar a las APIs de subir imagen e inicializar categorías (el panel ya está protegido por login).

---

## 3. Stripe

### Webhook en producción

1. **Stripe Dashboard** → **Developers** → **Webhooks** → **Add endpoint**.
2. **Endpoint URL:** `https://tu-dominio.com/api/webhooks/stripe` (sustituye por tu URL real de Vercel).
3. Eventos: marca al menos **`checkout.session.completed`**.
4. Al crear el endpoint, Stripe te muestra **Signing secret** (`whsec_...`). Cópialo.
5. En **Vercel**, pon esa clave en la variable **`STRIPE_WEBHOOK_SECRET`** (y redeploy si ya tenías otra).

Sin este paso, los pagos se cobran pero la orden en Firestore no se marcará como “pagada” y no se descontará stock ni se enviarán los emails de confirmación.

---

## 4. Cloudinary

Tienes dos formas de configurarlo en Vercel:

**Opción A (recomendada):** Una sola variable  
- **`CLOUDINARY_URL`** = algo tipo `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`  
- Lo sacas de Cloudinary Dashboard → **Settings** → **API Keys** (ahí ves Cloud name, API Key, API Secret). El formato es: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`.

**Opción B:** Tres variables  
- **`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`** = tu cloud name (puede ser público).  
- **`CLOUDINARY_API_KEY`** y **`CLOUDINARY_API_SECRET`** = las claves del Dashboard (solo en servidor, no las pongas con `NEXT_PUBLIC_`).

Con una de las dos opciones (A o B) es suficiente.

---

## 5. Resend (emails)

1. Entra en **resend.com** y crea una API Key en **API Keys**.
2. En Vercel pon **`RESEND_API_KEY`** = esa clave.
3. (Opcional) Si verificas un dominio en Resend, puedes poner **`EMAIL_FROM`** (ej. `pedidos@amarusdesign.com`) y **`ADMIN_NOTIFY_EMAIL`** para el aviso de nuevos pedidos.

---

## 6. Resumen rápido

- **Vercel:** Todas las variables de la tabla (Firebase, Stripe, Cloudinary, Resend, `NEXT_PUBLIC_SITE_URL`).
- **Firebase:** Publicar reglas de Firestore (y opcionalmente crear cuenta de servicio y `FIREBASE_SERVICE_ACCOUNT_KEY`).
- **Stripe:** Crear webhook con la URL de tu sitio y copiar el **Signing secret** a `STRIPE_WEBHOOK_SECRET`.
- **Cloudinary:** `CLOUDINARY_URL` (o las 3 variables).
- **Resend:** `RESEND_API_KEY` (y opcionalmente `EMAIL_FROM` / `ADMIN_NOTIFY_EMAIL`).

Cuando todo esté marcado, haz un deploy en Vercel y prueba: login admin, un pedido de prueba con tarjeta de test si sigues en modo test de Stripe, y que te llegue el email de confirmación y el aviso al admin.
