const ApiError = require('../utils/apiError');

function csrfMiddleware(req, res, next) {
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return next();
  }

  const tokenHeader = req.headers['x-csrf-token'];
  const tokenCookie = (req.cookies && req.cookies['XSRF-TOKEN']) || (req.signedCookies && req.signedCookies['XSRF-TOKEN']);

  if (!tokenHeader || !tokenCookie || tokenHeader !== tokenCookie) {
    return next(ApiError.forbidden('Token CSRF faltante o inválido.', 'CSRF_TOKEN_INVALID'));
  }

  return next();
}

module.exports = csrfMiddleware;
