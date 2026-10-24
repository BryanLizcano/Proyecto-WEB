const bcrypt = require('bcrypt');
const administradorModel = require('../models/administradorModel');
const clienteModel = require('../models/clienteModel');
const ApiError = require('../utils/apiError');

async function login(email, password) {
  // 1. Verificar si corresponde a un administrador
  const admin = await administradorModel.findByEmail(email);
  if (admin) {
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Correo o contraseña incorrectos.', 'INVALID_CREDENTIALS');
    }

    return {
      id_administrador: admin.id_administrador,
      nombre: admin.nombre,
      email: admin.email,
      rol: 'admin',
      creado_en: admin.creado_en,
    };
  }

  // 2. Verificar si corresponde a un cliente de la tienda
  const cliente = await clienteModel.findByEmail(email);
  if (cliente) {
    const isPasswordValid = await bcrypt.compare(password, cliente.password_hash);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Correo o contraseña incorrectos.', 'INVALID_CREDENTIALS');
    }

    return {
      id_cliente: cliente.id_cliente,
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono,
      rol: 'cliente',
      creado_en: cliente.creado_en,
    };
  }

  // 3. Usuario no encontrado
  throw ApiError.unauthorized('Correo o contraseña incorrectos.', 'INVALID_CREDENTIALS');
}

async function register({ nombre, email, password, telefono = null }) {
  // Comprobar si el correo ya existe como admin o cliente
  const [existingAdmin, existingClient] = await Promise.all([
    administradorModel.findByEmail(email),
    clienteModel.findByEmail(email),
  ]);

  if (existingAdmin || existingClient) {
    throw ApiError.conflict('El correo ya se encuentra registrado.', 'EMAIL_ALREADY_EXISTS');
  }

  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  const newClient = await clienteModel.create({
    nombre: nombre.trim(),
    email: email.trim().toLowerCase(),
    password_hash,
    telefono: telefono ? telefono.trim() : null,
  });

  return {
    id_cliente: newClient.id_cliente,
    nombre: newClient.nombre,
    email: newClient.email,
    telefono: newClient.telefono,
    rol: 'cliente',
    creado_en: newClient.creado_en,
  };
}

module.exports = {
  login,
  register,
};
