const productService = require('../services/productService');
const { sendSuccess } = require('../utils/apiResponse');

async function getProducts(req, res, next) {
  try {
    const { products, meta } = await productService.getProducts(req.query);
    return sendSuccess(res, products, 200, meta);
  } catch (error) {
    return next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);
    return sendSuccess(res, product);
  } catch (error) {
    return next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const newProduct = await productService.createProduct(req.body);
    return sendSuccess(res, newProduct, 201);
  } catch (error) {
    return next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const updatedProduct = await productService.updateProduct(req.params.id, req.body);
    return sendSuccess(res, updatedProduct, 200);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
};
