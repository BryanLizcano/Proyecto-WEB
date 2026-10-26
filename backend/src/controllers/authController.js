const crypto = require('crypto');
const authService = require('../services/authService');
const administradorModel = require('../models/administradorModel');
const clienteModel = require('../models/clienteModel');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const { sendSuccess } = require('../utils/apiResponse');

function getCookieOptions(custom = {}) {
  const isProduction = env.nodeEnv === 'production' || !!process.env.RENDER;
  return {
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/',
    ...(isProduction ? { partitioned: true } : {}),
    ...custom,
  };
}

function getCsrf(req, res) {
  const csrfToken = crypto.randomBytes(32).toString('hex');

  res.cookie('XSRF-TOKEN', csrfToken, getCookieOptions({
    httpOnly: false,
  }));

  return res.json({ csrfToken });
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await authService.login(email, password);

    if (user.rol === 'admin') {
      // Sesión de admin: 10 minutos de inactividad (sliding expiration)
      res.cookie('admin_session', String(user.id_administrador), getCookieOptions({
        signed: true,
        httpOnly: true,
        maxAge: 10 * 60 * 1000,
      }));
    } else {
      // Sesión de cliente: cookie de sesión del navegador (persiste hasta que se cierre el navegador)
      res.cookie('cliente_session', String(user.id_cliente), getCookieOptions({
        signed: true,
        httpOnly: true,
      }));
    }

    return sendSuccess(res, user);
  } catch (error) {
    return next(error);
  }
}

async function register(req, res, next) {
  try {
    const { nombre, email, password, telefono } = req.body;
    const client = await authService.register({ nombre, email, password, telefono });

    // Iniciar sesión del cliente de inmediato tras registrarse
    res.cookie('cliente_session', String(client.id_cliente), getCookieOptions({
      signed: true,
      httpOnly: true,
    }));

    return sendSuccess(res, client, 201);
  } catch (error) {
    return next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const adminId = (req.signedCookies && req.signedCookies.admin_session) || (req.cookies && req.cookies.admin_session);
    if (adminId) {
      const admin = await administradorModel.findById(adminId);
      if (admin) {
        // Refrescar cookie para 10 minutos más de inactividad
        res.cookie('admin_session', String(admin.id_administrador), getCookieOptions({
          signed: true,
          httpOnly: true,
          maxAge: 10 * 60 * 1000,
        }));

        return sendSuccess(res, {
          id_administrador: admin.id_administrador,
          nombre: admin.nombre,
          email: admin.email,
          rol: 'admin',
          creado_en: admin.creado_en,
        });
      }
    }

    const clienteId = (req.signedCookies && req.signedCookies.cliente_session) || (req.cookies && req.cookies.cliente_session);
    if (clienteId) {
      const cliente = await clienteModel.findById(clienteId);
      if (cliente) {
        return sendSuccess(res, {
          id_cliente: cliente.id_cliente,
          nombre: cliente.nombre,
          email: cliente.email,
          telefono: cliente.telefono,
          rol: 'cliente',
          creado_en: cliente.creado_en,
        });
      }
    }

    return next(ApiError.unauthorized('No hay sesión activa.', 'UNAUTHORIZED'));
  } catch (error) {
    return next(error);
  }
}

function logout(req, res) {
  res.clearCookie('admin_session', getCookieOptions({
    httpOnly: true,
  }));

  res.clearCookie('cliente_session', getCookieOptions({
    httpOnly: true,
  }));

  return res.json({
    status: 'success',
    message: 'Sesión finalizada correctamente.',
  });
}

module.exports = {
  getCsrf,
  login,
  register,
  getMe,
  logout,
};
