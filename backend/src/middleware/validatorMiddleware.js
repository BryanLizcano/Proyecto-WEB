const validator = require('validator');
const ApiError = require('../utils/apiError');

const VALID_ORDER_STATUSES = ['PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'COMPLETADO', 'CANCELADO'];

function validateId(req, res, next) {
  const { id } = req.params;
  const numId = parseInt(id, 10);

  if (!/^\d+$/.test(id) || Number.isNaN(numId) || numId <= 0) {
    return next(
      ApiError.badRequest('El parámetro de identificador debe ser un número entero válido.')
    );
  }

  req.params.id = numId;
  return next();
}

function validateCategoryInput(req, res, next) {
  const { nombre, descripcion } = req.body || {};
  const details = [];

  if (!nombre || typeof nombre !== 'string' || validator.isEmpty(nombre.trim())) {
    details.push({ field: 'nombre', message: 'El nombre de la categoría es requerido.' });
  } else if (!validator.isLength(nombre.trim(), { min: 1, max: 100 })) {
    details.push({ field: 'nombre', message: 'El nombre no puede exceder 100 caracteres.' });
  }

  if (descripcion !== undefined && descripcion !== null && typeof descripcion !== 'string') {
    details.push({ field: 'descripcion', message: 'La descripción debe ser una cadena de texto.' });
  }

  if (details.length > 0) {
    return next(ApiError.unprocessable('Errores de validación en los campos del formulario.', details));
  }

  req.body.nombre = validator.escape(nombre.trim());
  req.body.descripcion = descripcion ? validator.escape(descripcion.trim()) : null;

  return next();
}

function validateProductoInput(req, res, next) {
  const { id_categoria, nombre, descripcion, precio, stock, imagen_url } = req.body || {};
  const details = [];

  const numCategoria = parseInt(id_categoria, 10);
  if (id_categoria === undefined || Number.isNaN(numCategoria) || numCategoria <= 0 || !Number.isInteger(Number(id_categoria))) {
    details.push({ field: 'id_categoria', message: 'El id_categoria debe ser un entero positivo.' });
  }

  if (!nombre || typeof nombre !== 'string' || validator.isEmpty(nombre.trim())) {
    details.push({ field: 'nombre', message: 'El nombre del producto es requerido.' });
  } else if (!validator.isLength(nombre.trim(), { min: 1, max: 150 })) {
    details.push({ field: 'nombre', message: 'El nombre no puede exceder 150 caracteres.' });
  }

  if (descripcion !== undefined && descripcion !== null && typeof descripcion !== 'string') {
    details.push({ field: 'descripcion', message: 'La descripción debe ser una cadena de texto.' });
  }

  const numPrecio = Number(precio);
  if (precio === undefined || Number.isNaN(numPrecio) || numPrecio < 0) {
    details.push({ field: 'precio', message: 'El precio debe ser un número mayor o igual a cero.' });
  }

  const numStock = parseInt(stock, 10);
  if (stock === undefined || Number.isNaN(numStock) || !Number.isInteger(Number(stock)) || numStock < 0) {
    details.push({ field: 'stock', message: 'El stock no puede ser un valor negativo.' });
  }

  if (imagen_url !== undefined && imagen_url !== null) {
    if (typeof imagen_url !== 'string') {
      details.push({ field: 'imagen_url', message: 'La URL de la imagen debe ser una cadena de texto.' });
    } else if (imagen_url.trim().length > 0) {
      if (imagen_url.trim().length > 255) {
        details.push({ field: 'imagen_url', message: 'La URL de la imagen no puede exceder 255 caracteres.' });
      } else if (!validator.isURL(imagen_url.trim(), { protocols: ['http', 'https'], require_protocol: true })) {
        details.push({ field: 'imagen_url', message: 'La URL de la imagen debe ser una URI válida con protocolo http o https.' });
      }
    }
  }

  if (details.length > 0) {
    return next(ApiError.unprocessable('Errores de validación en los campos del formulario.', details));
  }

  req.body.id_categoria = numCategoria;
  req.body.nombre = validator.escape(nombre.trim());
  req.body.descripcion = descripcion ? validator.escape(descripcion.trim()) : null;
  req.body.precio = numPrecio;
  req.body.stock = numStock;
  req.body.imagen_url = (imagen_url && typeof imagen_url === 'string' && imagen_url.trim().length > 0) ? validator.trim(imagen_url) : null;

  return next();
}

function validateProductQueryParams(req, res, next) {
  const { id_categoria, page, limit, q } = req.query;

  if (id_categoria !== undefined) {
    const parsedCat = parseInt(id_categoria, 10);
    if (!/^\d+$/.test(id_categoria) || Number.isNaN(parsedCat) || parsedCat <= 0) {
      return next(ApiError.badRequest('El parámetro id_categoria debe ser un número entero válido.'));
    }
    req.query.id_categoria = parsedCat;
  }

  if (page !== undefined) {
    const parsedPage = parseInt(page, 10);
    if (!/^\d+$/.test(page) || Number.isNaN(parsedPage) || parsedPage < 1) {
      return next(ApiError.badRequest('El parámetro page debe ser un entero mayor o igual a 1.'));
    }
    req.query.page = parsedPage;
  }

  if (limit !== undefined) {
    const parsedLimit = parseInt(limit, 10);
    if (!/^\d+$/.test(limit) || Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
      return next(ApiError.badRequest('El parámetro limit debe ser un entero entre 1 y 50.'));
    }
    req.query.limit = parsedLimit;
  }

  if (q !== undefined && typeof q === 'string') {
    req.query.q = q.trim();
  }

  return next();
}

function validateLoginInput(req, res, next) {
  const { email, password } = req.body || {};
  const details = [];

  if (!email || typeof email !== 'string' || !validator.isEmail(email.trim())) {
    details.push({ field: 'email', message: 'Debe ingresar un correo electrónico válido.' });
  }

  if (!password || typeof password !== 'string' || validator.isEmpty(password)) {
    details.push({ field: 'password', message: 'La contraseña es obligatoria.' });
  }

  if (details.length > 0) {
    return next(ApiError.unprocessable('Errores de validación en los campos del formulario.', details));
  }

  req.body.email = email.trim().toLowerCase();
  return next();
}

function validateOrderInput(req, res, next) {
  const { nombre_cliente, contacto_cliente, items } = req.body || {};
  const details = [];

  if (!nombre_cliente || typeof nombre_cliente !== 'string' || validator.isEmpty(nombre_cliente.trim())) {
    details.push({ field: 'nombre_cliente', message: 'El nombre del cliente es obligatorio.' });
  } else if (!validator.isLength(nombre_cliente.trim(), { min: 1, max: 100 })) {
    details.push({ field: 'nombre_cliente', message: 'El nombre del cliente no puede exceder 100 caracteres.' });
  }

  if (!contacto_cliente || typeof contacto_cliente !== 'string' || validator.isEmpty(contacto_cliente.trim())) {
    details.push({ field: 'contacto_cliente', message: 'El dato de contacto del cliente es obligatorio.' });
  } else if (!validator.isLength(contacto_cliente.trim(), { min: 1, max: 100 })) {
    details.push({ field: 'contacto_cliente', message: 'El dato de contacto no puede exceder 100 caracteres.' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    details.push({ field: 'items', message: 'El pedido debe contener al menos un producto en el arreglo items.' });
  } else {
    items.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        details.push({ field: `items[${index}]`, message: 'Cada ítem debe ser un objeto válido.' });
        return;
      }
      const numId = parseInt(item.id_producto, 10);
      if (item.id_producto === undefined || Number.isNaN(numId) || !Number.isInteger(Number(item.id_producto)) || numId <= 0) {
        details.push({ field: `items[${index}].id_producto`, message: 'El id_producto debe ser un entero positivo.' });
      }

      const numCant = parseInt(item.cantidad, 10);
      if (item.cantidad === undefined || Number.isNaN(numCant) || !Number.isInteger(Number(item.cantidad)) || numCant <= 0) {
        details.push({ field: `items[${index}].cantidad`, message: 'La cantidad debe ser un número entero mayor a cero.' });
      }
    });
  }

  if (details.length > 0) {
    return next(ApiError.unprocessable('Errores de validación en los campos del formulario.', details));
  }

  req.body.nombre_cliente = validator.escape(nombre_cliente.trim());
  req.body.contacto_cliente = validator.escape(contacto_cliente.trim());
  req.body.items = items.map((it) => ({
    id_producto: parseInt(it.id_producto, 10),
    cantidad: parseInt(it.cantidad, 10),
  }));

  return next();
}

