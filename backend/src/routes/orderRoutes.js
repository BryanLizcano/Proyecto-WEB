const { Router } = require('express');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const csrfMiddleware = require('../middleware/csrfMiddleware');
const {
  validateId,
  validateOrderInput,
  validateOrderStatusInput,
  validateOrderQueryParams,
} = require('../middleware/validatorMiddleware');

const router = Router();

// HU-14: Confirmar y crear pedido desde el carrito (Público, protegido con Double Submit CSRF)
router.post('/', csrfMiddleware, validateOrderInput, createOrder);

// HU-17: Historial y detalle de pedidos (Panel administrativo)
router.get('/', authMiddleware, validateOrderQueryParams, getOrders);
router.get('/:id', authMiddleware, validateId, getOrderById);

// HU-18: Actualizar estado operativo de un pedido (Panel administrativo)
router.patch('/:id/estado', authMiddleware, csrfMiddleware, validateId, validateOrderStatusInput, updateOrderStatus);

module.exports = router;
