import { ref } from 'vue'
import { defineStore } from 'pinia'
import api, { getApiError } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const authenticated = ref(false)
  const user = ref(null)

  async function login(credentials) {
    try {
      const { data } = await api.post('/auth/login', credentials)
      authenticated.value = true
      user.value = data.data
      return { success: true }
    } catch (error) {
      return { success: false, message: getApiError(error) }
    }
  }
  async function checkSession() {
    if (authenticated.value) return true
    try {
      const { data } = await api.get('/auth/me')
      authenticated.value = true
      user.value = data.data
      return true
    } catch {
      authenticated.value = false
      user.value = null
      return false
    }
  }
  async function logout() {
    try { await api.post('/auth/logout') } finally {
      authenticated.value = false
      user.value = null
    }
  }

  return { authenticated, user, login, checkSession, logout }
})
