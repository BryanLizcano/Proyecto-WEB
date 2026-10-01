const { query } = require('../config/db');

function formatOrderRow(row) {
  if (!row) return null;
  return {
    ...row,
    total: parseFloat(row.total),
  };
}

async function findById(id) {
  const sql = 'SELECT id_pedido, nombre_cliente, contacto_cliente, fecha, total, estado FROM pedido WHERE id_pedido = $1';
  const result = await query(sql, [id]);
  return formatOrderRow(result.rows[0]);
}

async function findAll({ limit = 10, offset = 0 } = {}) {
  const sql = `
    SELECT id_pedido, nombre_cliente, contacto_cliente, fecha, total, estado
    FROM pedido
    ORDER BY fecha DESC
    LIMIT $1 OFFSET $2
  `;
  const result = await query(sql, [limit, offset]);
  return result.rows.map(formatOrderRow);
}

async function createWithClient(client, { nombre_cliente, contacto_cliente, total, estado = 'PENDIENTE' }) {
  const sql = `
    INSERT INTO pedido (nombre_cliente, contacto_cliente, total, estado)
    VALUES ($1, $2, $3, $4)
    RETURNING id_pedido, nombre_cliente, contacto_cliente, fecha, total, estado
  `;
  const result = await client.query(sql, [nombre_cliente, contacto_cliente, total, estado]);
  return formatOrderRow(result.rows[0]);
}

module.exports = {
  findById,
  findAll,
  createWithClient,
};
