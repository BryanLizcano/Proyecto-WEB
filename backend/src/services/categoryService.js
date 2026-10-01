const categoriaModel = require('../models/categoriaModel');
const ApiError = require('../utils/apiError');

async function getAllCategories() {
  return categoriaModel.findAll();
}

async function getCategoryById(id) {
  const category = await categoriaModel.findById(id);
  if (!category) {
    throw ApiError.notFound('Categoría no encontrada.', 'NOT_FOUND');
  }
  return category;
}

async function createCategory({ nombre, descripcion }) {
  const existingCategory = await categoriaModel.findByName(nombre);
  if (existingCategory) {
    throw ApiError.conflict('Ya existe una categoría con el nombre especificado.', 'DUPLICATE_CATEGORY_NAME');
  }

  return categoriaModel.create({ nombre, descripcion });
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
};
