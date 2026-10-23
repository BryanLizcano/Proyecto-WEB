class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, code = 'BAD_REQUEST', details = null) {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(message = 'No autorizado. Se requiere iniciar sesión como administrador.', code = 'UNAUTHORIZED') {
    return new ApiError(401, code, message);
  }

  static forbidden(message = 'Token CSRF faltante o inválido.', code = 'CSRF_TOKEN_INVALID') {
    return new ApiError(403, code, message);
  }

  static notFound(message = 'El recurso solicitado no fue encontrado en el servidor.', code = 'NOT_FOUND') {
    return new ApiError(404, code, message);
  }

  static conflict(message, code = 'CONFLICT', details = null) {
    return new ApiError(409, code, message, details);
  }

  static unprocessable(message = 'Errores de validación en los campos del formulario.', details = []) {
    return new ApiError(422, 'UNPROCESSABLE_ENTITY', message, details);
  }

  static internal(message = 'Ocurrió un error inesperado en el servidor. Intente de nuevo más tarde.') {
    return new ApiError(500, 'INTERNAL_SERVER_ERROR', message);
  }
}

module.exports = ApiError;
