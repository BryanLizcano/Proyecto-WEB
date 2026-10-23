const request = require('supertest');
const { query } = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  pool: {
    query: jest.fn(),
  },
  query: jest.fn(),
}));

const app = require('../src/app');

describe('Endpoints de Productos (/api/v1/productos)', () => {
  const mockAdmin = {
    id_administrador: 1,
    nombre: 'Administrador General',
    email: 'admin@tiendamodular.com',
    creado_en: '2026-09-30T12:00:00.000Z',
  };

  const authCookie = 'admin_session=1; XSRF-TOKEN=valid-csrf-token';
  const validCsrfHeader = 'valid-csrf-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/productos', () => {
    it('debe listar productos con paginaciÃ³n y cÃ³digo 200', async () => {
      const mockProducts = [
        {
          id_producto: 1,
          id_categoria: 1,
          categoria_nombre: 'Calzado Deportivo',
          nombre: 'Tenis Running',
          descripcion: 'Ligeros',
          precio: 89.99,
          stock: 25,
          imagen_url: null,
        },
      ];

      query.mockResolvedValueOnce({ rows: mockProducts });
      query.mockResolvedValueOnce({ rows: [{ total: 1 }] });

      const res = await request(app).get('/api/v1/productos?page=1&limit=10');

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
  });

  describe('POST /api/v1/productos (HU-05)', () => {
    it('debe rechazar con 401 si no hay sesiÃ³n de administrador activa', async () => {
      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', 'XSRF-TOKEN=valid-csrf-token')
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Tenis Trail',
          precio: 120,
          stock: 10,
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('debe rechazar con 403 si el encabezado X-CSRF-Token estÃ¡ ausente', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .send({
          id_categoria: 1,
          nombre: 'Tenis Trail',
          precio: 120,
          stock: 10,
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('debe rechazar con 403 si el token CSRF es invÃ¡lido o no coincide', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', 'admin_session=1; XSRF-TOKEN=valid-csrf-token')
        .set('X-CSRF-Token', 'token-invalido')
        .send({
          id_categoria: 1,
          nombre: 'Tenis Trail',
          precio: 120,
          stock: 10,
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('debe responder 422 cuando la categorÃ­a referenciada no existe', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 9999,
          nombre: 'Producto HuÃ©rfano',
          precio: 50.0,
          stock: 10,
        });

      expect(res.status).toBe(422);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'id_categoria' }),
        ])
      );
    });

    it('debe responder 422 si id_categoria es negativo o nulo', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: -1,
          nombre: 'Producto InvÃ¡lido',
          precio: 10,
          stock: 5,
        });

      expect(res.status).toBe(422);
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'id_categoria' }),
        ])
      );
    });

    it('debe responder 422 si id_categoria es un valor flotante o no entero', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1.5,
          nombre: 'Producto InvÃ¡lido',
          precio: 10,
          stock: 5,
        });

      expect(res.status).toBe(422);
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'id_categoria' }),
        ])
      );
    });

    it('debe responder 422 cuando el precio es negativo', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Producto Precio Negativo',
          precio: -10,
          stock: 5,
        });

      expect(res.status).toBe(422);
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'precio' }),
        ])
      );
    });

    it('debe responder 422 cuando el stock es negativo', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Producto Stock Negativo',
          precio: 10,
          stock: -5,
        });

      expect(res.status).toBe(422);
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'stock' }),
        ])
      );
    });

    it('debe responder 422 cuando el precio o stock son negativos simultÃ¡neamente', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Producto InvÃ¡lido',
          precio: -10,
          stock: -5,
        });

      expect(res.status).toBe(422);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
      expect(res.body.details).toHaveLength(2);
    });

    it('debe responder 422 cuando el nombre estÃ¡ ausente o vacÃ­o', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: '   ',
          precio: 20,
          stock: 5,
        });

      expect(res.status).toBe(422);
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'nombre' }),
        ])
      );
    });

    it('debe responder 422 cuando el nombre excede los 150 caracteres', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const longName = 'A'.repeat(151);
      const resTooLong = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: longName,
          precio: 20,
          stock: 5,
        });

      expect(resTooLong.status).toBe(422);
      expect(resTooLong.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'nombre' }),
        ])
      );
    });

    it('debe responder 422 cuando stock no es un nÃºmero entero', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Producto Decimal Stock',
          precio: 25.0,
          stock: 4.5,
        });

      expect(res.status).toBe(422);
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'stock' }),
        ])
      );
    });

    it('debe responder 422 si imagen_url no es una cadena de texto', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Producto Tipo InvÃ¡lido',
          precio: 49.99,
          stock: 5,
          imagen_url: 99999,
        });

      expect(res.status).toBe(422);
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'imagen_url' }),
        ])
      );
    });

    it('debe responder 422 cuando imagen_url supera los 255 caracteres', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const longUrl = `https://example.com/images/${'a'.repeat(240)}.jpg`;
      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Producto URL Larga',
          precio: 49.99,
          stock: 5,
          imagen_url: longUrl,
        });

      expect(res.status).toBe(422);
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'imagen_url' }),
        ])
      );
    });

    it('debe responder 422 si descripcion no es una cadena de texto', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Producto DescripciÃ³n InvÃ¡lida',
          descripcion: 12345,
          precio: 49.99,
          stock: 5,
        });

      expect(res.status).toBe(422);
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'descripcion' }),
        ])
      );
    });

    it('debe responder 422 si la imagen_url no tiene formato URI vÃ¡lido', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Producto con URL InvÃ¡lida',
          precio: 49.99,
          stock: 5,
          imagen_url: 'esto-no-es-una-url',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'imagen_url' }),
        ])
      );
    });

    it('debe crear un producto vÃ¡lido con stock e imagen y responder 201', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Calzado Deportivo' }],
      });
      query.mockResolvedValueOnce({
        rows: [
          {
            id_producto: 10,
            id_categoria: 1,
            nombre: 'Tenis Nuevos',
            descripcion: 'AmortiguaciÃ³n suave',
            precio: '99.50',
            stock: 20,
            imagen_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
          },
        ],
      });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Tenis Nuevos',
          descripcion: 'AmortiguaciÃ³n suave',
          precio: 99.5,
          stock: 20,
          imagen_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id_producto).toBe(10);
      expect(res.body.data.categoria_nombre).toBe('Calzado Deportivo');
    });

    it('debe permitir crear un producto omitiendo descripcion e imagen_url', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Calzado Deportivo' }],
      });
      query.mockResolvedValueOnce({
        rows: [
          {
            id_producto: 15,
            id_categoria: 1,
            nombre: 'BalÃ³n BÃ¡sico',
            descripcion: null,
            precio: '25.00',
            stock: 10,
            imagen_url: null,
          },
        ],
      });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'BalÃ³n BÃ¡sico',
          precio: 25.0,
          stock: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.descripcion).toBeNull();
      expect(res.body.data.imagen_url).toBeNull();
    });

    it('debe sanitizar contra XSS en nombre y descripciÃ³n del producto', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Calzado Deportivo' }],
      });
      query.mockImplementationOnce((sql, params) => {
        return Promise.resolve({
          rows: [
            {
              id_producto: 11,
              id_categoria: params[0],
              nombre: params[1],
              descripcion: params[2],
              precio: params[3],
              stock: params[4],
              imagen_url: params[5],
            },
          ],
        });
      });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: '<script>alert("XSS")</script> Tenis',
          descripcion: '<b>Excelente</b> calidad',
          precio: 75.0,
          stock: 12,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.nombre).not.toContain('<script>');
      expect(res.body.data.nombre).toContain('&lt;script&gt;');
      expect(res.body.data.descripcion).not.toContain('<b>');
      expect(res.body.data.descripcion).toContain('&lt;b&gt;');
    });
  });

  describe('GET /api/v1/productos/:id', () => {
    it('debe responder 404 si el producto no existe', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/v1/productos/999');

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/productos/:id (HU-06)', () => {
    it('debe rechazar con 401 si no hay sesiÃ³n de administrador activa', async () => {
      const res = await request(app)
        .put('/api/v1/productos/1')
        .set('Cookie', 'XSRF-TOKEN=valid-csrf-token')
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Tenis Editados',
          precio: 99.99,
          stock: 15,
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('debe rechazar con 403 si el encabezado X-CSRF-Token estÃ¡ ausente', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .put('/api/v1/productos/1')
        .set('Cookie', authCookie)
        .send({
          id_categoria: 1,
          nombre: 'Tenis Editados',
          precio: 99.99,
          stock: 15,
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('debe rechazar con 403 si el token CSRF es invÃ¡lido o no coincide', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .put('/api/v1/productos/1')
        .set('Cookie', 'admin_session=1; XSRF-TOKEN=valid-csrf-token')
        .set('X-CSRF-Token', 'token-invalido')
        .send({
          id_categoria: 1,
          nombre: 'Tenis Editados',
          precio: 99.99,
          stock: 15,
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('debe responder 400 si el id no es un nÃºmero entero positivo vÃ¡lido', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .put('/api/v1/productos/abc')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Tenis Editados',
          precio: 99.99,
          stock: 15,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('BAD_REQUEST');
    });

    it('debe responder 404 si el producto a actualizar no existe', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/api/v1/productos/999')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Tenis Editados',
          precio: 99.99,
          stock: 15,
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('debe responder 422 si la categorÃ­a referenciada no existe', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [
          {
            id_producto: 1,
            id_categoria: 1,
            nombre: 'Tenis Originales',
            precio: '80.00',
            stock: 10,
          },
        ],
      });
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/api/v1/productos/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 999,
          nombre: 'Tenis Editados',
          precio: 99.99,
          stock: 15,
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'id_categoria' }),
        ])
      );
    });

    it('debe responder 422 si precio, stock o imagen_url son invÃ¡lidos', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .put('/api/v1/productos/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Tenis InvÃ¡lidos',
          precio: -25,
          stock: 4.5,
          imagen_url: 'invalida-url',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'precio' }),
          expect.objectContaining({ field: 'stock' }),
          expect.objectContaining({ field: 'imagen_url' }),
        ])
      );
    });

    it('debe responder 422 si el nombre estÃ¡ ausente o vacÃ­o', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .put('/api/v1/productos/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: '   ',
          precio: 50,
          stock: 10,
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'nombre' }),
        ])
      );
    });

    it('debe responder 422 si el nombre excede los 150 caracteres', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .put('/api/v1/productos/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'A'.repeat(151),
          precio: 50,
          stock: 10,
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'nombre' }),
        ])
      );
    });

    it('debe actualizar el producto exitosamente y responder 200 con categoria_nombre', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [
          {
            id_producto: 1,
            id_categoria: 1,
            nombre: 'Tenis Running',
            precio: '89.99',
            stock: 25,
          },
        ],
      });
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Calzado Deportivo' }],
      });
      query.mockResolvedValueOnce({
        rows: [
          {
            id_producto: 1,
            id_categoria: 1,
            nombre: 'Tenis Running Nitro 2.0 (EdiciÃ³n 2026)',
            descripcion: 'VersiÃ³n mejorada',
            precio: '95.00',
            stock: 35,
            imagen_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
          },
        ],
      });

      const res = await request(app)
        .put('/api/v1/productos/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Tenis Running Nitro 2.0 (EdiciÃ³n 2026)',
          descripcion: 'VersiÃ³n mejorada',
          precio: 95.0,
          stock: 35,
          imagen_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id_producto).toBe(1);
      expect(res.body.data.nombre).toBe('Tenis Running Nitro 2.0 (EdiciÃ³n 2026)');
      expect(res.body.data.precio).toBe(95);
      expect(res.body.data.stock).toBe(35);
      expect(res.body.data.categoria_nombre).toBe('Calzado Deportivo');
    });

    it('debe permitir actualizar un producto con precio y stock en 0 (valores lÃ­mites permitidos)', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [
          {
            id_producto: 1,
            id_categoria: 1,
            nombre: 'Tenis Originales',
            precio: '80.00',
            stock: 10,
          },
        ],
      });
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Calzado Deportivo' }],
      });
      query.mockResolvedValueOnce({
        rows: [
          {
            id_producto: 1,
            id_categoria: 1,
            nombre: 'Tenis Gratis Agotados',
            descripcion: 'PromociÃ³n',
            precio: '0.00',
            stock: 0,
            imagen_url: null,
          },
        ],
      });

      const res = await request(app)
        .put('/api/v1/productos/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Tenis Gratis Agotados',
          descripcion: 'PromociÃ³n',
          precio: 0,
          stock: 0,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.precio).toBe(0);
      expect(res.body.data.stock).toBe(0);
    });

    it('debe permitir actualizar un producto omitiendo descripcion e imagen_url', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [
          {
            id_producto: 1,
            id_categoria: 1,
            nombre: 'Tenis Originales',
            precio: '80.00',
            stock: 10,
          },
        ],
      });
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Calzado Deportivo' }],
      });
      query.mockResolvedValueOnce({
        rows: [
          {
            id_producto: 1,
            id_categoria: 1,
            nombre: 'Tenis Sin Opcionales',
            descripcion: null,
            precio: '50.00',
            stock: 5,
            imagen_url: null,
          },
        ],
      });

      const res = await request(app)
        .put('/api/v1/productos/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Tenis Sin Opcionales',
          precio: 50,
          stock: 5,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.descripcion).toBeNull();
      expect(res.body.data.imagen_url).toBeNull();
    });

    it('debe sanitizar contra XSS en nombre y descripciÃ³n al actualizar el producto', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [{ id_producto: 1, id_categoria: 1, nombre: 'Antiguo' }],
      });
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Calzado Deportivo' }],
      });
      query.mockImplementationOnce((sql, params) => {
        return Promise.resolve({
          rows: [
            {
              id_producto: 1,
              id_categoria: params[0],
              nombre: params[1],
              descripcion: params[2],
              precio: params[3],
              stock: params[4],
              imagen_url: params[5],
            },
          ],
        });
      });

      const res = await request(app)
        .put('/api/v1/productos/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: '<script>alert("XSS")</script> Tenis Actualizados',
          descripcion: '<b>Suela de carbono</b>',
          precio: 150.0,
          stock: 8,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.nombre).not.toContain('<script>');
      expect(res.body.data.nombre).toContain('&lt;script&gt;');
      expect(res.body.data.descripcion).not.toContain('<b>');
      expect(res.body.data.descripcion).toContain('&lt;b&gt;');
    });
  });

  describe('DELETE /api/v1/productos/:id', () => {
    it('debe retornar 401 si no hay sesión de administrador activa', async () => {
      const res = await request(app)
        .delete('/api/v1/productos/1')
        .set('X-CSRF-Token', validCsrfHeader);

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('debe retornar 403 si no se envía encabezado X-CSRF-Token', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .delete('/api/v1/productos/1')
        .set('Cookie', authCookie);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('debe retornar 403 si el encabezado X-CSRF-Token no coincide con la cookie', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .delete('/api/v1/productos/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', 'token-invalido-12345');

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('debe retornar 400 si el parámetro id no es un número entero válido', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .delete('/api/v1/productos/abc')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('BAD_REQUEST');
    });

    it('debe retornar 404 si el producto no existe en el catálogo', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .delete('/api/v1/productos/999')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('debe retornar 409 (PRODUCT_HAS_ORDERS) si el producto está referenciado en detalle_pedido', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [
          {
            id_producto: 1,
            id_categoria: 1,
            nombre: 'Tenis Con Pedidos',
            precio: '120.00',
            stock: 5,
          },
        ],
      });
      // Conteo de pedidos asociados > 0
      query.mockResolvedValueOnce({
        rows: [{ total: 3 }],
      });

      const res = await request(app)
        .delete('/api/v1/productos/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader);

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('PRODUCT_HAS_ORDERS');
      expect(res.body.message).toContain('No es posible eliminar el producto porque existen pedidos registrados asociados');
    });

    it('debe retornar 409 (PRODUCT_HAS_ORDERS) si la base de datos lanza error 23503 por clave foránea', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [
          {
            id_producto: 1,
            id_categoria: 1,
            nombre: 'Tenis Con Pedidos Ocultos',
            precio: '120.00',
            stock: 5,
          },
        ],
      });
      query.mockResolvedValueOnce({
        rows: [{ total: 0 }],
      });
      // Simular fallo de FK con código 23503 en DELETE
      const foreignKeyError = new Error('foreign key constraint violation');
      foreignKeyError.code = '23503';
      query.mockRejectedValueOnce(foreignKeyError);

      const res = await request(app)
        .delete('/api/v1/productos/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader);

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('PRODUCT_HAS_ORDERS');
    });

    it('debe eliminar exitosamente el producto cuando no tiene pedidos asociados y retornar 200', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [
          {
            id_producto: 2,
            id_categoria: 1,
            nombre: 'Producto Sin Pedidos',
            precio: '80.00',
            stock: 10,
          },
        ],
      });
      query.mockResolvedValueOnce({
        rows: [{ total: 0 }],
      });
      query.mockResolvedValueOnce({
        rowCount: 1,
      });

      const res = await request(app)
        .delete('/api/v1/productos/2')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Producto eliminado exitosamente.');
    });
  });
});
