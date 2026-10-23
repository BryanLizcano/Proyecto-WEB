const { query } = require('../config/db');
const ApiError = require('../utils/apiError');

/**
 * Consulta todas las categorías ordenadas por id_categoria ascendente.
 * @returns {Promise<Array<{id_categoria: number, nombre: string, descripcion: string|null}>>}
 */
async function getAllCategories() {
  const sql = 'SELECT id_categoria, nombre, descripcion FROM categoria ORDER BY id_categoria ASC';
  const result = await query(sql);
  return result.rows;
}

/**
 * Busca una categoría por ID sin arrojar excepción (para uso interno o entre servicios).
 * @param {number} id
 * @returns {Promise<{id_categoria: number, nombre: string, descripcion: string|null}|null>}
 */
async function findCategoryById(id) {
  const sql = 'SELECT id_categoria, nombre, descripcion FROM categoria WHERE id_categoria = $1';
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

/**
 * Consulta el detalle de una categoría por su identificador numérico.
 * @param {number} id
 * @returns {Promise<{id_categoria: number, nombre: string, descripcion: string|null}>}
 */
async function getCategoryById(id) {
  const category = await findCategoryById(id);
  if (!category) {
    throw ApiError.notFound('Categoría no encontrada.', 'NOT_FOUND');
  }
  return category;
}

/**
 * Registra una nueva categoría validando que no exista duplicidad de nombre.
 * @param {{ nombre: string, descripcion?: string|null }} param0
 * @returns {Promise<{id_categoria: number, nombre: string, descripcion: string|null}>}
 */
async function createCategory({ nombre, descripcion = null }) {
  const checkSql = 'SELECT id_categoria, nombre, descripcion FROM categoria WHERE LOWER(nombre) = LOWER($1)';
  const existing = await query(checkSql, [nombre]);

  if (existing.rows.length > 0) {
    throw ApiError.conflict('Ya existe una categoría con el nombre especificado.', 'DUPLICATE_CATEGORY_NAME');
  }

  const insertSql = `
    INSERT INTO categoria (nombre, descripcion)
    VALUES ($1, $2)
    RETURNING id_categoria, nombre, descripcion
  `;
  const result = await query(insertSql, [nombre, descripcion]);
  return result.rows[0];
}

module.exports = {
  getAllCategories,
  findCategoryById,
  getCategoryById,
  createCategory,
};
