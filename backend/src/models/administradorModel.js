const { query } = require('../config/db');

async function findByEmail(email) {
  const sql = 'SELECT id_administrador, nombre, email, password_hash, creado_en FROM administrador WHERE LOWER(email) = LOWER($1)';
  const result = await query(sql, [email]);
  return result.rows[0] || null;
}

async function findById(id) {
  const sql = 'SELECT id_administrador, nombre, email, creado_en FROM administrador WHERE id_administrador = $1';
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

async function create({ nombre, email, password_hash }) {
  const sql = `
    INSERT INTO administrador (nombre, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id_administrador, nombre, email, creado_en
  `;
  const result = await query(sql, [nombre, email, password_hash]);
  return result.rows[0];
}

module.exports = {
  findByEmail,
  findById,
  create,
};
