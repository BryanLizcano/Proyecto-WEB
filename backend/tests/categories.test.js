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

  describe('POST /api/v1/categorias (HU-02)', () => {
    it('debe rechazar con 401 si no hay sesión de administrador activa', async () => {
      const res = await request(app)
        .post('/api/v1/categorias')
        .set('Cookie', 'XSRF-TOKEN=valid-csrf-token')
        .set('X-CSRF-Token', validCsrfHeader)
        .send({ nombre: 'Accesorios', descripcion: 'Bolsos y gorras' });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('debe rechazar con 403 si el token CSRF falta o no coincide con la cookie', async () => {
      // Mock para la consulta de auth del administrador
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/categorias')
        .set('Cookie', 'admin_session=1; XSRF-TOKEN=valid-csrf-token')
        .set('X-CSRF-Token', 'token-invalido')
        .send({ nombre: 'Accesorios', descripcion: 'Bolsos y gorras' });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('debe crear una categoría válida y responder 201 cuando está autenticado y con token CSRF válido', async () => {
      // 1. Consulta de autenticación
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      // 2. Consulta de duplicados findByName
      query.mockResolvedValueOnce({ rows: [] });
      // 3. Inserción de la nueva categoría
      const nuevaCategoria = {
        id_categoria: 3,
        nombre: 'Accesorios',
        descripcion: 'Bolsos y gorras',
      };
      query.mockResolvedValueOnce({ rows: [nuevaCategoria] });

      const res = await request(app)
        .post('/api/v1/categorias')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({ nombre: 'Accesorios', descripcion: 'Bolsos y gorras' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id_categoria).toBe(3);
      expect(res.body.data.nombre).toBe('Accesorios');
    });

    it('debe responder 422 si el nombre está vacío o no se proporciona', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .post('/api/v1/categorias')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({ nombre: '   ', descripcion: 'Inválido' });

      expect(res.status).toBe(422);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details[0].field).toBe('nombre');
    });

    it('debe responder 409 si el nombre de la categoría ya existe', async () => {
      // 1. Consulta de autenticación
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      // 2. Consulta de duplicados encuentra registro
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Calzado Deportivo' }],
      });

      const res = await request(app)
        .post('/api/v1/categorias')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({ nombre: 'Calzado Deportivo' });

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('DUPLICATE_CATEGORY_NAME');
    });
  });

  describe('GET /api/v1/categorias/:id', () => {
    it('debe retornar el detalle de la categoría con código 200 si existe', async () => {
      const mockCategory = {
        id_categoria: 1,
        nombre: 'Calzado Deportivo',
        descripcion: 'Tenis y zapatillas ergonómicas',
      };
      query.mockResolvedValueOnce({ rows: [mockCategory] });

      const res = await request(app).get('/api/v1/categorias/1');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toEqual(mockCategory);
    });

    it('debe responder 400 si el id no es un número entero positivo válido', async () => {
      const resInvalidText = await request(app).get('/api/v1/categorias/abc');
      expect(resInvalidText.status).toBe(400);
      expect(resInvalidText.body.status).toBe('error');
      expect(resInvalidText.body.code).toBe('BAD_REQUEST');

      const resZero = await request(app).get('/api/v1/categorias/0');
      expect(resZero.status).toBe(400);
      expect(resZero.body.code).toBe('BAD_REQUEST');
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
