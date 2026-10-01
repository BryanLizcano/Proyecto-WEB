const { query } = require('../config/db');

async function findAll() {
  const sql = 'SELECT id_categoria, nombre, descripcion FROM categoria ORDER BY id_categoria ASC';
  const result = await query(sql);
  return result.rows;
}

async function findById(id) {
  const sql = 'SELECT id_categoria, nombre, descripcion FROM categoria WHERE id_categoria = $1';
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

async function findByName(nombre) {
  const sql = 'SELECT id_categoria, nombre, descripcion FROM categoria WHERE LOWER(nombre) = LOWER($1)';
  const result = await query(sql, [nombre]);
  return result.rows[0] || null;
}

async function create({ nombre, descripcion = null }) {
  const sql = `
    INSERT INTO categoria (nombre, descripcion)
    VALUES ($1, $2)
    RETURNING id_categoria, nombre, descripcion
  `;
  const result = await query(sql, [nombre, descripcion]);
  return result.rows[0];
}

module.exports = {
  findAll,
  findById,
  findByName,
  create,
};
