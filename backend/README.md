# Backend — Tienda en Línea Modular

Servidor de API REST para la tienda en línea modular, construido sobre Node.js, Express y PostgreSQL siguiendo la arquitectura en capas (`routes` → `controllers` → `services` → `models`), principios de Clean Code (SRP, KISS, Early Return) y el contrato OpenAPI 3.0.

---

## 1. Requisitos Previos

* **Node.js**: v18+ LTS (recomendado v20+).
* **npm**: v9+ (incluido con Node.js).
* **PostgreSQL**: v14+ instalado y en ejecución en el puerto `5432`.
* **PowerShell**: Entorno de terminal en Windows.

---

## 2. Preparación de la Base de Datos Local

Desde una terminal PowerShell conectada al cliente de PostgreSQL (`psql`):

```powershell
# Iniciar sesión en psql con usuario administrador local
psql -U postgres

# Dentro de la consola psql, crear la base de datos
CREATE DATABASE tienda_modular;

# Salir de psql
\q
```

---

## 3. Instalación y Configuración del Entorno

1. Navegar a la carpeta del backend:
   ```powershell
   cd backend
   ```

2. Instalar dependencias locales:
   ```powershell
   npm install
   ```

3. Crear el archivo `.env` a partir de `.env.example`:
   ```powershell
   Copy-Item .env.example .env
   ```

4. Ajustar las variables en `.env` según tus credenciales de PostgreSQL:
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/tienda_modular
   CORS_ORIGINS=http://localhost:5173
   ```

---

## 4. Inicialización y Carga de Datos (Seed)

Ejecutar los scripts de base de datos en el siguiente orden:

```powershell
# 1. Crear tablas, extensiones e índices definidos en docs/schema.sql
npm run db:init

# 2. Cargar datos iniciales de prueba (2 categorías y 5 productos oficiales de docs/schema.sql)
npm run db:seed

# 3. (Opcional) Cargar catálogo ampliado para pruebas de paginación y búsqueda (4 categorías y 14 productos)
npm run db:seed:expanded
```

---

## 5. Scripts Disponibles en `package.json`

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor con recarga en caliente (`nodemon`) en `http://localhost:3000`. |
| `npm start` | Inicia el servidor en modo producción con `node src/server.js`. |
| `npm run db:init` | Ejecuta el DDL de `docs/schema.sql` (creación de tablas e índices). |
| `npm run db:seed` | Inserta las categorías y productos iniciales definidos en `docs/schema.sql`. |
| `npm run db:seed:expanded` | Carga un catálogo extendido de prueba (4 categorías, 14 productos) para probar paginación y filtros. |
| `npm test` | Ejecuta la suite de pruebas unitarias y de integración con `jest` y `supertest`. |

---

## 6. Documentación Interactiva y Pruebas con Swagger UI

Una vez iniciado el servidor (`npm run dev` o `npm start`):

1. Abrir en el navegador:
   ```text
   http://localhost:3000/api-docs
   ```
2. La documentación se genera dinámicamente desde [`docs/openapi.yaml`](../docs/openapi.yaml).
3. Seleccionar el servidor local `http://localhost:3000/api/v1`.
4. Utilizar el botón **Try it out** en cualquier endpoint (`GET /categorias`, `POST /categorias`, `GET /productos`, etc.) para enviar peticiones en tiempo real contra el backend local.

---

## 7. Endpoints Disponibles en esta Entrega

### Estado del Sistema
* `GET /api/health`: Estado de salud del servicio y comprobación de conectividad activa a PostgreSQL.

### Categorías (`/api/v1/categorias`)
* `GET /api/v1/categorias`: Listar todas las categorías disponibles.
* `GET /api/v1/categorias/:id`: Obtener el detalle de una categoría por su ID.
* `POST /api/v1/categorias`: Crear una nueva categoría *(validación de duplicados y sanitización)*.

### Productos (`/api/v1/productos`)
* `GET /api/v1/productos`: Listar productos con filtros (`id_categoria`, `q`) y paginación (`page`, `limit`).
* `GET /api/v1/productos/:id`: Obtener el detalle de un producto por su ID.
* `POST /api/v1/productos`: Registrar un nuevo producto *(validación de tipos, existencia de categoría, stock y precio no negativos)*.
