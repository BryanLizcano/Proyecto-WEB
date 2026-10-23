const productoModel = require('../models/productoModel');
const { findCategoryById } = require('./categoryService');
const ApiError = require('../utils/apiError');

async function getProducts({ id_categoria, q, page = 1, limit = 10 } = {}) {
  const numPage = parseInt(page, 10) || 1;
  const numLimit = parseInt(limit, 10) || 10;
  const offset = (numPage - 1) * numLimit;

  const [products, total] = await Promise.all([
    productoModel.findAll({ idCategoria: id_categoria, q, limit: numLimit, offset }),
    productoModel.countAll({ idCategoria: id_categoria, q }),
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

module.exports = {
  getProducts,
  getProductById,
  createProduct,
};
