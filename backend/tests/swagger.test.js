const request = require('supertest');
const app = require('../src/app');

describe('Documentación Swagger UI (/api-docs)', () => {
  it('debe servir la interfaz de Swagger UI en /api-docs', async () => {
    const res = await request(app).get('/api-docs/');
    expect([200, 301]).toContain(res.status);
    if (res.status === 200) {
      expect(res.text).toContain('Swagger UI');
    }
  });
});
