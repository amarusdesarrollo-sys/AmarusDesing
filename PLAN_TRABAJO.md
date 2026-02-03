# 📅 PLAN DE TRABAJO - AMARUSDESIGN E-COMMERCE

## 🎯 ESTADO ACTUAL

### ✅ COMPLETADO

- Home page con animaciones
- Navbar y Footer
- Tipos TypeScript definidos
- Estructura base del proyecto
- Páginas: contacto, equipo, políticas, tienda-online (solo categorías)

### ❌ FALTANTE PRINCIPAL

- Sistema de productos (base de datos)
- Carrito de compras
- Páginas de categorías con productos
- Detalle de producto
- Checkout
- Dashboards (Admin y Usuario)
- Autenticación
- Pasarela de pagos (pendiente decisión)

---

## 📋 PLAN POR DÍAS

### 🔵 DÍA 1: FUNDACIÓN - SISTEMA DE PRODUCTOS Y CARrito

#### Mañana (4-5 horas)

1. **Store de Zustand para el carrito**

   - Crear `src/store/cartStore.ts`
   - Funciones: addItem, removeItem, updateQuantity, clearCart
   - Persistencia con localStorage
   - Tipo: CartItem con Product completo

2. **Store de productos (mock data inicial)**

   - Crear `src/store/productsStore.ts`
   - Mock data de productos (2-3 por categoría para testing)
   - Funciones: getProductsByCategory, getProductById
   - Estructura según tipos ya definidos

3. **Componente CartIcon**
   - Mostrar cantidad de items en navbar
   - Click abre sidebar o página de carrito

#### Tarde (3-4 horas)

4. **Página Carrito (`/carrito`)**
   - Listado de productos en carrito
   - Modificar cantidades
   - Eliminar productos
   - Cálculo de totales (subtotal, envío, total)
   - Botón "Proceder al checkout"
   - Carrito vacío state

**Resultado del día:** Carrito funcional completo con mock data

---

### 🟢 DÍA 2: PÁGINAS DE CATEGORÍAS Y DETALLE

#### Mañana (4-5 horas)

5. **Páginas de categorías (6 páginas)**

   - Crear estructura: `/joyeria-artesanal`, `/minerales-del-mundo`, etc.
   - Componente `ProductCard` reutilizable
   - Grid responsive de productos
   - Filtros básicos (precio, disponibilidad)
   - Paginación o infinite scroll
   - Loading states

6. **Integración con Firebase (Firestore)**
   - Estructura de colección `products`
   - Funciones CRUD básicas en `src/lib/firebase/products.ts`
   - Migrar mock data a Firebase (manual o script)

#### Tarde (3-4 horas)

7. **Página detalle de producto (`/productos/[id]`)**
   - Galería de imágenes (principal + thumbnails)
   - Información completa del producto
   - Botón "Agregar al carrito"
   - Selector de variantes (si aplica)
   - Descripción expandible
   - Breadcrumbs
   - Productos relacionados

**Resultado del día:** Navegación completa de productos funcionando

---

### 🟡 DÍA 3: CHECKOUT Y PAGOS

#### Mañana (4-5 horas)

8. **Página Checkout (`/checkout`)**

   - Paso 1: Información de envío
   - Paso 2: Método de envío (estándar/express)
   - Paso 3: Método de pago (preparado, sin integración real aún)
   - Resumen del pedido
   - Validación de formularios (react-hook-form + zod)
   - Cálculo de costos (envío, impuestos si aplica)

9. **Integración con Firebase para órdenes**
   - Colección `orders` en Firestore
   - Crear orden al completar checkout
   - Estados de orden: pending, confirmed, etc.

#### Tarde (3-4 horas)

10. **Página confirmación (`/checkout/confirmacion`)**

    - Número de orden
    - Resumen de compra
    - Información de envío
    - Botón "Ver mis pedidos" (lleva a dashboard usuario)

11. **Decisión pasarela de pagos**
    - **Opciones recomendadas:**
      - **Mercado Pago** (Argentina, fácil integración)
      - **Stripe** (Internacional, robusto)
      - **PayPal** (Internacional, conocido)
    - Implementar estructura base (sin procesamiento real aún)
    - Mock de éxito/fallo para testing

**Resultado del día:** Flujo completo de compra (sin pago real)

---

