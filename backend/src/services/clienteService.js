const bcrypt = require('bcrypt');
const { query } = require('../config/db');
const clienteModel = require('../models/clienteModel');
const administradorModel = require('../models/administradorModel');
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
    nombre_producto: row.nombre_producto,
    imagen_url: row.imagen_url || null,
    cantidad: row.cantidad,
    precio_unitario: precioUnitario,
    subtotal,
  };
}

async function getProfile(idCliente) {
  const cliente = await clienteModel.findById(idCliente);
  if (!cliente) {
    throw ApiError.notFound('Cliente no encontrado.', 'CLIENT_NOT_FOUND');
  }

  return {
    id_cliente: cliente.id_cliente,
    nombre: cliente.nombre,
    email: cliente.email,
    telefono: cliente.telefono,
    creado_en: cliente.creado_en,
  };
}

async function updateProfile(idCliente, { nombre, email, telefono = null, currentPassword = null, newPassword = null }) {
  const cliente = await clienteModel.findById(idCliente);
  if (!cliente) {
    throw ApiError.notFound('Cliente no encontrado.', 'CLIENT_NOT_FOUND');
  }

  const cleanEmail = email.trim().toLowerCase();

  // Si se modifica el email, verificar que no esté ocupado
  if (cleanEmail !== cliente.email.toLowerCase()) {
    const [existingAdmin, existingClient] = await Promise.all([
      administradorModel.findByEmail(cleanEmail),
      clienteModel.findByEmail(cleanEmail),
    ]);

    if (existingAdmin || (existingClient && existingClient.id_cliente !== idCliente)) {
      throw ApiError.conflict('El correo electrónico ya está registrado por otra cuenta.', 'EMAIL_ALREADY_EXISTS');
    }
  }

  let password_hash = null;
  if (newPassword) {
    if (!currentPassword) {
      throw ApiError.badRequest('Debes ingresar la contraseña actual para establecer una nueva contraseña.', 'CURRENT_PASSWORD_REQUIRED');
    }

    const isMatch = await bcrypt.compare(currentPassword, cliente.password_hash);
    if (!isMatch) {
      throw ApiError.badRequest('La contraseña actual ingresada es incorrecta.', 'INVALID_CURRENT_PASSWORD');
    }

    if (newPassword.length < 6) {
      throw ApiError.badRequest('La nueva contraseña debe tener al menos 6 caracteres.', 'INVALID_PASSWORD_LENGTH');
    }

    password_hash = await bcrypt.hash(newPassword, 10);
  }

  const updated = await clienteModel.update(idCliente, {
    nombre: nombre.trim(),
    email: cleanEmail,
    telefono: telefono ? telefono.trim() : null,
    password_hash,
  });

  return {
    id_cliente: updated.id_cliente,
    nombre: updated.nombre,
    email: updated.email,
    telefono: updated.telefono,
    creado_en: updated.creado_en,
  };
}

async function getCustomerOrders(idCliente, emailCliente) {
  const sql = `
    SELECT id_pedido, nombre_cliente, contacto_cliente, fecha, total, estado, id_cliente
    FROM pedido
    WHERE id_cliente = $1 OR LOWER(contacto_cliente) = LOWER($2)
    ORDER BY fecha DESC
  `;
  const result = await query(sql, [idCliente, emailCliente || '']);
  const rows = (result && result.rows) || [];
  return rows.map(formatOrderRow);
}

async function getCustomerOrderDetail(idPedido, idCliente, emailCliente) {
  const sqlOrder = `
    SELECT id_pedido, nombre_cliente, contacto_cliente, fecha, total, estado, id_cliente
    FROM pedido
    WHERE id_pedido = $1 AND (id_cliente = $2 OR LOWER(contacto_cliente) = LOWER($3))
  `;
  const resOrder = await query(sqlOrder, [idPedido, idCliente, emailCliente || '']);
  const orderRow = (resOrder && resOrder.rows && resOrder.rows[0]) || null;

  if (!orderRow) {
    throw ApiError.notFound(`Pedido con ID ${idPedido} no encontrado para este cliente.`, 'ORDER_NOT_FOUND');
  }

  const sqlDetails = `
    SELECT d.id_detalle, d.id_producto, d.cantidad, d.precio_unitario,
           ROUND(d.cantidad * d.precio_unitario, 2) AS subtotal,
           p.nombre AS nombre_producto, p.imagen_url
    FROM detalle_pedido d
    LEFT JOIN producto p ON d.id_producto = p.id_producto
    WHERE d.id_pedido = $1
    ORDER BY d.id_detalle ASC
  `;
  const resDetails = await query(sqlDetails, [idPedido]);
  const detailRows = (resDetails && resDetails.rows) || [];

  return {
    ...formatOrderRow(orderRow),
    detalles: detailRows.map(formatDetailRow),
  };
}

module.exports = {
  getProfile,
  updateProfile,
  getCustomerOrders,
  getCustomerOrderDetail,
};
