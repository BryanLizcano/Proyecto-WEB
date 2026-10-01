const { query } = require('../config/db');

function formatProductRow(row) {
  if (!row) return null;
  return {
    ...row,
    precio: parseFloat(row.precio),
  };
}

async function findAll({ idCategoria = null, q = null, limit = 10, offset = 0 } = {}) {
  const conditions = [];
  const params = [];

  if (idCategoria) {
    params.push(idCategoria);
    conditions.push(`p.id_categoria = $${params.length}`);
  }

  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(p.nombre ILIKE $${params.length} OR p.descripcion ILIKE $${params.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit);
  const limitPlaceholder = `$${params.length}`;
  params.push(offset);
  const offsetPlaceholder = `$${params.length}`;

  const sql = `
    SELECT 
      p.id_producto,
      p.id_categoria,
      c.nombre AS categoria_nombre,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.imagen_url
    FROM producto p
    JOIN categoria c ON p.id_categoria = c.id_categoria
    ${whereClause}
    ORDER BY p.id_producto ASC
    LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
  `;

  const result = await query(sql, params);
  return result.rows.map(formatProductRow);
}

async function countAll({ idCategoria = null, q = null } = {}) {
  const conditions = [];
  const params = [];

  if (idCategoria) {
    params.push(idCategoria);
    conditions.push(`p.id_categoria = $${params.length}`);
  }

  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(p.nombre ILIKE $${params.length} OR p.descripcion ILIKE $${params.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT COUNT(*)::int AS total FROM producto p ${whereClause}`;

  const result = await query(sql, params);
  return result.rows[0].total;
}

async function findById(id) {
  const sql = `
    SELECT 
      p.id_producto,
      p.id_categoria,
      c.nombre AS categoria_nombre,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.imagen_url
    FROM producto p
    JOIN categoria c ON p.id_categoria = c.id_categoria
    WHERE p.id_producto = $1
  `;
  const result = await query(sql, [id]);
  return formatProductRow(result.rows[0]);
}

async function create({ id_categoria, nombre, descripcion = null, precio, stock, imagen_url = null }) {
  const sql = `
    INSERT INTO producto (id_categoria, nombre, descripcion, precio, stock, imagen_url)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id_producto, id_categoria, nombre, descripcion, precio, stock, imagen_url
  `;
  const result = await query(sql, [id_categoria, nombre, descripcion, precio, stock, imagen_url]);
  return formatProductRow(result.rows[0]);
}

module.exports = {
  findAll,
  countAll,
  findById,
  create,
};
