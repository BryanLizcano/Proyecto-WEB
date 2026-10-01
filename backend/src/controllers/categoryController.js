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

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
};
