const { query } = require('../config/db');
const productoModel = require('../models/productoModel');
const { findCategoryById } = require('./categoryService');
const ApiError = require('../utils/apiError');

async function getProducts({ id_categoria, q, page = 1, limit = 10 } = {}) {
  const parsedCat = id_categoria ? parseInt(id_categoria, 10) : null;
  const numPage = parseInt(page, 10) || 1;
  const numLimit = parseInt(limit, 10) || 10;
  const offset = (numPage - 1) * numLimit;

  const [products, total] = await Promise.all([
    productoModel.findAll({ idCategoria: parsedCat, q, limit: numLimit, offset }),
    productoModel.countAll({ idCategoria: parsedCat, q }),
  ]);

  const totalPages = Math.ceil(total / numLimit) || (total === 0 ? 0 : 1);

  return {
    products,
    meta: {
      total,
      page: numPage,
      limit: numLimit,
      totalPages,
    },
  };
}

async function getProductById(id) {
  const product = await productoModel.findById(id);
  if (!product) {
    throw ApiError.notFound('El recurso solicitado no fue encontrado en el servidor.', 'NOT_FOUND');
  }
  return product;
}

async function createProduct(data) {
  const category = await findCategoryById(data.id_categoria);
  if (!category) {
    throw ApiError.unprocessable('Errores de validación en los campos del formulario.', [
      {
        field: 'id_categoria',
        message: `La categoría con ID ${data.id_categoria} no existe.`,
      },
    ]);
  }

  const created = await productoModel.create(data);
  return {
    ...created,
    categoria_nombre: category.nombre,
  };
}

async function updateProduct(id, data) {
  const existingProduct = await productoModel.findById(id);
  if (!existingProduct) {
    throw ApiError.notFound('El recurso solicitado no fue encontrado en el servidor.', 'NOT_FOUND');
  }

  const category = await findCategoryById(data.id_categoria);
  if (!category) {
    throw ApiError.unprocessable('Errores de validación en los campos del formulario.', [
      {
        field: 'id_categoria',
        message: `La categoría con ID ${data.id_categoria} no existe.`,
      },
    ]);
  }

  const updated = await productoModel.update(id, data);
  return {
    ...updated,
    categoria_nombre: category.nombre,
  };
}

/**
 * Elimina un producto del catálogo siempre que no figure en pedidos históricos.
 * @param {number} id
 * @returns {Promise<void>}
 */
async function deleteProduct(id) {
  const existingProduct = await productoModel.findById(id);
  if (!existingProduct) {
    throw ApiError.notFound('El recurso solicitado no fue encontrado en el servidor.', 'NOT_FOUND');
  }

  const countSql = 'SELECT COUNT(*)::int AS total FROM detalle_pedido WHERE id_producto = $1';
  const countResult = await query(countSql, [id]);

  if (countResult.rows[0]?.total > 0) {
    throw ApiError.conflict(
      'No es posible eliminar el producto porque existen pedidos registrados asociados.',
      'PRODUCT_HAS_ORDERS'
    );
  }

  try {
    await productoModel.deleteById(id);
  } catch (error) {
    // 23503 corresponde a violación de restricción de clave foránea fk_detalle_pedido_producto (ON DELETE RESTRICT)
    if (error.code === '23503') {
      throw ApiError.conflict(
        'No es posible eliminar el producto porque existen pedidos registrados asociados.',
        'PRODUCT_HAS_ORDERS'
      );
    }
    throw error;
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
