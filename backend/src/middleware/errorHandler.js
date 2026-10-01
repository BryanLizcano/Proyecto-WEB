const ApiError = require('../utils/apiError');

function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    const responsePayload = {
      status: 'error',
      code: err.code,
      message: err.message,
    };

    if (err.details && err.details.length > 0) {
      responsePayload.details = err.details;
    }

    return res.status(err.statusCode).json(responsePayload);
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 'error',
      code: 'BAD_REQUEST',
      message: 'Cuerpo de la petición JSON inválido o malformado.',
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({
      status: 'error',
      code: 'CONFLICT',
      message: 'El recurso ya existe o viola una restricción de unicidad.',
    });
  }

  console.error('Error no controlado:', err);

  return res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Ocurrió un error inesperado en el servidor. Intente de nuevo más tarde.',
  });
}

module.exports = errorHandler;
