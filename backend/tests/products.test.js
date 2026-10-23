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
    it('debe listar productos con paginación y código 200', async () => {
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
    it('debe rechazar con 401 si no hay sesión de administrador activa', async () => {
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

    it('debe rechazar con 403 si el encabezado X-CSRF-Token está ausente', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', 'admin_session=1; XSRF-TOKEN=valid-csrf-token')
        .send({
          id_categoria: 1,
          nombre: 'Tenis Trail',
          precio: 120,
          stock: 10,
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('debe rechazar con 403 si el token CSRF es inválido o no coincide', async () => {
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

    it('debe responder 422 cuando la categoría referenciada no existe', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] }); // Auth
      query.mockResolvedValueOnce({ rows: [] }); // findCategoryById no existe

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 9999,
          nombre: 'Producto Huérfano',
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

    it('debe responder 422 cuando el precio o stock son negativos', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Producto Inválido',
          precio: -10,
          stock: -5,
        });

      expect(res.status).toBe(422);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
      expect(res.body.details).toHaveLength(2);
    });

    it('debe responder 422 cuando id_categoria es inválido o no entero', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1.5,
          nombre: 'Producto Inválido',
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

    it('debe responder 422 cuando nombre está ausente, vacío o excede 150 caracteres', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const resMissing = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: '   ',
          precio: 20,
          stock: 5,
        });

      expect(resMissing.status).toBe(422);
      expect(resMissing.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'nombre' }),
        ])
      );

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

    it('debe responder 422 cuando stock no es un número entero', async () => {
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
          nombre: 'Producto Tipo Inválido',
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
          nombre: 'Producto Descripción Inválida',
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

    it('debe responder 422 si la imagen_url no tiene formato URI válido', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          id_categoria: 1,
          nombre: 'Producto con URL Inválida',
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

    it('debe crear un producto válido con stock e imagen y responder 201', async () => {
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
            descripcion: 'Amortiguación suave',
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
          descripcion: 'Amortiguación suave',
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
            nombre: 'Balón Básico',
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
          nombre: 'Balón Básico',
          precio: 25.0,
          stock: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.descripcion).toBeNull();
      expect(res.body.data.imagen_url).toBeNull();
    });

    it('debe sanitizar contra XSS en nombre y descripción del producto', async () => {
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
});
