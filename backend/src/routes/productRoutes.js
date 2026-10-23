const { Router } = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
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
router.put('/:id', authMiddleware, csrfMiddleware, validateId, validateProductoInput, updateProduct);

module.exports = router;
