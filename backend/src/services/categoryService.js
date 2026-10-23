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

/**
 * Actualiza una categoría existente validando su existencia y que el nombre no colisione con otra.
 * @param {number} id
 * @param {{ nombre: string, descripcion?: string|null }} param1
 * @returns {Promise<{id_categoria: number, nombre: string, descripcion: string|null}>}
 */
async function updateCategory(id, { nombre, descripcion = null }) {
  const currentCategory = await findCategoryById(id);
  if (!currentCategory) {
    throw ApiError.notFound('Categoría no encontrada.', 'NOT_FOUND');
  }

  const checkSql = 'SELECT id_categoria FROM categoria WHERE LOWER(nombre) = LOWER($1) AND id_categoria != $2';
  const duplicate = await query(checkSql, [nombre, id]);

  if (duplicate.rows.length > 0) {
    throw ApiError.conflict('Ya existe otra categoría con el nombre especificado.', 'DUPLICATE_CATEGORY_NAME');
  }

  const updateSql = `
    UPDATE categoria
    SET nombre = $1, descripcion = $2
    WHERE id_categoria = $3
    RETURNING id_categoria, nombre, descripcion
  `;
  const result = await query(updateSql, [nombre, descripcion, id]);
  return result.rows[0];
}

/**
 * Elimina una categoría del catálogo siempre que no posea productos asociados.
 * @param {number} id
 * @returns {Promise<void>}
 */
async function deleteCategory(id) {
  const currentCategory = await findCategoryById(id);
  if (!currentCategory) {
    throw ApiError.notFound('Categoría no encontrada.', 'NOT_FOUND');
  }

  const countSql = 'SELECT COUNT(*)::int AS total FROM producto WHERE id_categoria = $1';
  const countResult = await query(countSql, [id]);

  if (countResult.rows[0]?.total > 0) {
    throw ApiError.conflict(
      'No se puede eliminar la categoría porque contiene productos asociados.',
      'CATEGORY_HAS_PRODUCTS'
    );
  }

  try {
    const deleteSql = 'DELETE FROM categoria WHERE id_categoria = $1';
    await query(deleteSql, [id]);
  } catch (error) {
    // 23503 corresponde a violación de restricción de clave foránea (ON DELETE RESTRICT)
    if (error.code === '23503') {
      throw ApiError.conflict(
        'No se puede eliminar la categoría porque contiene productos asociados.',
        'CATEGORY_HAS_PRODUCTS'
      );
    }
    throw error;
  }
}

module.exports = {
  getAllCategories,
  findCategoryById,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
