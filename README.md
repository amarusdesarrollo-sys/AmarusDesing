# AmarusDesign

E-commerce de joyería artesanal, minerales y macramé. Next.js 15, Firebase (Auth + Firestore), Stripe, Cloudinary y Resend.

## Cómo arrancar

```bash
npm install
cp .env.example .env.local   # Rellenar variables
npm run dev
```

## Scripts

| Comando | Uso |
|--------|-----|
| `npm run dev` | Desarrollo (localhost:3000) |
| `npm run build` | Build de producción |
| `npm run start` | Servir build |
| `npm run optimize:images` | Convertir imágenes a AVIF (scripts/) |

## Stack

- **Front:** Next.js 15, React 19, Tailwind CSS, Framer Motion
- **Backend / datos:** Firebase (Auth, Firestore)
- **Pagos:** Stripe (Checkout + webhook)
- **Imágenes:** Cloudinary
- **Emails:** Resend (confirmación pedido, aviso admin)

## Documentación

En la carpeta **`docs/`**:

| Archivo | Contenido |
|---------|-----------|
| [QUE_TE_QUEDA_POR_HACER.md](docs/QUE_TE_QUEDA_POR_HACER.md) | Checklist producción (Vercel, Firebase, Stripe, etc.) |
| [REVISION_PRODUCCION.md](docs/REVISION_PRODUCCION.md) | Revisión de seguridad y correcciones aplicadas |
| [FIRESTORE_REGLAS_COMPLETAS.md](docs/FIRESTORE_REGLAS_COMPLETAS.md) | Reglas de Firestore para copiar en la consola |
| [CLOUDINARY_SETUP.md](docs/CLOUDINARY_SETUP.md) | Configuración Cloudinary |
| [STRIPE_PASO_A_PASO.md](docs/STRIPE_PASO_A_PASO.md) | Configuración Stripe y webhook |
| [CONFIGURAR_VARIABLES_VERCEL.md](docs/CONFIGURAR_VARIABLES_VERCEL.md) | Variables de entorno en Vercel |
| [CONFIGURAR_ADMIN_LOGIN.md](docs/CONFIGURAR_ADMIN_LOGIN.md) | Acceso al panel de administración |
| [KLARNA_INTEGRATION.md](docs/KLARNA_INTEGRATION.md) | Integración Klarna |
| [CATEGORIAS_DINAMICAS.md](docs/CATEGORIAS_DINAMICAS.md) | Categorías dinámicas desde Firestore |
| [CREAR_INDICE_FIRESTORE.md](docs/CREAR_INDICE_FIRESTORE.md) | Índices Firestore |
| [IMAGE_OPTIMIZATION.md](docs/IMAGE_OPTIMIZATION.md) | Optimización de imágenes |

## Estructura principal

```
src/
├── app/              # Rutas Next.js (App Router)
│   ├── admin/        # Panel de administración
│   ├── api/          # API routes (Stripe, upload, init-categories)
│   ├── categorias/   # Páginas dinámicas por categoría
│   ├── productos/    # Detalle de producto
│   ├── checkout/     # Carrito y pago
│   └── ...
├── components/
├── lib/              # Firebase, Cloudinary, email, validaciones, SEO
├── store/            # Zustand (carrito)
└── types/
```

## Licencia

Proyecto privado.
