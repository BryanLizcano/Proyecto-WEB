const request = require('supertest');
const bcrypt = require('bcrypt');
const { query } = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  pool: {
    query: jest.fn(),
  },
  query: jest.fn(),
}));

const app = require('../src/app');

describe('Módulo de Clientes - Perfil y Estado de Pedidos (/api/v1/clientes)', () => {
  const validCsrf = 'csrf-token-test-value-12345';
  const clientCookie = `cliente_session=10; XSRF-TOKEN=${validCsrf}`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/clientes/perfil', () => {
    it('debe rechazar con 401 si no hay sesión de cliente activa', async () => {
      const res = await request(app).get('/api/v1/clientes/perfil');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('debe responder 200 con el perfil del cliente logueado', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            id_cliente: 10,
            nombre: 'Carlos Cliente',
            email: 'carlos@cliente.com',
            telefono: '3001234567',
            creado_en: '2026-10-20T10:00:00.000Z',
          },
        ],
      });

      const res = await request(app)
        .get('/api/v1/clientes/perfil')
        .set('Cookie', clientCookie);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id_cliente).toBe(10);
      expect(res.body.data.nombre).toBe('Carlos Cliente');
      expect(res.body.data.email).toBe('carlos@cliente.com');
      expect(res.body.data).not.toHaveProperty('password_hash');
    });
  });

  describe('PUT /api/v1/clientes/perfil', () => {
    it('debe rechazar con 403 si falta el token CSRF', async () => {
      query.mockResolvedValueOnce({
        rows: [{ id_cliente: 10, nombre: 'Carlos', email: 'carlos@cliente.com' }],
      });

      const res = await request(app)
        .put('/api/v1/clientes/perfil')
        .set('Cookie', 'cliente_session=10')
        .send({ nombre: 'Carlos Actualizado', email: 'carlos@cliente.com' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('debe rechazar con 422 si el formato del correo es inválido o el nombre está vacío', async () => {
      query.mockResolvedValueOnce({
        rows: [{ id_cliente: 10, nombre: 'Carlos', email: 'carlos@cliente.com' }],
      });

      const res = await request(app)
        .put('/api/v1/clientes/perfil')
        .set('Cookie', clientCookie)
        .set('X-CSRF-Token', validCsrf)
        .send({ nombre: '', email: 'email-invalido' });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
    });

    it('debe rechazar con 422 si la nueva contraseña tiene menos de 6 caracteres', async () => {
      query.mockResolvedValueOnce({
        rows: [{ id_cliente: 10, nombre: 'Carlos', email: 'carlos@cliente.com' }],
      });

      const res = await request(app)
        .put('/api/v1/clientes/perfil')
        .set('Cookie', clientCookie)
        .set('X-CSRF-Token', validCsrf)
        .send({
          nombre: 'Carlos',
          email: 'carlos@cliente.com',
          currentPassword: 'Password123',
          newPassword: '123',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
    });

    it('debe rechazar con 422 si se envía nueva contraseña sin contraseña actual', async () => {
      query.mockResolvedValueOnce({
        rows: [{ id_cliente: 10, nombre: 'Carlos', email: 'carlos@cliente.com' }],
      });

      const res = await request(app)
        .put('/api/v1/clientes/perfil')
        .set('Cookie', clientCookie)
        .set('X-CSRF-Token', validCsrf)
        .send({
          nombre: 'Carlos',
          email: 'carlos@cliente.com',
          newPassword: 'NuevaPasswordValida123',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
    });

    it('debe rechazar con 409 si el nuevo correo ya pertenece a otro cliente', async () => {
      // 1. clientAuthMiddleware -> findById
      query.mockResolvedValueOnce({
        rows: [{ id_cliente: 10, nombre: 'Carlos', email: 'carlos@cliente.com' }],
      });
      // 2. updateProfile -> findById
      query.mockResolvedValueOnce({
        rows: [{ id_cliente: 10, nombre: 'Carlos', email: 'carlos@cliente.com' }],
      });
      // 3. Promise.all -> admin check
      query.mockResolvedValueOnce({ rows: [] });
      // 4. Promise.all -> client check (devuelve otro cliente)
      query.mockResolvedValueOnce({
        rows: [{ id_cliente: 99, email: 'otro@cliente.com' }],
      });

      const res = await request(app)
        .put('/api/v1/clientes/perfil')
        .set('Cookie', clientCookie)
        .set('X-CSRF-Token', validCsrf)
        .send({
          nombre: 'Carlos',
          email: 'otro@cliente.com',
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('debe rechazar con 409 si el nuevo correo ya pertenece a un administrador', async () => {
      // 1. clientAuthMiddleware -> findById
      query.mockResolvedValueOnce({
        rows: [{ id_cliente: 10, nombre: 'Carlos', email: 'carlos@cliente.com' }],
      });
      // 2. updateProfile -> findById
      query.mockResolvedValueOnce({
        rows: [{ id_cliente: 10, nombre: 'Carlos', email: 'carlos@cliente.com' }],
      });
      // 3. Promise.all -> admin check (devuelve admin existente)
      query.mockResolvedValueOnce({
        rows: [{ id_administrador: 1, email: 'admin@tienda.com' }],
      });
      // 4. Promise.all -> client check
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/api/v1/clientes/perfil')
        .set('Cookie', clientCookie)
        .set('X-CSRF-Token', validCsrf)
        .send({
          nombre: 'Carlos',
          email: 'admin@tienda.com',
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('debe rechazar con 400 si se intenta cambiar contraseña con la contraseña actual incorrecta', async () => {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('PasswordCorrecta123', salt);

      // 1. clientAuthMiddleware -> findById
      query.mockResolvedValueOnce({
        rows: [{ id_cliente: 10, nombre: 'Carlos', email: 'carlos@cliente.com' }],
      });
      // 2. updateProfile -> findById
      query.mockResolvedValueOnce({
        rows: [{ id_cliente: 10, nombre: 'Carlos', email: 'carlos@cliente.com', password_hash: hash }],
      });

      const res = await request(app)
        .put('/api/v1/clientes/perfil')
        .set('Cookie', clientCookie)
        .set('X-CSRF-Token', validCsrf)
        .send({
          nombre: 'Carlos',
          email: 'carlos@cliente.com',
          currentPassword: 'PasswordErronea999',
          newPassword: 'NuevaPasswordSegura123',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_CURRENT_PASSWORD');
    });

    it('debe actualizar los datos del cliente exitosamente con 200', async () => {
      // 1. clientAuthMiddleware -> findById
      query.mockResolvedValueOnce({
        rows: [{ id_cliente: 10, nombre: 'Carlos', email: 'carlos@cliente.com' }],
      });
      // 2. updateProfile -> findById
      query.mockResolvedValueOnce({
        rows: [{ id_cliente: 10, nombre: 'Carlos', email: 'carlos@cliente.com' }],
      });
      // 3. updateProfile -> update
      query.mockResolvedValueOnce({
        rows: [
          {
            id_cliente: 10,
            nombre: 'Carlos Modificado',
            email: 'carlos@cliente.com',
            telefono: '3109998877',
            creado_en: '2026-10-20T10:00:00.000Z',
          },
        ],
      });

      const res = await request(app)
        .put('/api/v1/clientes/perfil')
        .set('Cookie', clientCookie)
        .set('X-CSRF-Token', validCsrf)
        .send({
          nombre: 'Carlos Modificado',
          email: 'carlos@cliente.com',
          telefono: '3109998877',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.nombre).toBe('Carlos Modificado');
      expect(res.body.data.telefono).toBe('3109998877');
    });
  });

  describe('GET /api/v1/clientes/pedidos', () => {
    it('debe rechazar con 401 si no hay sesión de cliente activa', async () => {
      const res = await request(app).get('/api/v1/clientes/pedidos');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('debe responder 200 con el historial de pedidos del cliente', async () => {
      // 1. clientAuthMiddleware -> findById
      query.mockResolvedValueOnce({
        rows: [{ id_cliente: 10, nombre: 'Carlos', email: 'carlos@cliente.com' }],
      });
      // 2. getCustomerOrders -> query
      query.mockResolvedValueOnce({
        rows: [
          {
            id_pedido: 101,
            nombre_cliente: 'Carlos',
            contacto_cliente: 'carlos@cliente.com',
            fecha: '2026-10-21T14:00:00.000Z',
            total: '125.50',
            estado: 'CONFIRMADO',
            id_cliente: 10,
          },
        ],
      });

      const res = await request(app)
        .get('/api/v1/clientes/pedidos')
        .set('Cookie', clientCookie);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id_pedido).toBe(101);
      expect(res.body.data[0].estado).toBe('CONFIRMADO');
    });
  });

  describe('GET /api/v1/clientes/pedidos/:id', () => {
    it('debe rechazar con 401 si no hay sesión de cliente activa', async () => {
      const res = await request(app).get('/api/v1/clientes/pedidos/101');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('debe rechazar con 400 si el parámetro id no es numérico', async () => {
      // 1. clientAuthMiddleware
      query.mockResolvedValueOnce({
        rows: [{ id_cliente: 10, nombre: 'Carlos', email: 'carlos@cliente.com' }],
      });

      const res = await request(app)
        .get('/api/v1/clientes/pedidos/invalido')
        .set('Cookie', clientCookie);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('BAD_REQUEST');
    });

    it('debe rechazar con 404 si el pedido no existe o no pertenece al cliente', async () => {
      // 1. clientAuthMiddleware
      query.mockResolvedValueOnce({
        rows: [{ id_cliente: 10, nombre: 'Carlos', email: 'carlos@cliente.com' }],
      });
      // 2. getCustomerOrderDetail -> select pedido -> vacío
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/v1/clientes/pedidos/999')
        .set('Cookie', clientCookie);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('ORDER_NOT_FOUND');
    });

    it('debe responder 200 con el detalle del pedido y sus ítems', async () => {
      // 1. clientAuthMiddleware
      query.mockResolvedValueOnce({
        rows: [{ id_cliente: 10, nombre: 'Carlos', email: 'carlos@cliente.com' }],
      });
      // 2. select pedido
      query.mockResolvedValueOnce({
        rows: [
          {
            id_pedido: 101,
            nombre_cliente: 'Carlos',
            contacto_cliente: 'carlos@cliente.com',
            fecha: '2026-10-21T14:00:00.000Z',
            total: '89.99',
            estado: 'EN_PREPARACION',
          },
        ],
      });
      // 3. select detalles
      query.mockResolvedValueOnce({
        rows: [
          {
            id_detalle: 1,
            id_producto: 1,
            cantidad: 1,
            precio_unitario: '89.99',
            subtotal: '89.99',
            nombre_producto: 'Tenis Running Nitro 2.0',
            imagen_url: 'https://example.com/nitro.jpg',
          },
        ],
      });

      const res = await request(app)
        .get('/api/v1/clientes/pedidos/101')
        .set('Cookie', clientCookie);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id_pedido).toBe(101);
      expect(res.body.data.estado).toBe('EN_PREPARACION');
      expect(res.body.data.detalles.length).toBe(1);
      expect(res.body.data.detalles[0].nombre_producto).toBe('Tenis Running Nitro 2.0');
    });
  });
});
