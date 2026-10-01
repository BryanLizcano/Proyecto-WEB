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

  describe('POST /api/v1/productos', () => {
    it('debe responder 422 cuando la categoría referenciada no existe', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/v1/productos')
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

    it('debe crear un producto válido y responder 201', async () => {
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Calzado Deportivo' }],
      });
      query.mockResolvedValueOnce({
        rows: [
          {
            id_producto: 10,
            id_categoria: 1,
            nombre: 'Tenis Nuevos',
            descripcion: null,
            precio: '99.50',
            stock: 20,
            imagen_url: null,
          },
        ],
      });

      const res = await request(app)
        .post('/api/v1/productos')
        .send({
          id_categoria: 1,
          nombre: 'Tenis Nuevos',
          precio: 99.5,
          stock: 20,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id_producto).toBe(10);
      expect(res.body.data.categoria_nombre).toBe('Calzado Deportivo');
    });

    it('debe responder 422 cuando el precio o stock son negativos', async () => {
      const res = await request(app)
        .post('/api/v1/productos')
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
