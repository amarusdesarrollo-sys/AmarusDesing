# Stripe — Paso a paso

Integración de Stripe en Next.js + Firebase. Sin backend aparte: API Routes de Next.js + Firestore.

---

## Resumen del flujo

1. Usuario rellena checkout y pulsa "Pagar".
2. Se crea la orden en Firestore (estado `pending`, pago `pending`).
3. Se llama a una API Route que crea una **Stripe Checkout Session** y devuelve la URL.
4. El frontend redirige al usuario a la página de pago de Stripe (tarjeta, Klarna, etc.).
5. Tras pagar, Stripe redirige a tu página de confirmación.
6. Un **webhook** de Stripe avisa a tu API cuando el pago es correcto; entonces se marca la orden como pagada.

---

## Paso 1: Instalar Stripe

En la raíz del proyecto:

```bash
npm install stripe
```

---

## Paso 2: Variables de entorno

En `.env.local` (y en Vercel cuando despliegues) añade:

```env
# Clave secreta (Dashboard → Developers → API keys). NUNCA en el cliente.
STRIPE_SECRET_KEY=sk_test_...

# Para el webhook (lo obtienes al crear el webhook en Dashboard).
STRIPE_WEBHOOK_SECRET=whsec_...
```

- **Test:** usa `sk_test_...` y crea el webhook en modo test para obtener `whsec_...`.
- **Producción:** `sk_live_...` y el `whsec_...` del webhook en vivo.

---

## Paso 3: API Route — Crear sesión de Checkout

Crear `src/app/api/create-checkout-session/route.ts`.

- Recibe por POST: `orderId` (y opcionalmente la URL base de tu sitio).
- Lee la orden de Firestore por `orderId` (total en céntimos, moneda).
- Crea una [Checkout Session](https://docs.stripe.com/api/checkout/sessions/create) con:
  - `mode: "payment"`
  - `line_items`: un solo ítem “Pedido #orderId” con amount = total de la orden (en céntimos) y currency (ej. `eur`).
  - `success_url`: `{baseUrl}/checkout/confirmacion?orderId={orderId}`
  - `cancel_url`: `{baseUrl}/checkout` (o carrito).
  - `metadata`: `{ orderId }` para el webhook.
  - Opcional: `customer_email` para prellenar en Stripe.
- Responde con `{ url: session.url }` para que el frontend redirija.

La clave secreta se usa solo en esta ruta (servidor).

---

## Paso 4: Checkout en el frontend

En `src/app/checkout/page.tsx` (donde ahora creas la orden y rediriges a confirmación):

1. Mantener: validar formulario, crear la orden en Firestore con `createOrder()` (igual que ahora). Guardar el `orderId` devuelto.
2. En lugar de `router.push(/checkout/confirmacion?orderId=...)`:
   - Llamar a `POST /api/create-checkout-session` con `{ orderId }` (y si quieres la base URL).
   - Si la respuesta trae `url`, hacer `window.location.href = url` (redirige a Stripe).
   - Si hay error, mostrar mensaje y no vaciar el carrito.
3. El carrito se puede vaciar cuando el usuario llega a la página de **confirmación** (como ahora), no antes de ir a Stripe.

Así el usuario solo llega a tu confirmación después de pasar por Stripe (o si cancelan, vuelven a checkout/carrito).

---

## Paso 5: Página de confirmación

La ruta actual `/checkout/confirmacion?orderId=...` puede quedarse igual:

- Muestra “Pedido recibido” y el detalle de la orden.
- Vacía el carrito al cargar (como ahora).

El estado “pagado” se actualizará vía webhook; en la confirmación puedes seguir mostrando “Pedido recibido” aunque el webhook llegue un poco después. Si quieres, más adelante puedes mostrar un badge “Pago confirmado” cuando `paymentStatus === "paid"`.

---

## Paso 6: Webhook de Stripe

Crear `src/app/api/webhooks/stripe/route.ts`.

- Stripe envía eventos con método POST a esta URL.
- **Importante:** no usar `bodyParser` por defecto; leer el body como stream/buffer para verificar la firma.
- Obtener el header `Stripe-Signature` y el body raw.
- Verificar con `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`.
- Si el evento es `checkout.session.completed`:
  - Leer `metadata.orderId`.
  - Actualizar en Firestore la orden `orderId`: `paymentStatus: "paid"` (y si quieres `status: "confirmed"`).
- Responder con 200 para que Stripe no reintente.

En local, usar [Stripe CLI](https://docs.stripe.com/stripe-cli) para reenviar eventos a `http://localhost:3000/api/webhooks/stripe`:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Ese comando te dará un `whsec_...` temporal para `.env.local`.

---

## Paso 7: Activar Klarna (opcional)

En el [Dashboard de Stripe](https://dashboard.stripe.com): **Settings → Payment methods** y activar **Klarna** para el país/moneda que uses (ej. España, EUR). En Checkout, Stripe mostrará Klarna automáticamente si está disponible.

---

## Orden recomendado de implementación

| # | Tarea | Estado |
|---|--------|--------|
| 1 | `npm install stripe` | ✅ Hecho |
| 2 | Añadir `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` a `.env.local` | Pendiente (cuando tengas claves) |
| 3 | `src/app/api/create-checkout-session/route.ts` | ✅ Hecho |
| 4 | Checkout modificado: crear orden → API → redirigir a Stripe | ✅ Hecho |
| 5 | `src/app/api/webhooks/stripe/route.ts` | ✅ Hecho |
| 6 | Probar: añadir claves, pagar con 4242 4242 4242 4242 | Pendiente |
| 7 | En local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` | Para probar webhook |
| 8 | En producción: configurar webhook en Dashboard, `sk_live_`, `whsec_` | Go live |

## Cuando tengas las claves

1. Añade a `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
2. En local, ejecuta en otra terminal: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (te dará un `whsec_` temporal).
3. Prueba un pedido: añade producto al carrito, checkout, "Ir a pagar (Stripe)", usa tarjeta test 4242 4242 4242 4242.
