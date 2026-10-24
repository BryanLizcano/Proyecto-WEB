<script setup>
import { ref, watch } from 'vue'
import { AlertCircle, CheckCircle2, Lock, LogIn, Mail, Phone, ShieldCheck, User, UserPlus, X } from '@lucide/vue'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  initialTab: { type: String, default: 'login' }, // 'login' | 'register'
  contextMessage: { type: String, default: '' },
})

const emit = defineEmits(['close', 'success'])

const auth = useAuthStore()
const activeTab = ref(props.initialTab || 'login')
const isSubmitting = ref(false)
const errorMessage = ref('')
const successNotice = ref('')

// Formulario Login
const loginForm = ref({
  email: '',
  password: '',
})

// Formulario Registro
const registerForm = ref({
  nombre: '',
  email: '',
  password: '',
  telefono: '',
})

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      activeTab.value = props.initialTab || 'login'
      errorMessage.value = ''
      successNotice.value = ''
    }
  }
)

function switchTab(tab) {
  activeTab.value = tab
  errorMessage.value = ''
  successNotice.value = ''
}

async function handleLogin() {
  if (!loginForm.value.email || !loginForm.value.password) {
    errorMessage.value = 'Por favor completa todos los campos requeridos.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  successNotice.value = ''

  const res = await auth.login({
    email: loginForm.value.email.trim(),
    password: loginForm.value.password,
  })

  isSubmitting.value = false

  if (res.success) {
    const isAdm = res.user.rol === 'admin'
    successNotice.value = isAdm
      ? 'Sesión de Administrador iniciada correctamente.'
      : `¡Bienvenido(a), ${res.user.nombre}!`

    setTimeout(() => {
      emit('success', res.user)
      emit('close')
      loginForm.value.password = ''
    }, 600)
  } else {
    errorMessage.value = res.message || 'Credenciales inválidas.'
  }
}

async function handleRegister() {
  if (!registerForm.value.nombre || !registerForm.value.email || !registerForm.value.password) {
    errorMessage.value = 'Por favor completa el nombre, correo y contraseña.'
    return
  }

  if (registerForm.value.password.length < 6) {
    errorMessage.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  successNotice.value = ''

  const res = await auth.register({
    nombre: registerForm.value.nombre.trim(),
    email: registerForm.value.email.trim(),
    password: registerForm.value.password,
    telefono: registerForm.value.telefono.trim(),
  })

  isSubmitting.value = false

  if (res.success) {
    successNotice.value = `¡Cuenta creada con éxito! Bienvenido(a), ${res.user.nombre}.`
    setTimeout(() => {
      emit('success', res.user)
      emit('close')
      registerForm.value = { nombre: '', email: '', password: '', telefono: '' }
    }, 700)
  } else {
    errorMessage.value = res.message || 'No se pudo crear la cuenta.'
  }
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="auth-modal-backdrop" @click.self="handleClose">
        <div class="auth-modal-card" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
          <!-- CABECERA -->
          <header class="auth-modal-header">
            <div class="header-brand">
              <span class="brand-chip">R</span>
              <div>
                <h2 id="auth-modal-title">RITMO<span class="brand-dot">.</span></h2>
                <p class="header-tagline">Tu cuenta para compras y gestión</p>
              </div>
            </div>

            <button
              class="close-button"
              type="button"
              aria-label="Cerrar ventana de autenticación"
              @click="handleClose"
            >
              <X :size="20" />
            </button>
          </header>

          <!-- AVISO DE CONTEXTO (SI VIENE DE CARRITO/CHECKOUT) -->
          <div v-if="contextMessage" class="auth-context-banner">
            <Lock :size="14" />
            <span>{{ contextMessage }}</span>
          </div>

          <!-- NAVEGACIÓN ENTRE TABS (INICIAR SESIÓN / CREAR CUENTA) -->
          <nav class="auth-tabs" role="tablist">
            <button
              class="auth-tab"
              :class="{ active: activeTab === 'login' }"
              type="button"
              role="tab"
              :aria-selected="activeTab === 'login'"
              @click="switchTab('login')"
            >
              <LogIn :size="15" />
              <span>Iniciar sesión</span>
            </button>

            <button
              class="auth-tab"
              :class="{ active: activeTab === 'register' }"
              type="button"
              role="tab"
              :aria-selected="activeTab === 'register'"
              @click="switchTab('register')"
            >
              <UserPlus :size="15" />
              <span>Crear cuenta</span>
            </button>
          </nav>

          <!-- CUERPO DEL MODAL -->
          <div class="auth-modal-body">
            <!-- AVISO DE ÉXITO -->
            <div v-if="successNotice" class="notice notice-success" role="alert">
              <CheckCircle2 :size="18" />
              <span>{{ successNotice }}</span>
            </div>

            <!-- AVISO DE ERROR -->
            <div v-if="errorMessage" class="notice notice-error" role="alert">
              <AlertCircle :size="18" />
              <span>{{ errorMessage }}</span>
            </div>

            <!-- TAB 1: INICIAR SESIÓN (CLIENTE O ADMIN) -->
            <form v-if="activeTab === 'login'" class="auth-form" @submit.prevent="handleLogin">
              <p class="auth-intro-text">
                Ingresa con tu correo y contraseña. Si eres cliente o administrador, el sistema identificará tu rol automáticamente.
              </p>

              <label class="field-label">
                Correo electrónico
                <div class="input-with-icon">
                  <Mail :size="16" class="input-icon" />
                  <input
                    v-model.trim="loginForm.email"
                    class="text-input"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    required
                    autocomplete="email"
                  />
                </div>
              </label>

              <label class="field-label">
                Contraseña
                <div class="input-with-icon">
                  <Lock :size="16" class="input-icon" />
                  <input
                    v-model="loginForm.password"
                    class="text-input"
                    type="password"
                    placeholder="••••••••"
                    required
                    autocomplete="current-password"
                  />
                </div>
              </label>

              <button
                class="button button-dark submit-button"
                type="submit"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? 'Iniciando sesión...' : 'Ingresar a mi cuenta' }}
                <LogIn :size="16" />
              </button>

              <div class="switch-prompt">
                <span>¿Aún no tienes cuenta?</span>
                <button class="link-button" type="button" @click="switchTab('register')">
                  Regístrate aquí
                </button>
              </div>
            </form>

            <!-- TAB 2: CREAR CUENTA DE CLIENTE -->
            <form v-else class="auth-form" @submit.prevent="handleRegister">
              <p class="auth-intro-text">
                Crea tu cuenta de cliente para completar tus pedidos de forma rápida y segura en la tienda.
              </p>

              <label class="field-label">
                Nombre completo
                <div class="input-with-icon">
                  <User :size="16" class="input-icon" />
                  <input
                    v-model.trim="registerForm.nombre"
                    class="text-input"
                    type="text"
                    maxlength="100"
                    placeholder="Ej. Valentina Morales"
                    required
                  />
                </div>
              </label>

              <label class="field-label">
                Correo electrónico
                <div class="input-with-icon">
                  <Mail :size="16" class="input-icon" />
                  <input
                    v-model.trim="registerForm.email"
                    class="text-input"
                    type="email"
                    maxlength="120"
                    placeholder="valentina@ejemplo.com"
                    required
                  />
                </div>
              </label>

              <label class="field-label">
                Teléfono o WhatsApp (opcional)
                <div class="input-with-icon">
                  <Phone :size="16" class="input-icon" />
                  <input
                    v-model.trim="registerForm.telefono"
                    class="text-input"
                    type="tel"
                    maxlength="50"
                    placeholder="+57 300 1234567"
                  />
                </div>
              </label>

              <label class="field-label">
                Contraseña
                <div class="input-with-icon">
                  <Lock :size="16" class="input-icon" />
                  <input
                    v-model="registerForm.password"
                    class="text-input"
                    type="password"
                    minlength="6"
                    placeholder="Mínimo 6 caracteres"
                    required
                    autocomplete="new-password"
                  />
                </div>
              </label>

              <button
                class="button button-dark submit-button"
                type="submit"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? 'Creando cuenta...' : 'Crear cuenta y continuar' }}
                <UserPlus :size="16" />
              </button>

              <div class="switch-prompt">
                <span>¿Ya tienes cuenta?</span>
                <button class="link-button" type="button" @click="switchTab('login')">
                  Inicia sesión
                </button>
              </div>
            </form>
          </div>

          <!-- FOOTER -->
          <footer class="auth-modal-footer">
            <div class="footer-badges">
              <span><ShieldCheck :size="13" /> Conexión segura</span>
              <span>RITMO Auth v2.0</span>
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.auth-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 110;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 26, 23, 0.65);
  backdrop-filter: blur(4px);
  padding: 16px;
}

