# Épicas, Historias de Usuario y Product Backlog — Tienda en Línea Modular (Ritmo Store)

Este documento es el espejo en Markdown del archivo Excel **[`docs/backlog/Backlog-Tienda-Modular.xlsx`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/docs/backlog/Backlog-Tienda-Modular.xlsx)**. Está diseñado para que **cualquier agente de IA o desarrollador** pueda consultar de inmediato las Historias de Usuario (HU), sus criterios de aceptación, los endpoints del contrato [`docs/openapi.yaml`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/docs/openapi.yaml) y el estado real de implementación en **Backend** (**Bryan Lizcano**) y **Frontend** (**Edward Marín**).

Las Historias de Usuario fueron desglosadas aplicando el principio **INVEST** a partir de los Requerimientos Funcionales (`RF-01` a `RF-08`) y No Funcionales (`RNF-01` a `RNF-06`) definidos en la *Entrega 1 — Definición y Planeación*.

---

## 1. Épicas del Proyecto

| ID Épica | Nombre de la Épica | Descripción | RF / RNF Relacionados | Prioridad |
| :---: | :--- | :--- | :---: | :---: |
| **EP-01** | **Gestión de Categorías** | Administración completa (CRUD) de las categorías que estructuran el catálogo de la tienda. | `RF-01` | Alta |
| **EP-02** | **Gestión de Productos e Inventario** | Administración completa (CRUD) del catálogo de productos, precios, imágenes y control de existencias (`stock`). | `RF-02` | Alta |
| **EP-03** | **Exploración de Catálogo y Búsqueda** | Experiencia pública del cliente para navegar productos paginados, filtrar por categoría, buscar por palabras clave y ver detalles. | `RF-03`, `RF-07`, `RNF-04` | Alta |
| **EP-04** | **Carrito de Compras y Checkout** | Gestión reactiva del carrito en el cliente (`localStorage`) y confirmación transaccional del pedido con descuento atómico de inventario. | `RF-04`, `RF-06` | Alta |
| **EP-05** | **Seguridad, Acceso Admin y Gestión de Pedidos** | Autenticación con sesiones `httpOnly`, protección anti-CSRF (*Double Submit Cookie*), panel privado y seguimiento de pedidos. | `RF-05`, `RF-08`, `RNF-03` | Alta |

---

## 2. Tablero de Control General (Estado Actual)

