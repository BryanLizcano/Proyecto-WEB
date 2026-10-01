const request = require('supertest');
const { query } = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  pool: {
    query: jest.fn(),
  },
  query: jest.fn(),
}));

const app = require('../src/app');

describe('Endpoints de Categorías (/api/v1/categorias)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/categorias', () => {
    it('debe listar todas las categorías con código 200', async () => {
      const mockCategories = [
        { id_categoria: 1, nombre: 'Calzado Deportivo', descripcion: 'Zapatos' },
        { id_categoria: 2, nombre: 'Ropa', descripcion: 'Prendas' },
      ];
      query.mockResolvedValueOnce({ rows: mockCategories });

      const res = await request(app).get('/api/v1/categorias');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toEqual(mockCategories);
    });
  });

  describe('POST /api/v1/categorias', () => {
    it('debe crear una categoría válida y responder 201', async () => {
      query.mockResolvedValueOnce({ rows: [] });
      const nuevaCategoria = {
        id_categoria: 3,
        nombre: 'Accesorios',
        descripcion: 'Bolsos y gorras',
      };
      query.mockResolvedValueOnce({ rows: [nuevaCategoria] });

      const res = await request(app)
        .post('/api/v1/categorias')
        .send({ nombre: 'Accesorios', descripcion: 'Bolsos y gorras' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id_categoria).toBe(3);
      expect(res.body.data.nombre).toBe('Accesorios');
    });

    it('debe responder 422 si el nombre está vacío o no se proporciona', async () => {
      const res = await request(app)
        .post('/api/v1/categorias')
        .send({ nombre: '   ', descripcion: 'Inválido' });

      expect(res.status).toBe(422);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details[0].field).toBe('nombre');
    });

    it('debe responder 409 si el nombre de la categoría ya existe', async () => {
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Calzado Deportivo' }],
      });

      const res = await request(app)
        .post('/api/v1/categorias')
        .send({ nombre: 'Calzado Deportivo' });

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('DUPLICATE_CATEGORY_NAME');
    });
  });

  describe('GET /api/v1/categorias/:id', () => {
    it('debe responder 400 si el id no es un número entero válido', async () => {
      const res = await request(app).get('/api/v1/categorias/abc');

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('BAD_REQUEST');
    });

    it('debe responder 404 si la categoría no existe', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/v1/categorias/999');

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });
});
