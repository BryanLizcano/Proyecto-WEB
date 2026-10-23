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
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({ rows: [] });
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
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
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

  describe('PUT /api/v1/categorias/:id (HU-03)', () => {
    it('debe rechazar con 401 si no hay sesión de administrador activa', async () => {
      const res = await request(app)
        .put('/api/v1/categorias/1')
        .set('Cookie', 'XSRF-TOKEN=valid-csrf-token')
        .set('X-CSRF-Token', validCsrfHeader)
        .send({ nombre: 'Calzado Pro' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('debe rechazar con 403 si el token CSRF es inválido o no coincide', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .put('/api/v1/categorias/1')
        .set('Cookie', 'admin_session=1; XSRF-TOKEN=valid-csrf-token')
        .set('X-CSRF-Token', 'token-invalido')
        .send({ nombre: 'Calzado Pro' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('debe responder 400 si el id no es un número entero positivo válido', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .put('/api/v1/categorias/abc')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({ nombre: 'Calzado Pro' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('BAD_REQUEST');
    });

    it('debe responder 422 si el nombre está vacío o supera 100 caracteres', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .put('/api/v1/categorias/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({ nombre: '   ', descripcion: 'Descripción válida' });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details[0].field).toBe('nombre');
    });

    it('debe responder 404 si la categoría no existe', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/api/v1/categorias/999')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({ nombre: 'Calzado Pro', descripcion: 'Descripción' });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('debe responder 409 si el nuevo nombre colisiona con otra categoría distinta', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Calzado Original' }],
      });
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 2 }],
      });

      const res = await request(app)
        .put('/api/v1/categorias/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({ nombre: 'Ropa Deportiva' });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('DUPLICATE_CATEGORY_NAME');
    });

    it('debe actualizar la categoría satisfactoriamente y responder 200', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Calzado Deportivo', descripcion: 'Zapatos' }],
      });
      query.mockResolvedValueOnce({ rows: [] });
      const categoriaActualizada = {
        id_categoria: 1,
        nombre: 'Calzado Profesional y Deportivo',
        descripcion: 'Calzado para atletas y corredores.',
      };
      query.mockResolvedValueOnce({ rows: [categoriaActualizada] });

      const res = await request(app)
        .put('/api/v1/categorias/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          nombre: 'Calzado Profesional y Deportivo',
          descripcion: 'Calzado para atletas y corredores.',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toEqual(categoriaActualizada);
    });

    it('debe permitir actualizar la descripción manteniendo el mismo nombre sin conflicto 409', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Calzado Deportivo', descripcion: 'Descripción vieja' }],
      });
      query.mockResolvedValueOnce({ rows: [] });
      const categoriaActualizada = {
        id_categoria: 1,
        nombre: 'Calzado Deportivo',
        descripcion: 'Nueva descripción actualizada',
      };
      query.mockResolvedValueOnce({ rows: [categoriaActualizada] });

      const res = await request(app)
        .put('/api/v1/categorias/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          nombre: 'Calzado Deportivo',
          descripcion: 'Nueva descripción actualizada',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.descripcion).toBe('Nueva descripción actualizada');
    });

    it('debe sanitizar contra XSS en nombre y descripción al actualizar', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Antigua', descripcion: 'Antigua' }],
      });
      query.mockResolvedValueOnce({ rows: [] });
      query.mockImplementationOnce((sql, params) => {
        return Promise.resolve({
          rows: [{
            id_categoria: 1,
            nombre: params[0],
            descripcion: params[1],
          }],
        });
      });

      const res = await request(app)
        .put('/api/v1/categorias/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader)
        .send({
          nombre: '<script>alert("XSS")</script>',
          descripcion: '<b>Negrita</b>',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.nombre).not.toContain('<script>');
      expect(res.body.data.nombre).toContain('&lt;script&gt;');
      expect(res.body.data.descripcion).not.toContain('<b>');
      expect(res.body.data.descripcion).toContain('&lt;b&gt;');
    });
  });

  describe('DELETE /api/v1/categorias/:id (HU-04)', () => {
    it('debe rechazar con 401 si no hay sesión de administrador activa', async () => {
      const res = await request(app)
        .delete('/api/v1/categorias/1')
        .set('Cookie', 'XSRF-TOKEN=valid-csrf-token')
        .set('X-CSRF-Token', validCsrfHeader);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('debe rechazar con 403 si el token CSRF es inválido o no coincide', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const res = await request(app)
        .delete('/api/v1/categorias/1')
        .set('Cookie', 'admin_session=1; XSRF-TOKEN=valid-csrf-token')
        .set('X-CSRF-Token', 'token-invalido');

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('debe responder 400 si el id no es un número entero positivo válido', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });

      const resText = await request(app)
        .delete('/api/v1/categorias/abc')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader);

      expect(resText.status).toBe(400);
      expect(resText.body.code).toBe('BAD_REQUEST');

      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      const resZero = await request(app)
        .delete('/api/v1/categorias/0')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader);

      expect(resZero.status).toBe(400);
      expect(resZero.body.code).toBe('BAD_REQUEST');
    });

    it('debe responder 404 si la categoría no existe', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .delete('/api/v1/categorias/999')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('debe responder 409 (CATEGORY_HAS_PRODUCTS) si la categoría contiene productos asociados', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Calzado Deportivo' }],
      });
      query.mockResolvedValueOnce({
        rows: [{ total: 5 }],
      });

      const res = await request(app)
        .delete('/api/v1/categorias/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader);

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('CATEGORY_HAS_PRODUCTS');
      expect(res.body.message).toContain('productos asociados');
    });

    it('debe responder 409 si ocurre violación de clave foránea 23503 en base de datos', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Calzado Deportivo' }],
      });
      query.mockResolvedValueOnce({
        rows: [{ total: 0 }],
      });
      const fkError = new Error('update or delete on table "categoria" violates foreign key constraint');
      fkError.code = '23503';
      query.mockRejectedValueOnce(fkError);

      const res = await request(app)
        .delete('/api/v1/categorias/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader);

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('CATEGORY_HAS_PRODUCTS');
    });

    it('debe eliminar la categoría exitosamente y responder 200 si no tiene productos', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Categoría Vacía' }],
      });
      query.mockResolvedValueOnce({
        rows: [{ total: 0 }],
      });
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .delete('/api/v1/categorias/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Categoría eliminada exitosamente.');
    });

    it('debe responder 500 si ocurre un fallo inesperado de base de datos durante la eliminación', async () => {
      query.mockResolvedValueOnce({ rows: [mockAdmin] });
      query.mockResolvedValueOnce({
        rows: [{ id_categoria: 1, nombre: 'Categoría Vacía' }],
      });
      query.mockResolvedValueOnce({
        rows: [{ total: 0 }],
      });
      const dbError = new Error('Database connection failure');
      query.mockRejectedValueOnce(dbError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const res = await request(app)
        .delete('/api/v1/categorias/1')
        .set('Cookie', authCookie)
        .set('X-CSRF-Token', validCsrfHeader);

      expect(res.status).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('INTERNAL_SERVER_ERROR');

      consoleSpy.mockRestore();
    });
  });
});