| ID | Historia de Usuario | Épica | RF | Sprint (Semana) | Pts | Backend (Bryan) | Frontend (Edward) | Estado Global |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **HU-01** | Listar y consultar detalle de categorías | EP-01 | RF-01 | S2 (Sem 11) | 2 | `[x]` Hecho | `[x]` Hecho | **Completado** |
| **HU-02** | Crear una nueva categoría de productos | EP-01 | RF-01 | S2 (Sem 11) | 3 | `[x]` Hecho | `[x]` Hecho | **Completado** |
| **HU-03** | Editar una categoría existente | EP-01 | RF-01 | S3 (Sem 12) | 3 | `[x]` Hecho | `[x]` Hecho | **Completado** |
| **HU-04** | Eliminar una categoría sin productos asociados | EP-01 | RF-01 | S3 (Sem 12) | 3 | `[x]` Hecho | `[x]` Hecho | **Completado** |
| **HU-05** | Registrar un nuevo producto con stock e imagen | EP-02 | RF-02 | S2 (Sem 11) | 5 | `[x]` Hecho | `[x]` Hecho | **Completado** |
| **HU-06** | Editar datos, precio y stock de un producto | EP-02 | RF-02 | S3 (Sem 12) | 5 | `[x]` Hecho | `[x]` Hecho | **Completado** |
| **HU-07** | Eliminar un producto sin pedidos asociados | EP-02 | RF-02 | S3 (Sem 12) | 3 | `[x]` Hecho | `[x]` Hecho | **Completado** |
| **HU-08** | Explorar catálogo paginado de productos | EP-03 | RF-03 | S3 (Sem 12) | 5 | `[x]` Hecho | `[x]` Hecho | **Completado** |
| **HU-09** | Filtrar productos del catálogo por categoría | EP-03 | RF-03 | S3 (Sem 12) | 3 | `[x]` Hecho | `[x]` Hecho | **Completado** |
| **HU-10** | Buscar productos por nombre o palabras clave | EP-03 | RF-07 | S3 (Sem 12) | 3 | `[x]` Hecho | `[x]` Hecho | **Completado** |
| **HU-11** | Consultar vista detallada de un producto | EP-03 | RF-03 | S3 (Sem 12) | 3 | `[x]` Hecho | `[x]` Hecho | **Completado** |
| **HU-12** | Agregar productos al carrito validando stock | EP-04 | RF-04 | S4 (Sem 13) | 5 | `N/A` *(Cliente)* | `[x]` Hecho | **Completado** |
| **HU-13** | Gestionar ítems del carrito y calcular total en tiempo real | EP-04 | RF-04 | S4 (Sem 13) | 5 | `N/A` *(Cliente)* | `[x]` Hecho | **Completado** |
| **HU-14** | Confirmar pedido (Checkout) y descontar stock en BD | EP-04 | RF-06 | S4 (Sem 13) | 8 | `[x]` Hecho | `[x]` Hecho | **Completado** |
| **HU-15** | Iniciar y cerrar sesión como administrador | EP-05 | RF-05 | S4 (Sem 13) | 5 | `[x]` Hecho | `[x]` Hecho | **Completado** |
| **HU-16** | Proteger operaciones mutables con token CSRF | EP-05 | RNF-03 | S5 (Sem 14) | 5 | `[x]` Hecho | `[x]` Hecho | **Completado** |
| **HU-17** | Consultar historial y detalle de pedidos en el panel admin | EP-05 | RF-08 | S4 (Sem 13) | 5 | `[x]` Hecho | `[x]` Hecho | **Completado** |
| **HU-18** | Actualizar el estado operativo de un pedido | EP-05 | RF-08 | S4 (Sem 13) | 3 | `[ ]` Por hacer | `[ ]` Por hacer | **Por hacer** |

---

## 3. Detalle de Historias de Usuario y Criterios de Aceptación

### EP-01 — Gestión de Categorías (`RF-01`)

#### **HU-01: Listar y consultar detalle de categorías**
* **Rol:** Cliente / Administrador
* **Historia:** *Como usuario de la tienda, quiero consultar el listado de categorías y su detalle para navegar o administrar la clasificación del catálogo.*
* **Endpoints:** `GET /api/v1/categorias`, `GET /api/v1/categorias/{id}`
* **Criterios de Aceptación:**
  1. `GET /api/v1/categorias` retorna `200 OK` con el arreglo de categorías ordenadas por `id_categoria`.
  2. `GET /api/v1/categorias/{id}` retorna `200 OK` si existe, `400 Bad Request` si el ID no es entero positivo y `404 Not Found` si no existe.
* **Estado:** ✅ **Completado** (Backend en [`categoryRoutes.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/src/routes/categoryRoutes.js) y Frontend en [`catalog.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/services/catalog.js)).

#### **HU-02: Crear una nueva categoría de productos**
* **Rol:** Administrador
* **Historia:** *Como administrador, quiero registrar una nueva categoría indicando su nombre y descripción para ampliar las secciones del catálogo.*
* **Endpoint:** `POST /api/v1/categorias`
* **Criterios de Aceptación:**
  1. Valida que `nombre` sea obligatorio (`<= 100` caracteres) y sanitiza etiquetas HTML/XSS.
  2. Si el nombre ya existe (insensible a mayúsculas/minúsculas), retorna `409 Conflict` (`DUPLICATE_CATEGORY_NAME`).
  3. Retorna `201 Created` con la categoría creada.
  4. Exige sesión activa (`admin_session`) y encabezado `X-CSRF-Token`.
