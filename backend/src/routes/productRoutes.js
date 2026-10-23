const { Router } = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
} = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const csrfMiddleware = require('../middleware/csrfMiddleware');
const {
  validateId,
  validateProductoInput,
  validateProductQueryParams,
} = require('../middleware/validatorMiddleware');

const router = Router();

router.get('/', validateProductQueryParams, getProducts);
router.get('/:id', validateId, getProductById);
router.post('/', authMiddleware, csrfMiddleware, validateProductoInput, createProduct);

module.exports = router;
