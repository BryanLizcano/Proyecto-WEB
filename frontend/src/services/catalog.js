import api from './api'

export async function getCategories() {
  const { data } = await api.get('/categorias')
  return data.data
}
export async function getProducts(params = {}) {
  const { data } = await api.get('/productos', { params })
  return data
}
export async function getProduct(id) {
  const { data } = await api.get(`/productos/${id}`)
  return data.data
}
export async function createCategory(payload) {
  const { data } = await api.post('/categorias', payload)
  return data.data
}
export async function createProduct(payload) {
  const { data } = await api.post('/productos', payload)
  return data.data
}