* **Estado:** ✅ **Completado** (Protegido con `authMiddleware` y `csrfMiddleware`; integrado con el formulario de [`AdminDashboardView.vue`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/views/AdminDashboardView.vue) y validado con 9 pruebas automatizadas).

#### **HU-03: Editar una categoría existente**
* **Rol:** Administrador
* **Historia:** *Como administrador, quiero modificar el nombre y la descripción de una categoría existente para corregir o actualizar la organización del catálogo.*
* **Endpoint:** `PUT /api/v1/categorias/{id}`
* **Criterios de Aceptación:**
  1. Si la categoría no existe, retorna `404 Not Found`.
  2. Si el nuevo `nombre` colisiona con otra categoría distinta, retorna `409 Conflict` (`DUPLICATE_CATEGORY_NAME`).
  3. En el panel administrativo, permite seleccionar una categoría de la tabla, editar sus campos y guardar cambios.
* **Estado:** ✅ **Completado** (Backend en [`categoryRoutes.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/src/routes/categoryRoutes.js) con `authMiddleware` y `csrfMiddleware`; Frontend con modo edición en [`AdminDashboardView.vue`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/views/AdminDashboardView.vue) y [`catalog.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/services/catalog.js); validado con 9 pruebas automatizadas).

#### **HU-04: Eliminar una categoría sin productos asociados**
* **Rol:** Administrador
* **Historia:** *Como administrador, quiero eliminar una categoría en desuso siempre que no tenga productos vinculados para mantener limpio el catálogo sin dejar productos huérfanos.*
* **Endpoint:** `DELETE /api/v1/categorias/{id}`
* **Criterios de Aceptación:**
  1. Si la categoría tiene productos asociados, PostgreSQL aplica `ON DELETE RESTRICT` y el backend responde `409 Conflict` (`CATEGORY_HAS_PRODUCTS`).
  2. Si no tiene productos asociados, la elimina y retorna `200 OK`.
  3. El frontend solicita confirmación antes de eliminar y muestra mensaje claro si ocurre el conflicto `409`.
