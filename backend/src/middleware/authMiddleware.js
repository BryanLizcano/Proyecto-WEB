const administradorModel = require('../models/administradorModel');
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

    req.user = {
      id_administrador: admin.id_administrador,
      nombre: admin.nombre,
      email: admin.email,
      creado_en: admin.creado_en,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authMiddleware;
