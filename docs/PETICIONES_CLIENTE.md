# Peticiones del cliente — AmarusDesign

Resumen de lo pedido en reunión y estado de implementación.

---

## 1. Creación de producto: descuento y peso opcionales
**Pedido:** El descuento y el peso no deben ser campos obligatorios.
**Estado:** En implementación. El schema ya los tiene opcionales; se asegura que valores vacíos no fallen la validación.

---

## 2. Productos: borrado lógico y definitivo
**Pedido:** 
- Arreglar borrado lógico: al desactivar, poder volver a activar.
- Añadir borrado definitivo con aviso y confirmación explícita.

**Estado:** Pendiente. Actualmente "Desactivar" pone `inStock: false` y no hay forma de reactivar. Se implementará:
- Toggle Activar/Desactivar (borrado lógico).
- Botón "Eliminar permanentemente" con modal de confirmación.

---

## 3. Configuración de envíos
**Pedido:** Envío nacional (España), Canarias, Europa y mundial. Calcular automáticamente el coste según la dirección.

**Viabilidad:** 
- **Cálculo automático real** (API de Correos, MRW, DHL, etc.): requiere API externa, a menudo de pago.
- **Alternativa práctica:** Zonas con coste fijo por destino:
  - España peninsular: X €
  - Canarias: Y €  
  - Europa (UE + otros): Z €
  - Resto del mundo: W €
  - Se calcula según `country` y `postalCode` (para distinguir Canarias por código postal, ej. 35xxx 38xxx).

**Estado:** Pendiente. Se implementará la variante con costes fijos por zona.

---

## 4. Categorías: subcategorías y filtros
**Pedido:** 
- Crear subcategorías (ej. anillos, cabujones, aros).
- Filtro por subcategoría en la página de categoría.
- Al crear producto: elegir subcategoría si existe; si no hay o no se elige, guardar solo en categoría.

**Estado:** Pendiente. Requiere:
- Modelo: subcategorías como categorías con `parentId` o colección `subcategories`.
- Admin: CRUD de subcategorías por categoría.
- Formulario producto: dropdown de subcategorías (opcional).
- Página categoría: filtro por subcategoría.

---

## 5. Contenido: subir/cambiar imágenes
**Pedido:** Poder cambiar imágenes donde corresponda; ahora solo se puede modificar texto.

**Estado:** Pendiente. Revisar cada sección de Contenido (Home, Historia, Políticas, Equipo, Contacto) y añadir upload de imagen donde falte.

---

## 6. Códigos promocionales
**Pedido:** 
- Por categoría: descuento en productos de esa categoría.
- Por producto único: descuento en un producto concreto.
- Al introducir el código en checkout, aplicar descuento automáticamente según lo que defina el admin.

**Estado:** Pendiente. Requiere:
- Colección/config de códigos promocionales.
- Admin: CRUD (código, tipo: categoría|producto, id, % o cantidad fija, vigencia).
- Checkout: campo para código, validación y aplicación del descuento al total/carrito.
