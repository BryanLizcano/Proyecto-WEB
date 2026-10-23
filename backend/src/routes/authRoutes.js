const { Router } = require('express');
const {
  getCsrf,
  login,
  getMe,
  logout,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const csrfMiddleware = require('../middleware/csrfMiddleware');
const { validateLoginInput } = require('../middleware/validatorMiddleware');

const router = Router();

router.get('/csrf', getCsrf);
router.post('/login', csrfMiddleware, validateLoginInput, login);
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, csrfMiddleware, logout);

module.exports = router;
