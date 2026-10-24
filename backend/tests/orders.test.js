const request = require('supertest');
const { pool, query } = require('../src/config/db');

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

jest.mock('../src/config/db', () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn(),
  },
  query: jest.fn(),
}));

const app = require('../src/app');

describe('Endpoints de Pedidos (/api/v1/pedidos)', () => {
  const mockAdmin = {
    id_administrador: 1,
    nombre: 'Administrador General',
    email: 'admin@tiendamodular.com',
    creado_en: '2026-09-30T12:00:00.000Z',
  };

  const authCookie = 'admin_session=1; XSRF-TOKEN=valid-csrf-token';
  const publicCookie = 'XSRF-TOKEN=valid-csrf-token';
  const validCsrfHeader = 'valid-csrf-token';

  beforeEach(() => {
    jest.clearAllMocks();
    pool.connect.mockResolvedValue(mockClient);
    mockClient.query.mockReset();
    mockClient.release.mockReset();
  });

  describe('POST /api/v1/pedidos (HU-14: Confirmar pedido y descontar stock)', () => {
    it('debe rechazar con 403 si falta el encabezado X-CSRF-Token', async () => {
      const res = await request(app)
        .post('/api/v1/pedidos')
        .set('Cookie', publicCookie)
        .send({
          nombre_cliente: 'Carlos Mendoza',
          contacto_cliente: 'carlos@example.com',
          items: [{ id_producto: 1, cantidad: 1 }],
        });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('debe rechazar con 403 si el encabezado X-CSRF-Token no coincide', async () => {
      const res = await request(app)
        .post('/api/v1/pedidos')
        .set('Cookie', publicCookie)
        .set('X-CSRF-Token', 'token-invalido')
        .send({
          nombre_cliente: 'Carlos Mendoza',
          contacto_cliente: 'carlos@example.com',
          items: [{ id_producto: 1, cantidad: 1 }],
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('debe retornar 422 si falta nombre_cliente o contacto_cliente', async () => {
      const res = await request(app)
        .post('/api/v1/pedidos')
        .set('Cookie', publicCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          nombre_cliente: '',
          contacto_cliente: '   ',
          items: [{ id_producto: 1, cantidad: 1 }],
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'nombre_cliente' }),
          expect.objectContaining({ field: 'contacto_cliente' }),
        ])
      );
    });

    it('debe retornar 422 si items está vacío o contiene valores inválidos', async () => {
      const res = await request(app)
        .post('/api/v1/pedidos')
        .set('Cookie', publicCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          nombre_cliente: 'Carlos Mendoza',
          contacto_cliente: '3001234567',
          items: [
            { id_producto: -1, cantidad: 0 },
            { id_producto: 'abc', cantidad: -3 },
          ],
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
      expect(res.body.details.length).toBeGreaterThanOrEqual(2);
    });

    it('debe retornar 404 (PRODUCT_NOT_FOUND) y hacer ROLLBACK si un producto no existe', async () => {
      mockClient.query.mockImplementation((sql, params) => {
        if (sql === 'BEGIN') return Promise.resolve();
        if (sql.includes('SELECT') && sql.includes('FOR UPDATE')) {
          // Simular que el producto 999 no existe en la BD
          return Promise.resolve({ rows: [] });
        }
        if (sql === 'ROLLBACK') return Promise.resolve();
        return Promise.resolve({ rows: [] });
      });

      const res = await request(app)
        .post('/api/v1/pedidos')
        .set('Cookie', publicCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          nombre_cliente: 'Carlos Mendoza',
          contacto_cliente: 'carlos@example.com',
          items: [{ id_producto: 999, cantidad: 1 }],
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('PRODUCT_NOT_FOUND');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('debe retornar 409 (INSUFFICIENT_STOCK) y hacer ROLLBACK si el stock disponible es menor a la cantidad solicitada', async () => {
      mockClient.query.mockImplementation((sql, params) => {
        if (sql === 'BEGIN') return Promise.resolve();
        if (sql.includes('SELECT') && sql.includes('FOR UPDATE')) {
          return Promise.resolve({
            rows: [
              {
                id_producto: 1,
                nombre: 'Tenis Running Nitro 2.0',
                precio: '89.99',
                stock: 1, // Solo hay 1 unidad
              },
            ],
          });
        }
        if (sql === 'ROLLBACK') return Promise.resolve();
        return Promise.resolve({ rows: [] });
      });

      const res = await request(app)
        .post('/api/v1/pedidos')
        .set('Cookie', publicCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          nombre_cliente: 'Carlos Mendoza',
          contacto_cliente: 'carlos@example.com',
          items: [{ id_producto: 1, cantidad: 2 }], // Se solicitan 2
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('INSUFFICIENT_STOCK');
      expect(res.body.message).toContain('Stock insuficiente para el producto');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'items[0].cantidad' }),
        ])
      );
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('debe crear el pedido exitosamente (201), descontar stock, calcular total en backend y hacer COMMIT', async () => {
      mockClient.query.mockImplementation((sql, params) => {
        if (sql === 'BEGIN') return Promise.resolve();
        if (sql.includes('SELECT') && sql.includes('FOR UPDATE')) {
          if (params[0] === 1) {
            return Promise.resolve({
              rows: [{ id_producto: 1, nombre: 'Tenis Running Nitro 2.0', precio: '89.99', stock: 10 }],
            });
          }
          if (params[0] === 2) {
            return Promise.resolve({
              rows: [{ id_producto: 2, nombre: 'Camiseta Dry-Fit', precio: '24.90', stock: 5 }],
            });
          }
        }
        if (sql.includes('UPDATE producto SET stock = stock - $1')) {
          return Promise.resolve({ rowCount: 1 });
        }
        if (sql.includes('INSERT INTO pedido')) {
          return Promise.resolve({
            rows: [
              {
                id_pedido: 101,
                nombre_cliente: params[0],
                contacto_cliente: params[1],
                fecha: '2026-10-01T15:30:00.000Z',
                total: params[2],
                estado: 'PENDIENTE',
              },
            ],
          });
        }
        if (sql.includes('INSERT INTO detalle_pedido')) {
          return Promise.resolve({
            rows: [{ id_detalle: params[1] === 1 ? 1 : 2 }],
          });
        }
        if (sql === 'COMMIT') return Promise.resolve();
        return Promise.resolve({ rows: [] });
      });

      const res = await request(app)
        .post('/api/v1/pedidos')
        .set('Cookie', publicCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          nombre_cliente: '<script>alert("XSS")</script> Carlos Mendoza',
          contacto_cliente: 'carlos@example.com / +57 300 1234567',
          items: [
            { id_producto: 1, cantidad: 2 }, // 2 * 89.99 = 179.98
            { id_producto: 2, cantidad: 1 }, // 1 * 24.90 = 24.90 -> Total: 204.88
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id_pedido).toBe(101);
      expect(res.body.data.total).toBe(204.88);
      expect(res.body.data.estado).toBe('PENDIENTE');
      // Sanitización XSS
      expect(res.body.data.nombre_cliente).not.toContain('<script>');
      expect(res.body.data.nombre_cliente).toContain('&lt;script&gt;');
      // Detalles
      expect(res.body.data.detalles).toHaveLength(2);
      expect(res.body.data.detalles[0]).toEqual({
        id_detalle: 1,
        id_producto: 1,
        nombre_producto: 'Tenis Running Nitro 2.0',
        cantidad: 2,
        precio_unitario: 89.99,
        subtotal: 179.98,
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/v1/pedidos (HU-17: Historial de pedidos admin)', () => {
    it('debe retornar 401 si no hay sesión de administrador', async () => {
      const res = await request(app).get('/api/v1/pedidos');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('debe listar pedidos con paginación y permitir filtro por estado', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] }); // Auth check
      query.mockResolvedValueOnce({ rows: [{ total: 1 }] }); // Count query
      query.mockResolvedValueOnce({
        rows: [
          {
            id_pedido: 101,
            nombre_cliente: 'Carlos Mendoza',
            contacto_cliente: 'carlos@example.com',
            fecha: '2026-10-01T15:30:00.000Z',
            total: '204.88',
            estado: 'PENDIENTE',
          },
        ],
      });

      const res = await request(app)
        .get('/api/v1/pedidos?estado=PENDIENTE&page=1&limit=10')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('debe rechazar con 400 si el filtro de estado no es un valor permitido', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .get('/api/v1/pedidos?estado=INVALIDO')
        .set('Cookie', authCookie);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('BAD_REQUEST');
    });

    it('debe rechazar con 400 si page o limit son inválidos', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .get('/api/v1/pedidos?page=-5')
        .set('Cookie', authCookie);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('BAD_REQUEST');
    });

    it('debe rechazar con 400 si limit excede 50 o no es numérico', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .get('/api/v1/pedidos?limit=100')
        .set('Cookie', authCookie);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('BAD_REQUEST');
    });

    it('debe calcular totalPages en 0 cuando no hay registros de pedidos', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({ rows: [{ total: 0 }] });
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/v1/pedidos')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta).toEqual({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });
  });

  describe('GET /api/v1/pedidos/:id (HU-17: Detalle de pedido admin)', () => {
    it('debe retornar 401 si no hay sesión de administrador activa', async () => {
      const res = await request(app).get('/api/v1/pedidos/101');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('debe retornar 400 si el id no es un número entero válido', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .get('/api/v1/pedidos/invalido')
        .set('Cookie', authCookie);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('BAD_REQUEST');
    });

    it('debe retornar 404 si el pedido no existe', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] }); // Auth check
      query.mockResolvedValueOnce({ rows: [] }); // No order found

      const res = await request(app)
        .get('/api/v1/pedidos/999')
        .set('Cookie', authCookie);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('debe retornar 200 con la orden y sus líneas de detalle', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] }); // Auth check
      query.mockResolvedValueOnce({
        rows: [
          {
            id_pedido: 101,
            nombre_cliente: 'Carlos Mendoza',
            contacto_cliente: 'carlos@example.com',
            fecha: '2026-10-01T15:30:00.000Z',
            total: '89.99',
            estado: 'PENDIENTE',
          },
        ],
      });
      query.mockResolvedValueOnce({
        rows: [
          {
            id_detalle: 1,
            id_producto: 1,
            nombre_producto: 'Tenis Nitro',
            cantidad: 1,
            precio_unitario: '89.99',
            subtotal: '89.99',
          },
        ],
      });

      const res = await request(app)
        .get('/api/v1/pedidos/101')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.id_pedido).toBe(101);
      expect(res.body.data.detalles).toHaveLength(1);
    });
  });

  describe('PATCH /api/v1/pedidos/:id/estado (HU-18: Actualizar estado operativo)', () => {
    it('debe retornar 401 si no hay sesión admin', async () => {
      const res = await request(app)
        .patch('/api/v1/pedidos/101/estado')
        .set('X-CSRF-Token', validCsrfHeader)
        .send({ estado: 'CONFIRMADO' });

      expect(res.status).toBe(401);
    });

    it('debe retornar 422 si el estado no es válido', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .patch('/api/v1/pedidos/101/estado')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({ estado: 'ESTADO_INVENTADO' });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
    });

    it('debe actualizar el estado del pedido y retornar 200 con el pedido actualizado', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] }); // Auth check
      query.mockResolvedValueOnce({ rows: [{ id_pedido: 101 }] }); // Order exists check
      query.mockResolvedValueOnce({
        rows: [
          {
            id_pedido: 101,
            nombre_cliente: 'Carlos Mendoza',
            contacto_cliente: 'carlos@example.com',
            fecha: '2026-10-01T15:30:00.000Z',
            total: '204.88',
            estado: 'CONFIRMADO',
          },
        ],
      });

      const res = await request(app)
        .patch('/api/v1/pedidos/101/estado')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({ estado: 'CONFIRMADO' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.estado).toBe('CONFIRMADO');
    });
  });
});