### 🟣 DÍA 4: AUTENTICACIÓN Y DASHBOARD USUARIO

#### Mañana (4-5 horas)

12. **Sistema de autenticación**

    - Integrar NextAuth con Firebase Auth
    - Páginas: `/login`, `/registro`
    - Protección de rutas (middleware)
    - Recuperación de contraseña
    - Autenticación con email/password

13. **Dashboard Usuario (`/dashboard` o `/mi-cuenta`)**
    - Perfil de usuario (editar datos)
    - Direcciones guardadas (múltiples)
    - Historial de pedidos (listado)
    - Detalle de pedido individual
    - Estado de envío (tracking si está disponible)

#### Tarde (3-4 horas)

14. **Mejoras adicionales dashboard**
    - Wishlist/Favoritos (opcional, si hay tiempo)
    - Preferencias de usuario
    - Newsletter (suscripción desde dashboard)

**Resultado del día:** Usuarios pueden registrarse, iniciar sesión y ver sus pedidos

---

### 🔴 DÍA 5: DASHBOARD ADMINISTRADOR

#### Mañana (4-5 horas)

15. **Sistema de roles**

    - Agregar campo `role` a usuarios (admin/user)
    - Middleware para proteger rutas admin
    - Verificación en cliente y servidor

16. **Dashboard Admin (`/admin`)**
    - Overview: estadísticas generales (total ventas, pedidos, etc.)
    - Panel de navegación (sidebar o tabs)
    - Protección de ruta (solo admins)

#### Tarde (4-5 horas)

17. **Gestión de productos (Admin)**

    - Listado de productos (`/admin/productos`)
    - Crear producto (`/admin/productos/nuevo`)
    - Editar producto (`/admin/productos/[id]/editar`)
    - Eliminar producto (soft delete)
    - Subida de imágenes a Cloudinary
    - Formulario completo con validación

18. **Gestión de pedidos (Admin)**
    - Listado de pedidos (`/admin/pedidos`)
    - Filtrar por estado (pending, confirmed, shipped, etc.)
    - Ver detalle de pedido
    - Actualizar estado de pedido
    - Marcar como enviado (agregar tracking number)

**Resultado del día:** Admin puede gestionar productos y pedidos

---

### 🟠 DÍA 6: FUNCIONALIDADES ADICIONALES Y PULIDO

#### Mañana (3-4 horas)

19. **Funcionalidades adicionales Admin**

    - Gestión de usuarios (ver listado, cambiar roles)
    - Estadísticas y reportes básicos
    - Gestión de categorías (si aplica)
    - Configuración general del sitio

20. **Integración real de pasarela de pagos**
    - Implementar la pasarela elegida (Mercado Pago/Stripe/PayPal)
    - Webhooks para confirmar pagos
    - Actualizar estado de pedido automáticamente
    - Manejo de errores de pago

#### Tarde (3-4 horas)

21. **Newsletter funcional**

    - Integración con servicio de email (Mailchimp o SendGrid)
    - Formulario en home y footer
    - Confirmación de suscripción
    - Desuscripción desde dashboard usuario

22. **Optimizaciones y pulido**
    - Loading states en todas las páginas
    - Error boundaries
    - Manejo de errores (404, 500, etc.)
    - SEO básico (meta tags en todas las páginas)
    - Testing manual de flujos completos

**Resultado del día:** Proyecto funcional y listo para producción

---

### ⚪ DÍA 7 (OPCIONAL): EXTRAS Y DEPLOY

23. **Testing y bug fixes**

    - Probar todos los flujos
    - Corregir bugs encontrados
    - Optimizar rendimiento

24. **Deploy**
    - Configurar variables de entorno
    - Deploy en Vercel/Netlify
    - Configurar dominio
    - Testing en producción

---

## 📊 RESUMEN POR PRIORIDAD

### 🔴 CRÍTICO (Días 1-3)

- Carrito
- Páginas de categorías
- Detalle de producto
- Checkout básico

### 🟡 IMPORTANTE (Días 4-5)

- Autenticación
- Dashboard usuario
- Dashboard admin básico

### 🟢 NICE TO HAVE (Día 6+)

- Estadísticas avanzadas
- Wishlist
- Reviews
- Búsqueda avanzada

---

## 🛠️ TECNOLOGÍAS A UTILIZAR