* **Estado:** ✅ **Completado** (Backend en [`categoryRoutes.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/src/routes/categoryRoutes.js) y [`categoryService.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/src/services/categoryService.js) protegido con `authMiddleware` y `csrfMiddleware`; Frontend con modal de confirmación y manejo de error 409 en [`AdminDashboardView.vue`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/views/AdminDashboardView.vue) y [`catalog.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/services/catalog.js); validado con 8 pruebas automatizadas específicas).

---

### EP-02 — Gestión de Productos e Inventario (`RF-02`)

#### **HU-05: Registrar un nuevo producto con stock e imagen**
* **Rol:** Administrador
* **Historia:** *Como administrador, quiero registrar un producto asociando categoría, nombre, descripción, precio, stock e imagen para ponerlo a la venta.*
* **Endpoint:** `POST /api/v1/productos`
* **Criterios de Aceptación:**
  1. Valida `id_categoria` existente (`422` si no existe), `nombre` obligatorio (`<= 150` chars), `precio >= 0`, `stock >= 0` entero e `imagen_url` con formato URI válido.
  2. Sanitiza entradas de texto contra XSS y retorna `201 Created`.
* **Estado:** ✅ **Completado** (Backend en [`productRoutes.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/src/routes/productRoutes.js) protegido con `authMiddleware` y `csrfMiddleware`; validaciones semánticas completas y sanitización XSS en [`validatorMiddleware.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/src/middleware/validatorMiddleware.js); Frontend integrado en [`AdminDashboardView.vue`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/views/AdminDashboardView.vue) y [`catalog.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/services/catalog.js); suite de pruebas automatizadas en [`products.test.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/tests/products.test.js)).

#### **HU-06: Editar datos, precio y stock de un producto**
* **Rol:** Administrador
* **Historia:** *Como administrador, quiero actualizar los datos, el precio o las unidades en inventario (`stock`) de un producto para reflejar cambios comerciales y reabastecimientos.*
* **Endpoint:** `PUT /api/v1/productos/{id}`
* **Criterios de Aceptación:**
  1. Valida todos los campos igual que en la creación y verifica que el producto exista (`404 Not Found` si no existe).
  2. Retorna `200 OK` con el producto actualizado incluyendo `categoria_nombre`.
  3. El panel admin permite editar cualquier fila de producto desde la tabla.
* **Estado:** ✅ **Completado** (Backend en [`productRoutes.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/src/routes/productRoutes.js) protegido con `authMiddleware` y `csrfMiddleware`; validaciones semánticas completas y sanitización XSS en [`validatorMiddleware.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/src/middleware/validatorMiddleware.js); Frontend con modo edición integrado en [`AdminDashboardView.vue`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/views/AdminDashboardView.vue) y [`catalog.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/services/catalog.js); suite de pruebas automatizadas en [`products.test.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/tests/products.test.js)).

#### **HU-07: Eliminar un producto sin pedidos asociados**
* **Rol:** Administrador
* **Historia:** *Como administrador, quiero eliminar un producto del catálogo siempre que no figure en pedidos históricos para preservar la integridad contable.*
* **Endpoint:** `DELETE /api/v1/productos/{id}`
* **Criterios de Aceptación:**
  1. Si el producto aparece en `detalle_pedido`, la BD bloquea el borrado (`ON DELETE RESTRICT`) y la API retorna `409 Conflict` (`PRODUCT_HAS_ORDERS`).
  2. Si no tiene ventas registradas, se elimina y retorna `200 OK`.
* **Estado:** ✅ **Completado** (Backend en [productRoutes.js](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/src/routes/productRoutes.js) y [productService.js](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/src/services/productService.js) protegido con authMiddleware y csrfMiddleware; validación de clave foránea y captura de error SQL 23503 con código PRODUCT_HAS_ORDERS; Frontend con botón de eliminación, diálogo de confirmación y feedback reactivo en [AdminDashboardView.vue](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/views/AdminDashboardView.vue) y [catalog.js](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/services/catalog.js); suite de pruebas automatizadas en [products.test.js](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/tests/products.test.js)).

---

### EP-03 — Exploración de Catálogo y Búsqueda (`RF-03`, `RF-07`)

#### **HU-08: Explorar catálogo paginado de productos**
* **Rol:** Cliente
* **Historia:** *Como cliente, quiero explorar el catálogo de productos paginado viendo imagen, nombre, categoría, precio y disponibilidad para conocer qué artículos ofrece la tienda.*
* **Endpoint:** `GET /api/v1/productos?page=1&limit=12`
* **Criterios de Aceptación:**
  1. Retorna arreglo `data` y objeto `meta` (`total`, `page`, `limit`, `totalPages`).
  2. Muestra *skeletons* durante la carga, insignia cuando `stock < 5` (*"Quedan X"*) y estado *"Agotado"* cuando `stock === 0`.
* **Estado:** ✅ **Completado**.

#### **HU-09: Filtrar productos del catálogo por categoría**
* **Rol:** Cliente
* **Historia:** *Como cliente, quiero filtrar los productos por categoría desde la barra de navegación o los chips del catálogo para encontrar artículos de un segmento específico.*
* **Endpoint:** `GET /api/v1/productos?id_categoria={id}`
* **Criterios de Aceptación:**
  1. Al seleccionar una categoría, actualiza el listado y reinicia la paginación a la página 1.
  2. La URL (`/?category=X`) y el estado activo de los botones deben mantenerse sincronizados entre [`AppHeader.vue`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/components/AppHeader.vue) y [`CatalogView.vue`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/views/CatalogView.vue).
* **Estado:** 🟡 **En progreso** (Backend 100% listo; en Frontend falta sincronizar `selectCategory()` con `router.push` y corregir `.router-link-active` en `AppHeader.vue`).

#### **HU-10: Buscar productos por nombre o palabras clave**
* **Rol:** Cliente
* **Historia:** *Como cliente, quiero buscar productos escribiendo palabras clave para hallar rápidamente un artículo por su nombre o descripción.*
* **Endpoint:** `GET /api/v1/productos?q={termino}`
* **Criterios de Aceptación:**
  1. Filtra en PostgreSQL mediante `ILIKE` sobre `nombre` y `descripcion` aprovechando el índice GIN `pg_trgm`.
  2. Es combinable con el filtro de categoría y la paginación.
* **Estado:** ✅ **Completado**.

#### **HU-11: Consultar vista detallada de un producto**
* **Rol:** Cliente
* **Historia:** *Como cliente, quiero abrir la ficha individual de un producto para leer su descripción completa, ver su stock exacto y elegir cuántas unidades agregar a mi bolsa.*
* **Endpoint:** `GET /api/v1/productos/{id}`
* **Criterios de Aceptación:**
  1. Muestra imagen ampliada, categoría, nombre, descripción, precio formateado y selector de cantidad limitado por `stock`.
* **Estado:** ✅ **Completado** ([`ProductDetailView.vue`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/views/ProductDetailView.vue)).

---

### EP-04 — Carrito de Compras y Checkout (`RF-04`, `RF-06`)

#### **HU-12: Agregar productos al carrito validando stock**
* **Rol:** Cliente
* **Historia:** *Como cliente, quiero agregar unidades de un producto a mi carrito sin exceder el stock disponible para asegurar que mi pedido sea válido.*
* **Criterios de Aceptación:**
  1. Impide agregar productos con `stock <= 0` o superar el `stock` disponible al acumular unidades en el carrito.
* **Estado:** ✅ **Completado** ([`cart.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/stores/cart.js)).