.auth-modal-card {
  width: min(440px, 100%);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #deded5;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: card-appear 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes card-appear {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* HEADER */
.auth-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #1e4a3d;
  color: #fffefa;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-chip {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  background: #d5f064;
  color: #14372e;
  font-weight: 900;
  font-size: 17px;
}

.header-brand h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #fffefa;
}

.brand-dot {
  color: #d5f064;
}

.header-tagline {
  margin: 0;
  font-size: 10px;
  color: rgba(255, 255, 250, 0.7);
}

.close-button {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  background: transparent;
  border: 0;
  color: rgba(255, 255, 250, 0.8);
  cursor: pointer;
  transition: color 0.15s;
}

.close-button:hover {
  color: #ffffff;
}

/* CONTEXT BANNER */
.auth-context-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: #fff8e6;
  border-bottom: 1px solid #f2d07e;
  font-size: 11px;
  color: #634300;
  font-weight: 600;
}

/* TABS */
.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #f4f3ee;
  border-bottom: 1px solid #deded5;
}

.auth-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 8px;
  border: 0;
  background: transparent;
  color: #777a71;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.15s;
}

.auth-tab:hover {
  color: #20231f;
  background: rgba(255, 255, 255, 0.4);
}

.auth-tab.active {
  color: #1e4a3d;
  background: #ffffff;
  border-bottom-color: #1e4a3d;
}

/* BODY */
.auth-modal-body {
  padding: 22px;
  overflow-y: auto;
  flex: 1;
}

.auth-intro-text {
  font-size: 12px;
  color: #777a71;
  margin: 0 0 16px;
  line-height: 1.45;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #20231f;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: #777a71;
  pointer-events: none;
}

.text-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #deded5;
  background: #ffffff;
  color: #20231f;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s;
}

.text-input:focus {
  border-color: #1e4a3d;
}

.submit-button {
  margin-top: 6px;
  width: 100%;
  padding: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.switch-prompt {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 11px;
  color: #777a71;
}

.link-button {
  background: transparent;
  border: 0;
  color: #1e4a3d;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 12px;
  margin-bottom: 14px;
}

.notice-success {
  background: #eef7e9;
  border: 1px solid #c3e2b2;
  color: #1e5c26;
}

.notice-error {
  background: #fff4f1;
  border: 1px solid #fbd2ca;
  color: #a83d32;
}

/* FOOTER */
.auth-modal-footer {
  padding: 10px 20px;
  background: #f4f3ee;
  border-top: 1px solid #deded5;
}

.footer-badges {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 700;
  color: #777a71;
}

.footer-badges span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* FADE */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
