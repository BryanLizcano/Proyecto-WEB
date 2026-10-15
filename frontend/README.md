# Ritmo Store Frontend

Frontend de tienda construido con Vue 3, Vite, Vue Router, Pinia, Axios y Sass.

## Desarrollo local

1. Inicia PostgreSQL y configura el backend siguiendo `../backend/README.md`.
2. Desde `frontend/`, ejecuta `npm install`.
3. Copia `.env.example` a `.env` si necesitas cambiar la URL de la API.
4. Ejecuta `npm run dev` y abre la URL que muestra Vite (por defecto `http://localhost:5173`).

## Alcance conectado

- El catálogo consume categorías y productos; permite búsqueda, filtro y paginación.
- El detalle consulta un producto por ID.
- El carrito valida cantidades contra el stock recibido y persiste en `localStorage`.
- El panel lista y crea productos/categorías mediante los `POST` existentes.

El backend actual aún no implementa `/auth/login`, `/auth/me`, `/auth/logout` ni pedidos. Por eso la autenticación del panel no estará operativa hasta añadir esos endpoints, y el botón de finalizar compra permanece deshabilitado. No se usa una contraseña almacenada en el frontend como sustituto de seguridad.

## Scripts

- `npm run dev`: servidor de desarrollo.
- `npm run build`: compilación de producción.
- `npm run preview`: previsualiza la compilación.
