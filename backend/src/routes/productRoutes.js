const { Router } = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
} = require('../controllers/productController');
const {
  validateId,
  validateProductoInput,
  validateProductQueryParams,
} = require('../middleware/validatorMiddleware');

const router = Router();

router.get('/', validateProductQueryParams, getProducts);
router.get('/:id', validateId, getProductById);

// TODO(auth): Proteger con middleware de autenticación admin_session y validación X-CSRF-Token en Semana 13-14
router.post('/', validateProductoInput, createProduct);

module.exports = router;
