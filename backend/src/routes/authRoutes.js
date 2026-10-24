const { Router } = require('express');
const {
  getCsrf,
  login,
  register,
  getMe,
  logout,
} = require('../controllers/authController');
const csrfMiddleware = require('../middleware/csrfMiddleware');
const { validateLoginInput, validateRegisterInput } = require('../middleware/validatorMiddleware');

const router = Router();

router.get('/csrf', getCsrf);
router.post('/login', csrfMiddleware, validateLoginInput, login);
router.post('/register', csrfMiddleware, validateRegisterInput, register);
router.get('/me', getMe);
router.post('/logout', csrfMiddleware, logout);

module.exports = router;
