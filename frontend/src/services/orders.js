import api from './api'

export async function createOrder(payload) {
  const { data } = await api.post('/pedidos', payload)
  return data.data
}

export async function getOrders(params = {}) {
  const { data } = await api.get('/pedidos', { params })
  return data
}

export async function getOrder(id) {
  const { data } = await api.get(`/pedidos/${id}`)
  return data.data
}

export async function updateOrderStatus(id, estado) {
  const { data } = await api.patch(`/pedidos/${id}/estado`, { estado })
  return data.data
}
