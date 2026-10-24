const clienteModel = require('../models/clienteModel');
const ApiError = require('../utils/apiError');

async function clientAuthMiddleware(req, res, next) {
  try {
    const clienteId =
      (req.signedCookies && req.signedCookies.cliente_session) ||
      (req.cookies && req.cookies.cliente_session);

    if (!clienteId) {
      return next(
        ApiError.unauthorized('No autorizado. Se requiere iniciar sesión como cliente.', 'UNAUTHORIZED')
      );
    }

    const cliente = await clienteModel.findById(clienteId);
    if (!cliente) {
      return next(
        ApiError.unauthorized('No autorizado. Sesión de cliente no válida o expirada.', 'UNAUTHORIZED')
      );
    }

    req.cliente = {
      id_cliente: cliente.id_cliente,
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono,
      creado_en: cliente.creado_en,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = clientAuthMiddleware;
