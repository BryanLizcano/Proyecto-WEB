const request = require('supertest');

jest.mock('../src/config/db', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [{ alive: 1 }] }),
  },
  query: jest.fn(),
}));

const app = require('../src/app');

describe('GET /api/health', () => {
  it('debe responder 200 con la base de datos conectada', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body.data).toHaveProperty('status', 'UP');
    expect(res.body.data).toHaveProperty('database', 'connected');
    expect(res.body.data).toHaveProperty('timestamp');
  });
});
