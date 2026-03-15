# Guía de la web AmarusDesign  
## Para el equipo de AmarusDesign

---

**Documento de entrega y uso de la tienda online**  
*Versión 1.0 — [Fecha]*

---

## 1. Resumen: qué es esta web

La web de **AmarusDesign** es una **tienda online** donde vuestros clientes pueden:

- Ver vuestros productos (joyería artesanal, minerales, macramé, etc.).
- Navegar por categorías.
- Añadir productos al carrito y comprar con tarjeta (Stripe) o Klarna.
- Recibir un email de confirmación tras el pedido.
- Consultar la información de la empresa: equipo, historia, políticas, contacto.

Vosotros tenéis un **panel de administración** (solo para el email de admin) para gestionar productos, categorías, pedidos y los textos de la web (historia, políticas, equipo, etc.) sin tocar código.

---

## 2. Parte pública (lo que ve el cliente)

### 2.1 Inicio
- **Categorías destacadas:** secciones grandes con imagen y botón “Descubrir más” (las que marquéis como “Destacada” en el admin).
- **Proyecto familiar:** texto e imagen editables desde el admin (Contenido → Home).
- **Historia:** título “AMARUSDESIGN” sobre imagen y texto de la historia (admin → Contenido → Historia).
- **Suscripción:** formulario para captar emails (podéis conectar después un servicio de newsletter si lo usáis).

### 2.2 Navegación
- **Inicio** → Página principal.
- **Tienda Online** → Desplegable con “Ver todas las categorías” y cada categoría. Al hacer clic van a la lista de productos de esa categoría.
- **Equipo** → Miembros del equipo (admin → Contenido → Equipo).
- **Historia** → Misma sección que en el inicio.
- **Políticas** → Textos legales (admin → Contenido → Políticas).
- **Contacto** → Formulario y datos (admin → Contenido → Contacto).
- **Buscar** → Búsqueda de productos.
- **Carrito** e **Iniciar sesión / Mi cuenta** (si el cliente se registra).

### 2.3 Tienda y categorías
- **Tienda Online** muestra todas las categorías activas.
- Cada **categoría** (`/categorias/nombre-categoria`) muestra los productos de esa categoría.
- Los productos se pueden filtrar y ordenar; al hacer clic en uno se abre su **ficha de producto** (imagen, precio, descripción, añadir al carrito).

### 2.4 Carrito y checkout
- El cliente añade productos al **carrito** (se guarda en el navegador).
- En **Checkout** rellena datos de envío y pago.
- El pago se hace con **Stripe** (tarjeta o Klarna); es seguro y cumple normativa.
- Tras el pago:
  - El cliente recibe un **email de confirmación**.
  - Vosotros recibís un **email de aviso** con el detalle del pedido y enlace al panel de administración.

---

## 3. Panel de administración

**URL:** `vuestra-web.com/admin`  
**Acceso:** solo con el email configurado como admin (actualmente el que está en el sistema).

### 3.1 Resumen (Dashboard)
- Vista general: pedidos recientes, enlaces rápidos a productos, categorías y pedidos.

### 3.2 Pedidos
- **Listado de pedidos** con estado (pendiente de pago, pagado, etc.).
- Al hacer clic en un pedido: detalle (cliente, dirección, productos, total).
- Cuando el cliente paga con Stripe, el pedido pasa a “Pagado” y se descuenta el stock automáticamente.

### 3.3 Productos
- **Listar** todos los productos.
- **Crear producto:** nombre, descripción, precio, categoría, stock, imágenes (subidas a Cloudinary), destacado, etc.
- **Editar** o **eliminar** productos.
- Las imágenes se suben desde el propio formulario; se guardan en Cloudinary.

### 3.4 Categorías
- **Listar** categorías.
- **Crear categoría:** nombre, slug (URL), descripción, imagen, orden, activa, destacada.
- **Editar** o **desactivar** categorías.
- **“Inicializar categorías”:** si en algún momento no hay categorías, este botón crea las categorías por defecto (solo hace falta usarlo una vez si la base está vacía).

### 3.5 Contenido (CMS)
- **Home:** textos e imágenes de la sección “Proyecto familiar” y bloques de la home.
- **Historia:** título y párrafos de la sección Historia.
- **Políticas:** textos de políticas de envío, devoluciones, etc.
- **Equipo:** miembros del equipo (nombre, rol, imagen, texto).
- **Contacto:** textos y datos que se muestran en la página de contacto.

### 3.6 Configuración
- Opciones generales del sitio (según lo que esté implementado: envíos, datos de contacto, etc.).

### 3.7 Usuarios (si está activo)
- Listado de usuarios registrados; posibilidad de bloquear si hubiera abusos.

---

## 4. Pagos y emails

- **Pagos:** Stripe (tarjeta y Klarna). Los cobros y devoluciones se gestionan desde el dashboard de Stripe.
- **Confirmación al cliente:** email automático al completar el pago (vía Resend).
- **Aviso a vosotros:** email al admin con el resumen del pedido y enlace a `admin/pedidos/[id]`.

Si cambiáis el email de notificación de pedidos, se puede configurar en la variable de entorno `ADMIN_NOTIFY_EMAIL` en el servidor (Vercel).

---

## 5. Imágenes y datos

- **Imágenes de productos y categorías:** se suben desde el panel de administración y se almacenan en **Cloudinary** (servicio externo, sin ocupar espacio en vuestro hosting).
- **Datos de productos, categorías, pedidos y contenido:** en **Firebase (Firestore)**. Solo son editables desde el panel de administración (o por vosotros si tenéis acceso técnico).

---

## 6. Consejos rápidos para el día a día

1. **Añadir un producto nuevo:** Admin → Productos → Crear producto → rellenar campos y subir imagen(s) → Guardar.
2. **Cambiar un texto de la web:** Admin → Contenido → elegir sección (Home, Historia, Políticas, etc.) → editar y guardar.
3. **Ver pedidos:** Admin → Pedidos. Los pagados aparecen ya con estado “Pagado” y stock descontado.
4. **Añadir o quitar una categoría:** Admin → Categorías → Crear / Editar / Activar o desactivar.
5. **Cambiar la imagen o el texto del equipo:** Admin → Contenido → Equipo.

---

## 7. Soporte técnico y mantenimiento

Para cambios que no podáis hacer desde el panel (dominio, diseño, nuevas funcionalidades, problemas con Stripe/Firebase/emails), contactad con la desarrolladora que os ha entregado el proyecto.  
La documentación técnica del proyecto está en la carpeta `docs/` del repositorio (incluye configuración de Vercel, Firebase, Stripe, Cloudinary y Resend).

---

*Documento preparado para la entrega del proyecto AmarusDesign. Si algo no coincide con vuestra web (por ejemplo alguna sección desactivada), la desarrolladora os puede indicar exactamente qué está activo en vuestra instalación.*
