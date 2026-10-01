const { Router } = require('express');
const {
  getCategories,
  getCategoryById,
  createCategory,
} = require('../controllers/categoryController');
const {
  validateId,
  validateCategoriaInput,
} = require('../middleware/validatorMiddleware');

const router = Router();

router.get('/', getCategories);
router.get('/:id', validateId, getCategoryById);

// TODO(auth): Proteger con middleware de autenticación admin_session y validación X-CSRF-Token en Semana 13-14
router.post('/', validateCategoriaInput, createCategory);

module.exports = router;
