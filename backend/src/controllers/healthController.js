const healthService = require('../services/healthService');
const { sendSuccess } = require('../utils/apiResponse');

async function getHealth(req, res, next) {
  try {
    const healthData = await healthService.checkHealth();
    return sendSuccess(res, healthData, 200);
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      code: 'DATABASE_DISCONNECTED',
      message: 'El servidor está activo pero no se pudo conectar a la base de datos.',
      details: [
        {
          field: 'database',
          message: error.message,
        },
      ],
    });
  }
}

module.exports = {
  getHealth,
};
