const { Router } = require('express');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const csrfMiddleware = require('../middleware/csrfMiddleware');
const {
  validateId,
  validateCategoryInput,
} = require('../middleware/validatorMiddleware');

const router = Router();

router.get('/', getCategories);
router.get('/:id', validateId, getCategoryById);
router.post('/', authMiddleware, csrfMiddleware, validateCategoryInput, createCategory);
router.put('/:id', authMiddleware, csrfMiddleware, validateId, validateCategoryInput, updateCategory);
router.delete('/:id', authMiddleware, csrfMiddleware, validateId, deleteCategory);

module.exports = router;