function validateOrderStatusInput(req, res, next) {
  const { estado } = req.body || {};
  if (!estado || typeof estado !== 'string' || !VALID_ORDER_STATUSES.includes(estado.trim().toUpperCase())) {
    return next(
      ApiError.unprocessable('Errores de validación en los campos del formulario.', [
        {
          field: 'estado',
          message: `El estado debe ser uno de los siguientes valores: ${VALID_ORDER_STATUSES.join(', ')}.`,
        },
      ])
    );
  }

  req.body.estado = estado.trim().toUpperCase();
  return next();
}

function validateOrderQueryParams(req, res, next) {
  const { estado, page, limit } = req.query;

  if (estado !== undefined && typeof estado === 'string') {
    const upperEstado = estado.trim().toUpperCase();
    if (upperEstado && !VALID_ORDER_STATUSES.includes(upperEstado)) {
      return next(
        ApiError.badRequest(`El filtro de estado debe ser uno de: ${VALID_ORDER_STATUSES.join(', ')}.`)
      );
    }
    req.query.estado = upperEstado;
  }

  if (page !== undefined) {
    const parsedPage = parseInt(page, 10);
    if (!/^\d+$/.test(page) || Number.isNaN(parsedPage) || parsedPage < 1) {
      return next(ApiError.badRequest('El parámetro page debe ser un entero mayor o igual a 1.'));
    }
    req.query.page = parsedPage;
  }

  if (limit !== undefined) {
    const parsedLimit = parseInt(limit, 10);
    if (!/^\d+$/.test(limit) || Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
      return next(ApiError.badRequest('El parámetro limit debe ser un entero entre 1 y 50.'));
    }
    req.query.limit = parsedLimit;
  }

  return next();
}

module.exports = {
  validateId,
  validateCategoryInput,
  validateCategoriaInput: validateCategoryInput,
  validateProductoInput,
  validateProductQueryParams,
  validateLoginInput,
  validateOrderInput,
  validateOrderStatusInput,
  validateOrderQueryParams,
  VALID_ORDER_STATUSES,
};
