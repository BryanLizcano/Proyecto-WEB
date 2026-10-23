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

describe('Endpoints de Autenticación y Seguridad (/api/v1/auth)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/auth/csrf', () => {
    it('debe generar un token CSRF y establecer la cookie XSRF-TOKEN', async () => {
      const res = await request(app).get('/api/v1/auth/csrf');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('csrfToken');
      expect(typeof res.body.csrfToken).toBe('string');
      expect(res.body.csrfToken.length).toBe(64);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.startsWith('XSRF-TOKEN='))).toBe(true);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('debe rechazar con 403 si falta el token CSRF', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@tiendamodular.com', password: 'PasswordSeguro123!' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('debe rechazar con 422 si las credenciales tienen formato inválido', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', 'XSRF-TOKEN=csrf-ok')
        .set('X-CSRF-Token', 'csrf-ok')
        .send({ email: 'no-es-un-email', password: '' });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
    });

    it('debe rechazar con 401 si el usuario no existe', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', 'XSRF-TOKEN=csrf-ok')
        .set('X-CSRF-Token', 'csrf-ok')
        .send({ email: 'admin@tiendamodular.com', password: 'PasswordSeguro123!' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('debe responder 200 y fijar admin_session con credenciales correctas', async () => {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('PasswordSeguro123!', salt);

      query.mockResolvedValueOnce({
        rows: [
          {
            id_administrador: 1,
            nombre: 'Administrador General',
            email: 'admin@tiendamodular.com',
            password_hash: hash,
            creado_en: '2026-09-30T12:00:00.000Z',
          },
        ],
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', 'XSRF-TOKEN=csrf-ok')
        .set('X-CSRF-Token', 'csrf-ok')
        .send({ email: 'admin@tiendamodular.com', password: 'PasswordSeguro123!' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.email).toBe('admin@tiendamodular.com');
      expect(res.body.data).not.toHaveProperty('password_hash');

      const cookies = res.headers['set-cookie'];
      expect(cookies.some((c) => c.startsWith('admin_session='))).toBe(true);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('debe responder 401 si no hay sesión activa', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('debe responder 200 con el perfil del admin si la sesión es válida', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            id_administrador: 1,
            nombre: 'Administrador General',
            email: 'admin@tiendamodular.com',
            creado_en: '2026-09-30T12:00:00.000Z',
          },
        ],
      });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', 'admin_session=1');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id_administrador).toBe(1);
      expect(res.body.data.email).toBe('admin@tiendamodular.com');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('debe responder 200 y limpiar la cookie de sesión', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            id_administrador: 1,
            nombre: 'Administrador General',
            email: 'admin@tiendamodular.com',
            creado_en: '2026-09-30T12:00:00.000Z',
          },
        ],
      });

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', 'admin_session=1; XSRF-TOKEN=csrf-ok')
        .set('X-CSRF-Token', 'csrf-ok');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      const cookies = res.headers['set-cookie'];
      expect(cookies.some((c) => c.includes('admin_session=;'))).toBe(true);
    });
  });
});
