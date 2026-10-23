const { pool, query } = require('../config/db');
const ApiError = require('../utils/apiError');

function formatOrderRow(row) {
  if (!row) return null;
  return {
    ...row,
    total: parseFloat(row.total),
  };
}

function formatDetailRow(row) {
  if (!row) return null;
  const precioUnitario = parseFloat(row.precio_unitario);
  const subtotal = row.subtotal !== undefined
    ? parseFloat(row.subtotal)
    : Number((precioUnitario * row.cantidad).toFixed(2));

  return {
    id_detalle: row.id_detalle,
    id_producto: row.id_producto,
    nombre_producto: row.nombre_producto || row.producto_nombre,
    cantidad: row.cantidad,
    precio_unitario: precioUnitario,
    subtotal,
  };
}

/**
 * Confirma un pedido descontando stock de forma atómica mediante transacción SQL y bloqueo pesimista FOR UPDATE.
 * @param {{ nombre_cliente: string, contacto_cliente: string, items: Array<{id_producto: number, cantidad: number}> }} orderData
 * @returns {Promise<object>} Pedido registrado con sus líneas de detalle.
 */
async function createOrder({ nombre_cliente, contacto_cliente, items }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let totalCalculado = 0;
    const itemsVerificados = [];

    // Ordenar por id_producto para garantizar un orden determinista de bloqueo y prevenir deadlocks
    const sortedItems = [...items].sort((a, b) => a.id_producto - b.id_producto);

    for (let i = 0; i < sortedItems.length; i += 1) {
      const item = sortedItems[i];

      // 1. Bloqueo pesimista de fila para evitar sobreventas concurrentes
      const resProd = await client.query(
        'SELECT id_producto, nombre, precio, stock FROM producto WHERE id_producto = $1 FOR UPDATE',
        [item.id_producto]
      );

      if (resProd.rows.length === 0) {
        throw ApiError.notFound(
          `Producto con ID ${item.id_producto} no existe.`,
          'PRODUCT_NOT_FOUND'
        );
      }

      const prod = resProd.rows[0];

      // 2. Validación de stock disponible
      if (prod.stock < item.cantidad) {
        throw ApiError.conflict(
          `Stock insuficiente para el producto '${prod.nombre}'. Disponibles: ${prod.stock}, Solicitados: ${item.cantidad}.`,
          'INSUFFICIENT_STOCK',
          [
            {
              field: `items[${i}].cantidad`,
              message: `Solo restan ${prod.stock} unidades en inventario.`,
            },
          ]
        );
      }

      // 3. Descuento de inventario
      await client.query(
        'UPDATE producto SET stock = stock - $1 WHERE id_producto = $2',
        [item.cantidad, item.id_producto]
      );

      const precioUnitario = Number(prod.precio);
      const subtotal = Number((precioUnitario * item.cantidad).toFixed(2));
      totalCalculado += subtotal;

      itemsVerificados.push({
        id_producto: prod.id_producto,
        nombre_producto: prod.nombre,
        cantidad: item.cantidad,
        precio_unitario: precioUnitario,
        subtotal,
      });
    }

    totalCalculado = Number(totalCalculado.toFixed(2));

    // 4. Registro de cabecera de pedido
    const resPedido = await client.query(
      'INSERT INTO pedido (nombre_cliente, contacto_cliente, total, estado) VALUES ($1, $2, $3, $4) RETURNING id_pedido, nombre_cliente, contacto_cliente, fecha, total, estado',
      [nombre_cliente, contacto_cliente, totalCalculado, 'PENDIENTE']
    );
    const nuevoPedido = formatOrderRow(resPedido.rows[0]);

    // 5. Registro de renglones de detalle
    const detallesCreados = [];
    for (const det of itemsVerificados) {
      const resDetalle = await client.query(
        'INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES ($1, $2, $3, $4) RETURNING id_detalle',
        [nuevoPedido.id_pedido, det.id_producto, det.cantidad, det.precio_unitario]
      );
      detallesCreados.push({
        id_detalle: resDetalle.rows[0].id_detalle,
        id_producto: det.id_producto,
        nombre_producto: det.nombre_producto,
        cantidad: det.cantidad,
        precio_unitario: det.precio_unitario,
        subtotal: det.subtotal,
      });
    }

    await client.query('COMMIT');
    return {
      ...nuevoPedido,
      detalles: detallesCreados,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Consulta el listado de pedidos paginado y filtrable por estado (HU-17).
 * @param {{ estado?: string, page?: number, limit?: number }} filters
 */
async function getOrders({ estado, page = 1, limit = 10 } = {}) {
  const numPage = parseInt(page, 10) || 1;
  const numLimit = parseInt(limit, 10) || 10;
  const offset = (numPage - 1) * numLimit;

  const conditions = [];
  const params = [];

  if (estado) {
    params.push(estado);
    conditions.push(`estado = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*)::int AS total FROM pedido ${whereClause}`;
  const countResult = await query(countSql, params);
  const total = countResult.rows[0].total;

  params.push(numLimit);
  const limitPlaceholder = `$${params.length}`;
  params.push(offset);
  const offsetPlaceholder = `$${params.length}`;

  const sql = `
    SELECT id_pedido, nombre_cliente, contacto_cliente, fecha, total, estado
    FROM pedido
    ${whereClause}
    ORDER BY fecha DESC
    LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
  `;

  const result = await query(sql, params);
  const totalPages = Math.ceil(total / numLimit) || (total === 0 ? 0 : 1);

  return {
    orders: result.rows.map(formatOrderRow),
    meta: {
      total,
      page: numPage,
      limit: numLimit,
      totalPages,
    },
  };
}

/**
 * Consulta el detalle completo de un pedido con sus renglones e información de productos (HU-17).
 * @param {number} id
 */
async function getOrderById(id) {
  const orderSql = 'SELECT id_pedido, nombre_cliente, contacto_cliente, fecha, total, estado FROM pedido WHERE id_pedido = $1';
  const orderRes = await query(orderSql, [id]);
  if (orderRes.rows.length === 0) {
    throw ApiError.notFound('El recurso solicitado no fue encontrado en el servidor.', 'NOT_FOUND');
  }

  const order = formatOrderRow(orderRes.rows[0]);

  const detailSql = `
    SELECT 
      dp.id_detalle,
      dp.id_producto,
      p.nombre AS nombre_producto,
      dp.cantidad,
      dp.precio_unitario,
      (dp.cantidad * dp.precio_unitario) AS subtotal
    FROM detalle_pedido dp
    JOIN producto p ON dp.id_producto = p.id_producto
    WHERE dp.id_pedido = $1
    ORDER BY dp.id_detalle ASC
  `;
  const detailRes = await query(detailSql, [id]);

  return {
    ...order,
    detalles: detailRes.rows.map(formatDetailRow),
  };
}

/**
 * Actualiza el estado operativo de un pedido (HU-18).
 * @param {number} id
 * @param {string} estado
 */
async function updateOrderStatus(id, estado) {
  const checkSql = 'SELECT id_pedido FROM pedido WHERE id_pedido = $1';
  const checkRes = await query(checkSql, [id]);
  if (checkRes.rows.length === 0) {
    throw ApiError.notFound('El recurso solicitado no fue encontrado en el servidor.', 'NOT_FOUND');
  }

  const updateSql = `
    UPDATE pedido
    SET estado = $1
    WHERE id_pedido = $2
    RETURNING id_pedido, nombre_cliente, contacto_cliente, fecha, total, estado
  `;
  const result = await query(updateSql, [estado, id]);
  return formatOrderRow(result.rows[0]);
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
};
