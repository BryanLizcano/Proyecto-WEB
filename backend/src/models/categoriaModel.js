const categoryService = require('../services/categoryService');

// Capa de compatibilidad transitoria: la fuente de acceso a datos reside en categoryService.js
module.exports = {
  findAll: categoryService.getAllCategories,
  findById: categoryService.findCategoryById,
  create: categoryService.createCategory,
};