### ✅ **SIN BACKEND PROPIO - Todo resuelto con servicios:**

- **Estado global:** Zustand (ya instalado)
- **Formularios:** React Hook Form + Zod (ya instalados)
- **Base de datos:** Firebase Firestore (✅ ya configurado)
- **Autenticación:** NextAuth + Firebase Auth (✅ ya configurado)
- **Imágenes:** Cloudinary (✅ ya configurado)
- **Pagos:** Por decidir (Mercado Pago/Stripe/PayPal)
- **API Routes:** Next.js API Routes solo para webhooks de pagos (opcional, puede hacerse con Firebase Functions)

### 🎯 **Arquitectura sin backend:**

```
Cliente (Next.js)
  ↓
Firebase Firestore (Productos, Pedidos, Usuarios)
Firebase Auth (Autenticación)
Cloudinary (Imágenes de productos)
Next.js API Routes (Webhooks de pagos - mínima lógica)
```

**NO necesitas:**

- ❌ Servidor Node.js/Express propio
- ❌ Base de datos PostgreSQL/MySQL
- ❌ Almacenamiento de archivos propio
- ❌ Servidor de autenticación propio

---

## 📝 NOTAS IMPORTANTES

1. **Mock data primero:** Empezar con mock data permite avanzar rápido sin depender de Firebase inicialmente
2. **Pasarela de pagos:** Decidir cuanto antes para poder implementarla correctamente
3. **Responsive:** Todos los componentes deben ser responsive desde el inicio
4. **Animaciones:** Mantener el estilo de animaciones sutiles en nuevos componentes
5. **TypeScript:** Mantener tipado estricto en todo momento

---

## ✅ PROGRESO ACTUAL (Actualizado)

### COMPLETADO:

- ✅ Store de carrito (Zustand con localStorage)
- ✅ Funciones Firebase para productos y categorías
- ✅ Mock data de productos
- ✅ Página dinámica de categorías `/categorias/[slug]`
- ✅ Navbar dinámico (categorías desde Firestore)
- ✅ Gestión completa de categorías admin (listar, crear, editar, imagen, destacada)
- ✅ Dashboard admin (`/admin` con stats y sidebar)
- ✅ Página detalle de producto `/productos/[id]`
- ✅ Tienda online con categorías e imágenes (Cloudinary)
- ✅ Home con categorías destacadas dinámicas

### PRÓXIMOS PASOS – ORDEN RECOMENDADO

**1. Cerrar Dashboard Admin** (para poder gestionar todo sin depender del usuario)

- Gestión de **productos**: listado, crear, editar, eliminar, subir imágenes a Cloudinary
- Gestión de **pedidos**: listado, filtrar por estado, ver detalle, actualizar estado (enviado, tracking)

**2. Checkout + Órdenes**

- Página `/checkout` (datos de envío, resumen, “confirmar pedido”)
- Crear orden en Firestore al confirmar
- Página de confirmación con número de orden

**3. Autenticación**

- Login, registro, recuperar contraseña (Firebase Auth)
- Protección de rutas: solo admins en `/admin`

**4. Dashboard Usuario**

- Perfil (nombre, email, teléfono)
- Direcciones de envío (guardar varias)
- Lista de deseos / favoritos
- Historial de pedidos (listado + detalle)

**5. Resto**

- Pasarela de pagos real (Mercado Pago / Stripe / PayPal)
- Newsletter funcional (opcional)
- Pulido (loading, errores, SEO)

### PENDIENTE:

- ❌ Admin: gestión de productos (CRUD + imágenes)
- ❌ Admin: gestión de pedidos
- ❌ Checkout y creación de órdenes en Firebase
- ❌ Autenticación y protección de rutas
- ❌ Dashboard usuario (perfil, direcciones, wishlist, pedidos)
- ❌ Pasarela de pagos
- ❌ Newsletter (opcional)

Ver `TAREAS_MANANA.md` para tareas del día.

---

## 🎯 OBJETIVO FINAL

Tener un e-commerce completamente funcional en **6-7 días** con:

- ✅ Navegación de productos
- ✅ Carrito funcional
- ✅ Checkout completo
- ✅ Pasarela de pagos integrada
- ✅ Dashboards de usuario y admin
- ✅ Gestión completa de productos y pedidos