#### **HU-13: Gestionar ítems del carrito y calcular total en tiempo real**
* **Rol:** Cliente
* **Historia:** *Como cliente, quiero incrementar o disminuir cantidades, eliminar líneas, vaciar la bolsa y ver el subtotal actualizado al instante conservando mi carrito al recargar la página.*
* **Criterios de Aceptación:**
  1. El estado del carrito se sincroniza en `localStorage` (`ritmo-cart`).
  2. El contador de unidades en el Header y el subtotal se recalculan reactivamente.
* **Estado:** ✅ **Completado** ([`CartDrawer.vue`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/components/CartDrawer.vue) y [`cart.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/stores/cart.js)).

#### **HU-14: Confirmar pedido (Checkout) y descontar stock atómicamente**
* **Rol:** Cliente
* **Historia:** *Como cliente, quiero confirmar mi pedido ingresando mi nombre y dato de contacto (teléfono o email) para registrar mi compra sin necesidad de crear una cuenta.*
* **Endpoint:** `POST /api/v1/pedidos`
* **Criterios de Aceptación:**
  1. El backend abre una transacción SQL (`BEGIN`), bloquea los productos con `SELECT ... FOR UPDATE`, verifica `stock >= cantidad` (si falla hace `ROLLBACK` y devuelve `409 INSUFFICIENT_STOCK`), descuenta el stock, calcula el `total` oficial con los precios de la BD, inserta en `pedido` y `detalle_pedido` y hace `COMMIT`.
  2. El frontend solicita `nombre_cliente` y `contacto_cliente`, envía los ítems, vacía el carrito al recibir `201 Created` y muestra la confirmación con el número de pedido (`id_pedido`).
* **Estado:** ✅ **Completado** (Backend implementado con transacción atómica SQL, bloqueo pesimista `FOR UPDATE` y descuento de existencias en [`orderService.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/src/services/orderService.js) y [`orderRoutes.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/src/routes/orderRoutes.js); Frontend con flujo de checkout, validaciones y vista de confirmación en [`CartDrawer.vue`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/components/CartDrawer.vue) y [`orders.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/services/orders.js); probado exhaustivamente en [`orders.test.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/tests/orders.test.js)).

---

### EP-05 — Seguridad, Acceso Admin y Gestión de Pedidos (`RF-05`, `RF-08`, `RNF-03`)

#### **HU-15: Iniciar y cerrar sesión como administrador**
* **Rol:** Administrador
* **Historia:** *Como administrador, quiero iniciar y cerrar sesión con mi correo y contraseña para acceder de forma segura al panel de administración.*
* **Endpoints:** `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
* **Criterios de Aceptación:**
  1. Compara la contraseña usando `bcrypt` contra `administrador.password_hash`.
  2. Establece la cookie `admin_session` con banderas `httpOnly: true`, `sameSite: 'lax'` y `secure: process.env.NODE_ENV === 'production'`.
  3. El guard de Vue Router redirige a `/admin/login` si `GET /auth/me` responde `401`.
* **Estado:** ✅ **Completado** (Implementado en Backend con authController, authService, authRoutes y cookie-parser con httpOnly; probado en auth.test.js e integrado con frontend AdminLoginView.vue y auth.js).

#### **HU-16: Proteger operaciones mutables con token CSRF**
* **Rol:** Sistema / Seguridad
* **Historia:** *Como administrador del sistema, quiero que toda operación que modifique datos (`POST`, `PUT`, `PATCH`, `DELETE`) valide un token anti-CSRF mediante Double Submit Cookie para prevenir ataques Cross-Site Request Forgery.*
* **Endpoint:** `GET /api/v1/auth/csrf`
* **Criterios de Aceptación:**
  1. `GET /api/v1/auth/csrf` emite una cookie CSRF y devuelve `{ csrfToken }` en el cuerpo JSON.
  2. El middleware CSRF del backend rechaza con `403 Forbidden` (`CSRF_TOKEN_INVALID`) cualquier petición mutable cuyo header `X-CSRF-Token` no coincida con la cookie.
* **Estado:** ✅ **Completado** (Implementado en Backend con GET /api/v1/auth/csrf y csrfMiddleware con patron Double Submit Cookie; probado exhaustivamente en auth.test.js e integrado en Axios interceptors).

#### **HU-17: Consultar historial y detalle de pedidos en el panel administrativo**
* **Rol:** Administrador
* **Historia:** *Como administrador, quiero visualizar el listado paginado de pedidos recibidos (filtrable por estado) y consultar el detalle de productos comprados en cada orden para gestionar los despachos.*
* **Endpoints:** `GET /api/v1/pedidos`, `GET /api/v1/pedidos/{id}`
* **Criterios de Aceptación:**
  1. `GET /api/v1/pedidos` requiere sesión admin y retorna los pedidos ordenados del más reciente al más antiguo (`ORDER BY fecha DESC`), permitiendo filtrar por `estado`.
  2. `GET /api/v1/pedidos/{id}` retorna los datos del cliente y el arreglo `detalles` con `nombre_producto`, `cantidad`, `precio_unitario` y `subtotal`.
  3. [`AdminDashboardView.vue`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/views/AdminDashboardView.vue) incluye una pestaña *"Pedidos"* para explorar la tabla y abrir el detalle de cada orden.
* **Estado:** ✅ **Completado** (Backend implementado en [`orderRoutes.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/src/routes/orderRoutes.js) y [`orderService.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/src/services/orderService.js) protegido con `authMiddleware`; Frontend integrado en [`AdminDashboardView.vue`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/frontend/src/views/AdminDashboardView.vue) con pestaña Pedidos, filtros de estado y modal de detalle; validado en [`orders.test.js`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/backend/tests/orders.test.js)).

#### **HU-18: Actualizar el estado operativo de un pedido**
* **Rol:** Administrador
* **Historia:** *Como administrador, quiero cambiar el estado de un pedido (`PENDIENTE`, `CONFIRMADO`, `EN_PREPARACION`, `COMPLETADO`, `CANCELADO`) para llevar el control del flujo de atención al cliente.*
* **Endpoint:** `PATCH /api/v1/pedidos/{id}/estado`
* **Criterios de Aceptación:**
  1. Valida que `estado` pertenezca a los 5 valores permitidos (`422` en caso contrario).
  2. Retorna `200 OK` con el pedido actualizado y refleja el cambio en la tabla del panel administrativo.
* **Estado:** ❌ **Por hacer** (Falta en Backend y Frontend).
