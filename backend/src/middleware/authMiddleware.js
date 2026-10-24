const administradorModel = require('../models/administradorModel');
const env = require('../config/env');
const ApiError = require('../utils/apiError');

async function authMiddleware(req, res, next) {
  try {
    const adminId = (req.signedCookies && req.signedCookies.admin_session) || (req.cookies && req.cookies.admin_session);

    if (!adminId) {
      return next(ApiError.unauthorized('No autorizado. Se requiere iniciar sesión como administrador.', 'UNAUTHORIZED'));
    }

    const admin = await administradorModel.findById(adminId);
    if (!admin) {
      return next(ApiError.unauthorized('No autorizado. Sesión no válida o expirada.', 'UNAUTHORIZED'));
    }

    // Refrescar cookie por 10 minutos de inactividad
    res.cookie('admin_session', String(admin.id_administrador), {
      signed: true,
      httpOnly: true,
      sameSite: 'lax',
      secure: env.nodeEnv === 'production',
      maxAge: 10 * 60 * 1000,
      path: '/',
    });

    req.user = {
      id_administrador: admin.id_administrador,
      nombre: admin.nombre,
      email: admin.email,
      rol: 'admin',
      creado_en: admin.creado_en,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authMiddleware;
