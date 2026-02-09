# Integración Klarna (España) — Referencia

Este documento describe cómo el modelo actual de checkout y órdenes mapea a lo que Klarna espera, para cuando implementes la pasarela.

## Mapeo de datos actual → Klarna

### Destinatario (order / form)

| Klarna        | Nuestro modelo             | Notas                     |
| ------------- | -------------------------- | ------------------------- |
| `given_name`  | `order.customerGivenName`  | Nombre                    |
| `family_name` | `order.customerFamilyName` | Apellidos                 |
| `email`       | `order.customerEmail`      |                           |
| `phone`       | `order.customerPhone`      | Guardar con prefijo (+34) |

### Dirección de envío

| Klarna            | Nuestro modelo               | Notas                    |
| ----------------- | ---------------------------- | ------------------------ |
| `street_address`  | `shippingAddress.street`     | Calle y número           |
| `street_address2` | `shippingAddress.street2`    | Piso / puerta (opcional) |
| `postal_code`     | `shippingAddress.postalCode` | String, no number        |
| `city`            | `shippingAddress.city`       |                          |
| `region`          | `shippingAddress.state`      | Provincia                |
| `country`         | `shippingAddress.country`    | Siempre `"ES"` para ES   |

### Shipping info (objeto de envío para Klarna)

Klarna espera un objeto con:

- `name`: ej. `"Envío estándar"` → ya guardamos `order.shippingOptionName`
- `price`: en **céntimos** (envío gratis = 0) → `order.shipping`
- `tax_rate`: ej. 2100 (21%)
- `total_amount` / `total_tax_amount` según su API

### Billing

Para España puedes enviar el mismo bloque que shipping:

`billing_address: { ...shipping_address }`

## Lo que no pedimos (y no hace falta)

- DNI / NIE
- Fecha de nacimiento
- Género

Klarna no los exige y evita temas GDPR.

## Buenas prácticas ya aplicadas

- Importes en **céntimos** en toda la app (order.total, order.shipping, item.price).
- CP y teléfono como **string** (no number).
- País España como **"ES"** (select en checkout).
- Nombre y apellidos por separado (`customerGivenName`, `customerFamilyName`).
- Campo opcional piso/puerta (`street2`).

## Perfil de usuario (dashboard futuro)

En `src/types/index.ts` está definido:

- **`SavedAddress`**: `id`, `type` (shipping/billing), `street`, `street2`, `postalCode`, `city`, `region`, `country`, `isDefault`.
- **`User`**: `addresses?: SavedAddress[]`, `lastName`, `phone`.

Estructura sugerida en Firestore (cuando implementes dashboard usuario):

```
users/{uid}
  name: "Juan"
  lastName: "Pérez"
  email: "juan@email.com"
  phone: "+34600111222"
  addresses: [
    {
      id: "home",
      type: "shipping",
      street: "Calle Mayor 123",
      street2: "3º B",
      postalCode: "28013",
      city: "Madrid",
      region: "Madrid",
      country: "ES",
      isDefault: true
    }
  ]
```

Con esto el mapeo a Klarna desde el perfil será 1:1.

## Testing Klarna

- Si falta teléfono o el CP no cuadra con la ciudad, Klarna puede fallar.
- En sandbox el comportamiento a veces es impredecible; en producción validan más.
- Mantener IVA/tax_rate consistente (ej. 21% = 2100 en su formato).
