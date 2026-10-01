const { pool } = require('../config/db');

async function checkHealth() {
  const result = await pool.query('SELECT 1 AS alive');

  return {
    status: 'UP',
    database: result.rows[0]?.alive === 1 ? 'connected' : 'unknown',
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  checkHealth,
};
