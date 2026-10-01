# Guía Operativa y Convenciones de Desarrollo — Tienda en Línea Modular

Este documento establece las directrices de arquitectura, convenciones de nomenclatura, reglas de seguridad y metodología de trabajo que deben ser acatadas estrictamente por todos los agentes de IA y desarrolladores (**Bryan Lizcano** en Backend y **Edward Marín** en Frontend).

La fuente de verdad del contrato de la aplicación reside en la carpeta [`docs/`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/docs/):
- Contrato REST: [`docs/openapi.yaml`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/docs/openapi.yaml)
- Esquema DDL y Constraints: [`docs/schema.sql`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/docs/schema.sql)
- Modelo Entidad-Relación: [`docs/modelo-datos.md`](file:///c:/Users/elpeo/OneDrive/Documentos/Desarrollo%20Web/Proyecto%20WEB/docs/modelo-datos.md)

---

## 1. Estructura del Repositorio

El repositorio Git raíz es `Proyecto WEB/`. Contiene dos proyectos desacoplados e independientes (`backend/` y `frontend/`), además de la documentación transversal:

```text
Proyecto WEB/
├── .gitignore
├── AGENTS.md                   # Este archivo (reglas y convenciones)
├── docs/                       # Contratos, esquemas y arquitectura (intocables sin aprobación)
│   ├── openapi.yaml
│   ├── schema.sql
│   └── modelo-datos.md
│
├── backend/                    # Proyecto Node.js + Express (Bryan Lizcano)
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── src/
│   │   ├── config/             # Configuración de BD (pg Pool), CORS, variables de entorno
│   │   ├── controllers/        # Controladores HTTP (manejo de req, res y códigos HTTP)
│   │   ├── middleware/         # Auth, CSRF, validación de schemas, manejo de errores
│   │   ├── routes/             # Definición de rutas Express
│   │   ├── services/           # Lógica de negocio, queries SQL parametrizadas y transacciones
│   │   ├── utils/              # Funciones auxiliares y formateadores
│   │   └── server.js           # Punto de entrada de la aplicación Express
│   └── tests/                  # Pruebas unitarias o de integración
│
└── frontend/                   # Proyecto Vue.js + Vite + SCSS (Edward Marín)
    ├── .env.example
    ├── .gitignore
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── assets/             # Imágenes estáticas y recursos
        ├── components/         # Componentes Vue reutilizables (Navbar, ProductCard, CartModal)
        ├── router/             # Vue Router (vistas públicas y panel admin con guard)
        ├── services/           # Cliente HTTP (Axios/Fetch configurado con credenciales y CSRF)
        ├── stores/             # Estado global (Pinia: carrito reactivo y sesión admin)
        ├── styles/             # SCSS modular (_variables.scss, _mixins.scss, main.scss)
        ├── views/              # Vistas principales (CatalogView, AdminView, CheckoutView)
        ├── App.vue
        └── main.js
```

---

## 2. Convenciones de Nomenclatura y Bilingüismo

Para garantizar uniformidad entre frontend y backend:

### 2.1. Idioma Español: Dominio del Negocio y Base de Datos
Aplica a:
* Nombres de tablas y columnas en la base de datos (`id_producto`, `precio_unitario`, `stock`, `nombre_cliente`).
* Segmentos de rutas URL en la API REST (`/api/v1/productos`, `/api/v1/categorias`, `/api/v1/pedidos`).
* Claves en payloads JSON intercambiados entre backend y frontend (`id_categoria`, `contacto_cliente`, `detalles`).

### 2.2. Idioma Inglés: Código Técnico y Arquitectura
Aplica a:
* Clases, métodos, funciones y variables en JavaScript/Vue:
  * Controladores: `ProductController.js`, `CategoryController.js`
  * Servicios: `orderService.js`, `authService.js`
  * Middlewares: `authMiddleware.js`, `csrfMiddleware.js`, `errorHandler.js`
  * Funciones: `getProducts()`, `calculateCartTotal()`, `validateSession()`
  * Stores: `useCartStore.js`, `useAuthStore.js`
* Claves técnicas en respuestas JSON: `status`, `data`, `meta`, `page`, `limit`, `code`, `message`, `details`.

---

## 3. Arquitectura en Capas en el Backend

El backend debe respetar rigurosamente la separación de responsabilidades:

```mermaid
flowchart TD
    Req["Petición HTTP"] --> R["Routes: Solo enrutan y aplican middlewares"]
    R --> C["Controllers: Extraen req.body/params/query y envían res.status().json()"]
    C --> S["Services: Lógica de negocio, validaciones transaccionales y queries SQL"]
    S --> DB[("PostgreSQL")]
```

1. **Rutas (`routes/`):**
   * Su única responsabilidad es asociar una URL y verbo HTTP con sus middlewares de seguridad/validación y el método del controlador correspondiente.
   * **Prohibido:** Colocar lógica de negocio, consultas de base de datos o manipulación directa de respuestas en los archivos de rutas.
2. **Controladores (`controllers/`):**
   * Su función es recibir la petición (`req`), extraer los parámetros validados, delegar la ejecución al servicio correspondiente y retornar la respuesta HTTP (`res.status(...).json(...)`).
   * No deben contener sentencias SQL ni reglas de negocio.
3. **Servicios (`services/`):**
   * Encapsulan las reglas de negocio, el cálculo de totales, la verificación de inventario y el acceso a datos.
   * Las sentencias SQL se ejecutan exclusivamente en esta capa mediante el pool de conexiones de `pg`.
4. **Middlewares (`middleware/`):**
   * `authMiddleware.js`: Verifica que la cookie `admin_session` exista y sea válida.
   * `csrfMiddleware.js`: Valida que en métodos mutantes (`POST`, `PUT`, `DELETE`, `PATCH`) el encabezado `X-CSRF-Token` coincida con la cookie CSRF.
   * `validatorMiddleware.js`: Verifica sintaxis y esquemas de entrada antes de llegar al controlador.
   * `errorHandler.js`: Captura excepciones y genera respuestas uniformes.

---

## 4. Estándar de Respuestas y Formato de Errores

### 4.1. Respuestas Exitosas
```json
{
  "status": "success",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```
*(El objeto `meta` solo se incluye en listados paginados).*

### 4.2. Respuestas de Error Uniformes
Toda respuesta con código de estado HTTP $\ge 400$ debe apegarse a esta estructura:

```json
{
  "status": "error",
  "code": "INSUFFICIENT_STOCK",
  "message": "Stock insuficiente para el producto 'Tenis Running Nitro 2.0'.",
  "details": [
    {
      "field": "items[0].cantidad",
      "message": "Solo restan 1 unidades en inventario."
    }
  ]
}
```

Códigos HTTP requeridos:
* `200 OK`: Operación de lectura o actualización exitosa.
* `201 Created`: Recurso creado exitosamente (`POST`).
* `204 No Content`: Eliminación completada sin cuerpo de respuesta.
* `400 Bad Request`: Error de formato en la petición o IDs no numéricos.
* `401 Unauthorized`: Falta de autenticación (sin cookie de sesión).
* `403 Forbidden`: Token CSRF faltante o inválido.
* `404 Not Found`: Recurso inexistente en la base de datos.
* `409 Conflict`: Violación de restricción única o stock insuficiente.
* `422 Unprocessable Entity`: Errores de validación semántica en campos del formulario.
* `500 Internal Server Error`: Fallo no controlado en el servidor.

---

## 5. Reglas de Seguridad Obligatorias (OWASP)

1. **Prevención de Inyección SQL (Mandatorio):**
   * Queda estrictamente **prohibido concatenar o interpolar cadenas en sentencias SQL**.
   * Todas las consultas deben usar parámetros preparados con el cliente de PostgreSQL:
     ```javascript
     // CORRECTO
     const result = await pool.query(
       'SELECT * FROM producto WHERE id_categoria = $1 AND precio <= $2',
       [idCategoria, precioMaximo]
     );

     // INCORRECTO (PROHIBIDO)
     // const result = await pool.query(`SELECT * FROM producto WHERE id_categoria = ${idCategoria}`);
     ```

2. **Mitigación de Cross-Site Scripting (XSS):**
   * En el backend, sanitizar y validar todas las entradas de texto (`nombre`, `descripcion`, `contacto_cliente`) utilizando librerías como `validator` o `xss`.
   * En el frontend (Vue.js), utilizar siempre interpolación estándar `{{ texto }}`. Se prohíbe el uso de `v-html` con datos provenientes de usuarios o de la API.

3. **Cabeceras de Seguridad (Helmet):**
   * El servidor Express debe inicializar `helmet()` como primer middleware para configurar encabezados HTTP seguros (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`).

4. **Cross-Origin Resource Sharing (CORS):**
   * Configurar el middleware `cors` en Express permitiendo únicamente los orígenes configurados en variables de entorno (URL del frontend en Vercel y `http://localhost:5173` para desarrollo local).
   * Debe habilitar `credentials: true` para permitir el intercambio de cookies.

5. **Cifrado de Contraseñas:**
   * Utilizar `bcrypt` con un costo de trabajo (salt rounds) mínimo de 10.
   * Ninguna contraseña debe almacenarse o registrarse en logs en texto plano.

6. **Autenticación con Cookies Protegidas:**
   * La sesión administrativa se maneja mediante una cookie HTTP (`admin_session`) con atributos:
     * `httpOnly: true` (inaccesible desde JavaScript en el navegador).
     * `secure: process.env.NODE_ENV === 'production'` (transmisión exclusiva sobre HTTPS).
     * `sameSite: 'lax'` (protección contra ataques entre sitios).

7. **Protección CSRF (Double Submit Cookie Pattern):**
   * Toda petición mutable (`POST`, `PUT`, `DELETE`, `PATCH`) debe enviar el encabezado `X-CSRF-Token`.
   * El cliente frontend obtendrá dicho token mediante `GET /api/v1/auth/csrf` y lo incluirá en los interceptores de su cliente HTTP (Axios/Fetch).

8. **HTTPS en Producción:**
   * Render y Vercel proporcionan certificados SSL/TLS automáticos. El backend debe confiar en el proxy inverso (`app.set('trust proxy', 1)`) para que las cookies `Secure` funcionen adecuadamente en Render.

---

## 6. Reglas Críticas de Negocio

### 6.1. Confirmación Transaccional de Pedidos (`POST /pedidos`)
Para prevenir discrepancias de inventario y sobreventas por concurrencia, el servicio de pedidos debe implementar la siguiente secuencia atómica:

```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');

  let totalCalculado = 0;
  const itemsVerificados = [];

  for (const item of items) {
    // 1. Bloqueo pesimista de fila
    const resProd = await client.query(
      'SELECT id_producto, nombre, precio, stock FROM producto WHERE id_producto = $1 FOR UPDATE',
      [item.id_producto]
    );

    if (resProd.rows.length === 0) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: `Producto con ID ${item.id_producto} no existe.` };
    }

    const prod = resProd.rows[0];

    // 2. Validación de stock
    if (prod.stock < item.cantidad) {
      throw {
        status: 409,
        code: 'INSUFFICIENT_STOCK',
        message: `Stock insuficiente para '${prod.nombre}'. Disponibles: ${prod.stock}, Solicitados: ${item.cantidad}.`
      };
    }

    // 3. Descuento de inventario
    await client.query(
      'UPDATE producto SET stock = stock - $1 WHERE id_producto = $2',
      [item.cantidad, item.id_producto]
    );

    const subtotal = Number(prod.precio) * item.cantidad;
    totalCalculado += subtotal;

    itemsVerificados.push({
      id_producto: prod.id_producto,
      cantidad: item.cantidad,
      precio_unitario: prod.precio
    });
  }

  // 4. Registro de cabecera de pedido
  const resPedido = await client.query(
    'INSERT INTO pedido (nombre_cliente, contacto_cliente, total, estado) VALUES ($1, $2, $3, $4) RETURNING *',
    [nombre_cliente, contacto_cliente, totalCalculado, 'PENDIENTE']
  );
  const nuevoPedido = resPedido.rows[0];

  // 5. Registro de renglones de detalle
  for (const det of itemsVerificados) {
    await client.query(
      'INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
      [nuevoPedido.id_pedido, det.id_producto, det.cantidad, det.precio_unitario]
    );
  }

  await client.query('COMMIT');
  return { ...nuevoPedido, detalles: itemsVerificados };
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

---

## 7. Manejo de Variables de Entorno

* **Nunca commitear archivos `.env`**.
* Mantener siempre actualizado el archivo `.env.example` en cada subproyecto:

### `backend/.env.example`
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://usuario:password@localhost:5432/tienda_modular
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=un_secreto_muy_seguro_para_firmar_cookies
```

### `frontend/.env.example`
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## 8. Normas de Colaboración y Trabajo en Equipo

1. **Independencia de Carpetas:**
   * El agente o desarrollador a cargo de Backend debe trabajar exclusivamente dentro de `backend/`.
   * El agente o desarrollador a cargo de Frontend debe trabajar exclusivamente dentro de `frontend/`.
2. **Inmutabilidad de la Documentación:**
   * La carpeta `docs/` (`openapi.yaml`, `schema.sql`, `modelo-datos.md`) es el contrato rector. No se debe modificar sin consenso explícito de ambos desarrolladores.
3. **Gestión de Dependencias:**
   * No instalar dependencias globales (`npm install -g`). Todas las librerías deben residir localmente en sus respectivos `package.json`.
4. **Commits Pequeños y Atómicos:**
   * Mensajes de commit descriptivos bajo la convención Conventional Commits: `feat(backend): ...`, `fix(frontend): ...`, `docs: ...`.
5. **Comandos en Windows con PowerShell:**
   * Todas las instrucciones de ejecución deben formularse en sintaxis de PowerShell:
     ```powershell
     # Iniciar backend
     cd backend
     npm install
     npm run dev

     # Iniciar frontend en terminal separada
     cd frontend
     npm install
     npm run dev
     ```

---

## 9. Directrices de Arquitectura Limpia y Buenas Prácticas (Clean Code)

Para mantener una base de código mantenible, escalable y comprensible durante las 7 semanas de desarrollo:

### 9.1. Principio de Responsabilidad Única (SRP)
* Cada función, clase o componente debe resolver **una única tarea bien delimitada**.
* Las funciones no deben exceder idealmente las 25-30 líneas de código. Si una función realiza múltiples acciones (ej. validar entrada, calcular totales, insertar en BD y despachar un correo), debe descomponerse en funciones privadas o auxiliares especializadas.
* En el frontend, los componentes Vue deben enfocarse en la presentación (`template`) e interacción directa. La lógica de negocio pesada, llamadas HTTP y estado global residen en servicios (`services/`) y stores (`stores/`).

### 9.2. Simplicidad y Anti-Sobreingeniería (KISS & YAGNI)
* **KISS (Keep It Simple, Stupid):** Priorizar siempre la solución más simple y legible que satisfaga el requerimiento. No introducir patrones de diseño complejos (fábricas abstractas, micro-servicios, brokers de eventos) no contemplados en el alcance.
* **YAGNI (You Aren't Gonna Need It):** No crear abstracciones especulativas ni utilidades genéricas para casos de uso hipotéticos no descritos en la Entrega 1.

### 9.3. Cláusulas de Guarda (Early Return)
* Evitar el anidamiento excesivo de bloques `if / else` ("código en flecha").
* Validar condiciones previas, errores o casos de borde al inicio de la función y retornar de inmediato:
  ```javascript
  // CORRECTO: Retorno temprano y código lineal
  async function getProductById(id) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('El identificador debe ser un entero positivo.');
    }

    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError(`Producto con ID ${id} no encontrado.`);
    }

    return product;
  }

  // INCORRECTO: Anidamiento innecesario
  // async function getProductById(id) {
  //   if (Number.isInteger(id) && id > 0) {
  //     const product = await productRepository.findById(id);
  //     if (product) {
  //       return product;
  //     } else {
  //       throw new NotFoundError(...);
  //     }
  //   } else {
  //     throw new ValidationError(...);
  //   }
  // }
  ```

### 9.4. No Repetirse (DRY)
* Extraer operaciones comunes (como el formateo de moneda a COP/USD, instanciación de conexiones o manejo de respuestas uniformes) a módulos dentro de `src/utils/`.
* No duplicar validaciones ni constantes de negocio en archivos dispersos; centralizarlas.

### 9.5. Manejo Asíncrono Limpio
* Emplear exclusivamente sintaxis moderna `async / await`. Se prohíbe el encadenamiento confuso de promesas (`.then().catch().then()`) o el anidamiento de callbacks ("Callback Hell").
* Toda operación de entrada/salida (I/O hacia la base de datos o peticiones HTTP de Axios) debe estar envuelta en bloques de control de error que deleguen al middleware central de excepciones.

---

## 10. Política Estricta de Comentarios (Código Autoexplicativo)

El código limpio es su propia y mejor documentación. La presencia masiva de comentarios obvios genera ruido visual, se desactualiza rápidamente y dificulta la lectura.

### 10.1. Comentarios Prohibidos (Ruido y Redundancia)
Queda estrictamente prohibido escribir comentarios que expliquen **qué** hace una línea de código cuando esto es evidente por el nombre de la variable o función:

```javascript
// INCORRECTO: Comentarios obvios y redundantes (PROHIBIDOS)
// Incrementa el contador en 1
count += 1;

// Obtiene la lista de productos de la base de datos
const products = await getProducts();

// Si el usuario no está autenticado retorna 401
if (!isAuthenticated) {
  return res.status(401).json(...);
}

// Declaración de variable total
let total = 0;
```

Tampoco se permite dejar bloques de **código comentado (código muerto o antiguo)** en ningún archivo del repositorio. Todo código descartado debe ser eliminado físicamente; para su rescate o trazabilidad se utiliza el historial de Git.

### 10.2. Comentarios Permitidos y Exigidos (El "Por Qué", no el "Qué")
Los comentarios solo deben utilizarse para documentar el **motivo, justificación o contexto de una decisión no evidente**:

1. **Decisiones de Negocio o Algoritmos Críticos:**
   ```javascript
   // Se utiliza bloqueo pesimista FOR UPDATE para evitar condiciones de carrera (race conditions)
   // en el inventario cuando múltiples clientes compran el último ítem disponible simultáneamente.
   const product = await client.query('SELECT stock FROM producto WHERE id = $1 FOR UPDATE', [id]);
   ```
2. **Workarounds o Restricciones de Terceros:**
   ```javascript
   // Render utiliza un proxy inverso para SSL; trust proxy es necesario para que Express
   // detecte conexiones seguras y transmita cookies con la directiva Secure.
   app.set('trust proxy', 1);
   ```
3. **Casos de Borde Inusuales:**
   ```javascript
   // El estándar RFC 7807 exige UTF-8 estricto en el content-type para errores semánticos
   ```
4. **JSDoc Conciso en Métodos de Servicio:**
   Únicamente para clarificar parámetros de entrada complejos y valor de retorno si no es obvio por el tipado implícito:
   ```javascript
   /**
    * Ejecuta la transacción atómica de compra: bloquea stock, liquida total y persiste pedido.
    * @param {{ nombre_cliente: string, contacto_cliente: string, items: Array<{id_producto: number, cantidad: number}> }} orderData
    * @returns {Promise<Order>} Pedido confirmado con sus líneas de detalle.
    */
   ```

