const categoryService = require('../services/categoryService');
const { sendSuccess } = require('../utils/apiResponse');

async function getCategories(req, res, next) {
  try {
    const categories = await categoryService.getAllCategories();
    return sendSuccess(res, categories);
  } catch (error) {
    return next(error);
  }
}

async function getCategoryById(req, res, next) {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    return sendSuccess(res, category);
  } catch (error) {
    return next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const newCategory = await categoryService.createCategory(req.body);
    return sendSuccess(res, newCategory, 201);
  } catch (error) {
    return next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const updatedCategory = await categoryService.updateCategory(req.params.id, req.body);
    return sendSuccess(res, updatedCategory, 200);
  } catch (error) {
    return next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    await categoryService.deleteCategory(req.params.id);
    return res.status(200).json({
      status: 'success',
      message: 'Categoría eliminada exitosamente.',
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
