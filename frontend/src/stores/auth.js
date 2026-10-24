import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api, { getApiError } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const authenticated = ref(false)
  const user = ref(null)
  const inactivityWarning = ref('')

  // Duración de inactividad para administrador: 10 minutos
  const ADMIN_INACTIVITY_LIMIT = 10 * 60 * 1000
  let inactivityTimer = null
  let activityListenersBound = false

  const isAdmin = computed(() => user.value?.rol === 'admin')
  const isClient = computed(() => user.value?.rol === 'cliente')

  function resetInactivityTimer() {
    if (!isAdmin.value) return

    if (inactivityTimer) {
      clearTimeout(inactivityTimer)
    }

    inactivityTimer = setTimeout(() => {
      handleAdminInactivityTimeout()
    }, ADMIN_INACTIVITY_LIMIT)
  }

  function handleUserActivity() {
    resetInactivityTimer()
  }

  function startInactivityMonitoring() {
    if (activityListenersBound || typeof window === 'undefined') return
    const events = ['mousedown', 'click', 'keydown', 'scroll', 'touchstart']
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }))
    activityListenersBound = true
    resetInactivityTimer()
  }

  function stopInactivityMonitoring() {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer)
      inactivityTimer = null
    }
    if (!activityListenersBound || typeof window === 'undefined') return
    const events = ['mousedown', 'click', 'keydown', 'scroll', 'touchstart']
    events.forEach((evt) => window.removeEventListener(evt, handleUserActivity))
    activityListenersBound = false
  }

  async function handleAdminInactivityTimeout() {
    inactivityWarning.value = 'Tu sesión de administrador ha expirado por 10 minutos de inactividad.'
    await logout()
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      window.location.href = '/'
    }
  }

  async function login(credentials) {
    try {
      const { data } = await api.post('/auth/login', credentials)
      authenticated.value = true
      user.value = data.data

      if (user.value.rol === 'admin') {
        startInactivityMonitoring()
      } else {
        stopInactivityMonitoring()
        // La sesión del cliente persiste en sessionStorage (se destruye al cerrar el navegador)
        sessionStorage.setItem('ritmo_session_user', JSON.stringify(data.data))
      }

      return { success: true, user: data.data }
    } catch (error) {
      return { success: false, message: getApiError(error) }
    }
  }

  async function register(customerData) {
    try {
      const { data } = await api.post('/auth/register', customerData)
      authenticated.value = true
      user.value = data.data
      stopInactivityMonitoring()
      // La sesión del cliente persiste en sessionStorage (se destruye al cerrar el navegador)
      sessionStorage.setItem('ritmo_session_user', JSON.stringify(data.data))

      return { success: true, user: data.data }
    } catch (error) {
      return { success: false, message: getApiError(error) }
    }
  }

  async function checkSession() {
    try {
      const { data } = await api.get('/auth/me')
      authenticated.value = true
      user.value = data.data

      if (user.value.rol === 'admin') {
        startInactivityMonitoring()
      } else {
        sessionStorage.setItem('ritmo_session_user', JSON.stringify(data.data))
      }

      return true
    } catch {
      authenticated.value = false
      user.value = null
      stopInactivityMonitoring()
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('ritmo_session_user')
      }
      return false
    }
  }

  async function logout() {
    stopInactivityMonitoring()
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('ritmo_session_user')
    }
    try {
      await api.post('/auth/logout')
    } finally {
      authenticated.value = false
      user.value = null
    }
  }

  return {
    authenticated,
    user,
    isAdmin,
    isClient,
    inactivityWarning,
    login,
    register,
    checkSession,
    logout,
    resetInactivityTimer,
  }
})
