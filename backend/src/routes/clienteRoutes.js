const { Router } = require('express');
const {
  getProfile,
  updateProfile,
  getCustomerOrders,
  getCustomerOrderDetail,
} = require('../controllers/clienteController');
const clientAuthMiddleware = require('../middleware/clientAuthMiddleware');
const csrfMiddleware = require('../middleware/csrfMiddleware');
const { validateId, validateProfileUpdateInput } = require('../middleware/validatorMiddleware');

const router = Router();

// Todas las rutas de clientes requieren sesión activa de cliente
router.use(clientAuthMiddleware);

router.get('/perfil', getProfile);
router.put('/perfil', csrfMiddleware, validateProfileUpdateInput, updateProfile);
router.get('/pedidos', getCustomerOrders);
router.get('/pedidos/:id', validateId, getCustomerOrderDetail);

module.exports = router;
