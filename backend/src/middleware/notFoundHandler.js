function notFoundHandler(req, res) {
  return res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = notFoundHandler;
