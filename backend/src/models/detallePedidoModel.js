const { query } = require('../config/db');

function formatDetailRow(row) {
  if (!row) return null;
  return {
    ...row,
    precio_unitario: parseFloat(row.precio_unitario),
  };
}

async function findByOrderId(orderId) {
  const sql = `
    SELECT 
      dp.id_detalle,
      dp.id_pedido,
      dp.id_producto,
      p.nombre AS producto_nombre,
      dp.cantidad,
      dp.precio_unitario
    FROM detalle_pedido dp
    JOIN producto p ON dp.id_producto = p.id_producto
    WHERE dp.id_pedido = $1
    ORDER BY dp.id_detalle ASC
  `;
  const result = await query(sql, [orderId]);
  return result.rows.map(formatDetailRow);
}

async function createWithClient(client, { id_pedido, id_producto, cantidad, precio_unitario }) {
  const sql = `
    INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario)
    VALUES ($1, $2, $3, $4)
    RETURNING id_detalle, id_pedido, id_producto, cantidad, precio_unitario
  `;
  const result = await client.query(sql, [id_pedido, id_producto, cantidad, precio_unitario]);
  return formatDetailRow(result.rows[0]);
}

module.exports = {
  findByOrderId,
  createWithClient,
};
