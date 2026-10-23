const crypto = require('crypto');
const authService = require('../services/authService');
const env = require('../config/env');
const { sendSuccess } = require('../utils/apiResponse');

function getCsrf(req, res) {
  const csrfToken = crypto.randomBytes(32).toString('hex');

  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    path: '/',
  });

  return res.json({ csrfToken });
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const admin = await authService.login(email, password);

    res.cookie('admin_session', String(admin.id_administrador), {
      signed: true,
      httpOnly: true,
      sameSite: 'lax',
      secure: env.nodeEnv === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    return sendSuccess(res, admin);
  } catch (error) {
    return next(error);
  }
}

function getMe(req, res) {
  return sendSuccess(res, req.user);
}

function logout(req, res) {
  res.clearCookie('admin_session', {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    path: '/',
  });

  return res.json({
    status: 'success',
    message: 'Sesión finalizada correctamente.',
  });
}

module.exports = {
  getCsrf,
  login,
  getMe,
  logout,
};
