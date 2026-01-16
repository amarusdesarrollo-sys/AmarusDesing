# 📅 TAREAS PRIORITARIAS PARA MAÑANA

## ✅ LO QUE YA ESTÁ COMPLETADO HOY

1. ✅ **Sistema de Carrito** - Store Zustand con persistencia localStorage
2. ✅ **Funciones Firebase** - Helper para productos y categorías
3. ✅ **Mock Data** - 16 productos de ejemplo en todas las categorías
4. ✅ **Páginas de Categorías** - Página dinámica `/categorias/[slug]` que funciona para cualquier categoría
5. ✅ **Navbar Dinámico** - Carga categorías desde Firestore automáticamente
6. ✅ **Gestión de Categorías Admin** - CRUD completo (`/admin/categorias`)
   - ✅ Lista de categorías
   - ✅ Crear categoría
   - ✅ Editar categoría
   - ✅ Activar/Desactivar
   - ✅ Eliminar (soft delete)

---

## 🎯 PLAN PARA MAÑANA (Prioridades)

### 🌅 MAÑANA (Primera Sesión - 3-4 horas)

#### 1. **Dashboard Admin Principal** (PRIORIDAD ALTA) 🔴

- Crear `/admin/page.tsx` - Página principal del dashboard
- Sidebar de navegación con:
  - Overview/Dashboard
  - Productos
  - Categorías (ya hecho)
  - Pedidos
  - Usuarios
- Overview con estadísticas básicas:
  - Total de productos
  - Total de pedidos
  - Total de ventas (cuando esté disponible)
  - Categorías activas
- Diseño responsive y profesional

#### 2. **Página Detalle de Producto** (PRIORIDAD ALTA) 🔴

- Crear `/productos/[id]/page.tsx`
- Galería de imágenes (principal + thumbnails)
- Información completa del producto
- Botón "Agregar al carrito" funcional
- Descripción expandible
- Breadcrumbs
- Productos relacionados (opcional)

#### 3. **Gestión de Productos Admin** (PRIORIDAD MEDIA) 🟡

- Lista de productos (`/admin/productos`)
- Crear producto (`/admin/productos/nuevo`)
- Editar producto (`/admin/productos/[id]/editar`)
- Subida de imágenes a Cloudinary
- Selector de categorías (dinámico desde Firestore)
- Eliminar producto (soft delete)

---

### 🌆 TARDE (Segunda Sesión - 3-4 horas)

#### 4. **Autenticación Básica** (PRIORIDAD ALTA) 🔴

- Configurar NextAuth con Firebase Auth
- Página `/login` - Inicio de sesión
- Página `/registro` - Registro de usuarios
- Protección de rutas admin (middleware)
- Sistema de roles básico (admin/user)
- Verificar usuario autenticado en `/admin`

#### 5. **Checkout Básico** (PRIORIDAD MEDIA) 🟡

- Crear `/checkout/page.tsx`
- Paso 1: Información de envío
- Paso 2: Método de envío
- Paso 3: Resumen del pedido
- Validación de formularios (react-hook-form + zod)
- Cálculo de costos (subtotal, envío, total)

#### 6. **Integración Firebase para Órdenes** (PRIORIDAD MEDIA) 🟡

- Funciones helper para órdenes (`src/lib/firebase/orders.ts`)
- Crear orden al completar checkout
- Estados de orden: pending, confirmed, etc.
- Página de confirmación (`/checkout/confirmacion`)

---

## 📋 CHECKLIST DETALLADO

### Dashboard Admin Principal

- [ ] Crear `/admin/page.tsx`
- [ ] Diseñar sidebar de navegación
- [ ] Crear componente `AdminSidebar`
- [ ] Agregar estadísticas básicas (productos, pedidos, categorías)
- [ ] Diseño responsive
- [ ] Protección de ruta (solo admins)

### Página Detalle de Producto

- [ ] Crear `/productos/[id]/page.tsx`
- [ ] Galería de imágenes con thumbnails
- [ ] Información completa (precio, descripción, stock, etc.)
- [ ] Botón agregar al carrito funcional
- [ ] Breadcrumbs
- [ ] Estado de carga
- [ ] 404 si no existe

### Gestión de Productos Admin

- [ ] Crear `/admin/productos/page.tsx` (lista)
- [ ] Crear `/admin/productos/nuevo/page.tsx`
- [ ] Crear `/admin/productos/[id]/editar/page.tsx`
- [ ] Integrar Cloudinary para subir imágenes
- [ ] Selector de categorías dinámico
- [ ] Validación de formularios
- [ ] Eliminar producto (soft delete)

### Autenticación

- [ ] Configurar NextAuth con Firebase Auth
- [ ] Crear `/login/page.tsx`
- [ ] Crear `/registro/page.tsx`
- [ ] Middleware para proteger `/admin/*`
- [ ] Verificar rol admin antes de permitir acceso
- [ ] Logout funcional

### Checkout

- [ ] Crear `/checkout/page.tsx`
- [ ] Formulario de información de envío
- [ ] Selector de método de envío
- [ ] Resumen del pedido
- [ ] Validación con zod
- [ ] Integración con store del carrito

### Órdenes en Firebase

- [ ] Crear `src/lib/firebase/orders.ts`
- [ ] Función `createOrder()`
- [ ] Función `getOrdersByUserId()`
- [ ] Función `getOrderById()`
- [ ] Página confirmación `/checkout/confirmacion`
- [ ] Mostrar número de orden y resumen

---

## 🔄 ORDEN SUGERIDO DE IMPLEMENTACIÓN

### Sesión 1 (Mañana):

1. Dashboard Admin Principal ← EMPEZAR AQUÍ
2. Página Detalle de Producto
3. Gestión de Productos Admin (lista y crear)

### Sesión 2 (Tarde):

4. Autenticación (para proteger admin)
5. Gestión de Productos Admin (editar y eliminar)
6. Checkout básico
7. Órdenes en Firebase

---

## 📝 NOTAS IMPORTANTES

- **Dashboard Admin**: Aunque no esté completamente protegido todavía, es útil tener la estructura lista
- **Autenticación**: Priorizar después del dashboard para proteger las rutas admin
- **Productos**: Necesitamos la gestión completa antes de poder migrar de mock data a Firebase
- **Checkout**: Puede ser básico al principio, sin pasarela de pago real (solo estructura)

---

## 🎯 OBJETIVO DEL DÍA

Tener un sistema funcional donde:

- ✅ Los usuarios pueden ver productos y agregarlos al carrito
- ✅ Los usuarios pueden ver detalle de producto
- ✅ Los usuarios pueden iniciar checkout
- ✅ Los admins pueden gestionar productos y categorías desde el dashboard
- ✅ Las rutas admin están protegidas (autenticación básica)

---

**Estado actual**: Carrito funcionando, categorías dinámicas funcionando, falta dashboard admin principal y detalle de producto.
