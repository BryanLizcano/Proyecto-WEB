import api from './api'

export async function getClientProfile() {
  const { data } = await api.get('/clientes/perfil')
  return data.data
}

export async function updateClientProfile(payload) {
  const { data } = await api.put('/clientes/perfil', payload)
  return data.data
}

export async function getClientOrders() {
  const { data } = await api.get('/clientes/pedidos')
  return data.data
}

export async function getClientOrderDetail(id) {
  const { data } = await api.get(`/clientes/pedidos/${id}`)
  return data.data
}
