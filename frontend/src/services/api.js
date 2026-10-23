import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  withCredentials: true,
  timeout: 10000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
})

let csrfToken = null

api.interceptors.request.use(async (config) => {
  if (!['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) return config
  if (!csrfToken) {
    const { data } = await api.get('/auth/csrf')
    csrfToken = data.csrfToken
  }
  config.headers['X-CSRF-Token'] = csrfToken
  return config
})

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 403) csrfToken = null
  return Promise.reject(error)
})

export function getApiError(error) {
  if (!error.response) return 'No hay conexión con la API. Comprueba que el backend esté iniciado.'
  if (error.response.status === 404 && !error.response.data?.message) return 'Este endpoint todavía no está implementado en el backend.'
  if (error.response.data?.details && Array.isArray(error.response.data.details) && error.response.data.details.length > 0) {
    const detailMessages = error.response.data.details.map((d) => d.message).join(' ')
    return `${error.response.data.message || 'Error de validación:'} ${detailMessages}`
  }
  return error.response.data?.message || 'No fue posible completar la solicitud.'
}

export default api
