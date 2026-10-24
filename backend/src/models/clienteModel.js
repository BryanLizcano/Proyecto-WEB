const { query } = require('../config/db');

async function findByEmail(email) {
  const sql = 'SELECT id_cliente, nombre, email, password_hash, telefono, creado_en FROM cliente WHERE LOWER(email) = LOWER($1)';
  const result = await query(sql, [email]);
  return (result && result.rows && result.rows[0]) || null;
}

async function findById(id) {
  const sql = 'SELECT id_cliente, nombre, email, telefono, creado_en FROM cliente WHERE id_cliente = $1';
  const result = await query(sql, [id]);
  return (result && result.rows && result.rows[0]) || null;
}

async function create({ nombre, email, password_hash, telefono = null }) {
  const sql = `
    INSERT INTO cliente (nombre, email, password_hash, telefono)
    VALUES ($1, $2, $3, $4)
    RETURNING id_cliente, nombre, email, telefono, creado_en
  `;
  const result = await query(sql, [nombre, email, password_hash, telefono]);
  return (result && result.rows && result.rows[0]) || null;
}

module.exports = {
  findByEmail,
  findById,
  create,
};
