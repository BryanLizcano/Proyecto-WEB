const bcrypt = require('bcrypt');
const administradorModel = require('../models/administradorModel');
const ApiError = require('../utils/apiError');

async function login(email, password) {
  const admin = await administradorModel.findByEmail(email);
  if (!admin) {
    throw ApiError.unauthorized('Correo o contraseña incorrectos.', 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Correo o contraseña incorrectos.', 'INVALID_CREDENTIALS');
  }

  return {
    id_administrador: admin.id_administrador,
    nombre: admin.nombre,
    email: admin.email,
    creado_en: admin.creado_en,
  };
}

module.exports = {
  login,
};
