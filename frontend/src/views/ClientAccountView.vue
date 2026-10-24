<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock,
  Eye,
  KeyRound,
  Lock,
  Mail,
  Package,
  PackageCheck,
  Phone,
  RefreshCw,
  ShoppingBag,
  Truck,
  User,
  X,
} from '@lucide/vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getApiError } from '../services/api'
import {
  getClientOrderDetail,
  getClientOrders,
  getClientProfile,
  updateClientProfile,
} from '../services/clientes'
import { formatCurrency } from '../utils/formatCurrency'

const auth = useAuthStore()
const router = useRouter()

const activeTab = ref('orders') // 'orders' | 'profile'
const orders = ref([])
const loadingOrders = ref(false)
const selectedOrder = ref(null)
const loadingOrderDetail = ref(false)

const notice = ref('')
const errorMessage = ref('')
const savingProfile = ref(false)

// Formulario de edición de perfil
const profileForm = ref({
  nombre: '',
  email: '',
  telefono: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const orderStatusSteps = [
  { key: 'PENDIENTE', label: 'Pendiente', desc: 'Recibido', icon: Clock },
  { key: 'CONFIRMADO', label: 'Confirmado', desc: 'Aprobado', icon: CheckCircle2 },
  { key: 'EN_PREPARACION', label: 'En bodega', desc: 'Alistando', icon: Package },
  { key: 'COMPLETADO', label: 'Entregado', desc: 'Completado', icon: PackageCheck },
]

function getStepIndex(estado) {
  if (estado === 'CANCELADO') return -1
  return orderStatusSteps.findIndex((s) => s.key === estado)
}

function getStatusClass(estado) {
  switch (estado) {
    case 'PENDIENTE':
      return 'status-pendiente'
    case 'CONFIRMADO':
      return 'status-confirmado'
    case 'EN_PREPARACION':
      return 'status-preparacion'
    case 'COMPLETADO':
      return 'status-completado'
    case 'CANCELADO':
      return 'status-cancelado'
    default:
      return ''
  }
}

async function loadProfile() {
  try {
    const data = await getClientProfile()
    profileForm.value.nombre = data.nombre || ''
    profileForm.value.email = data.email || ''
    profileForm.value.telefono = data.telefono || ''
    profileForm.value.currentPassword = ''
    profileForm.value.newPassword = ''
    profileForm.value.confirmPassword = ''
  } catch (error) {
    errorMessage.value = getApiError(error)
  }
}

async function loadOrders() {
  loadingOrders.value = true
  errorMessage.value = ''
  try {
    orders.value = await getClientOrders()
  } catch (error) {
    errorMessage.value = getApiError(error)
  } finally {
    loadingOrders.value = false
  }
}

async function openOrderDetail(order) {
  loadingOrderDetail.value = true
  errorMessage.value = ''
  try {
    selectedOrder.value = await getClientOrderDetail(order.id_pedido)
  } catch (error) {
    errorMessage.value = getApiError(error)
  } finally {
    loadingOrderDetail.value = false
  }
}

function closeOrderDetail() {
  selectedOrder.value = null
}

async function handleProfileSubmit() {
  errorMessage.value = ''
  notice.value = ''

  if (profileForm.value.newPassword) {
    if (profileForm.value.newPassword !== profileForm.value.confirmPassword) {
      errorMessage.value = 'La nueva contraseña y su confirmación no coinciden.'
      return
    }
    if (!profileForm.value.currentPassword) {
      errorMessage.value = 'Debes ingresar tu contraseña actual para cambiarla.'
      return
    }
  }

  savingProfile.value = true
  try {
    const payload = {
      nombre: profileForm.value.nombre.trim(),
      email: profileForm.value.email.trim(),
      telefono: profileForm.value.telefono.trim() || null,
    }

    if (profileForm.value.newPassword) {
      payload.currentPassword = profileForm.value.currentPassword
      payload.newPassword = profileForm.value.newPassword
    }

    const updated = await updateClientProfile(payload)
    notice.value = '¡Tus datos han sido actualizados exitosamente!'

    // Sincronizar en el store reactivo
    if (auth.user) {
      auth.user.nombre = updated.nombre
      auth.user.email = updated.email
      auth.user.telefono = updated.telefono
    }

    profileForm.value.currentPassword = ''
    profileForm.value.newPassword = ''
    profileForm.value.confirmPassword = ''
  } catch (error) {
    errorMessage.value = getApiError(error)
  } finally {
    savingProfile.value = false
  }
}

function formatDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  await Promise.all([loadProfile(), loadOrders()])
})
</script>

<template>
  <div class="client-portal-page page-wrap">
    <!-- ENCABEZADO DEL MÓDULO -->
    <header class="portal-header">
      <div>
        <p class="eyebrow">RITMO / MI CUENTA</p>
        <h1>Panel del Cliente<span class="brand-period">.</span></h1>
        <p class="portal-subtitle">
          Consulta el estado de tus compras en tiempo real y gestiona tus datos de contacto.
        </p>
      </div>

      <div class="portal-user-summary">
        <div class="user-avatar">
          <User :size="24" />
        </div>
        <div>
          <strong>{{ auth.user?.nombre || 'Cliente RITMO' }}</strong>
          <span>{{ auth.user?.email }}</span>
        </div>
      </div>
    </header>

    <!-- NAVEGACIÓN ENTRE SECCIONES -->
    <nav class="portal-tabs" role="tablist">
      <button
        class="portal-tab"
        :class="{ active: activeTab === 'orders' }"
        type="button"
        role="tab"
        :aria-selected="activeTab === 'orders'"
        @click="activeTab = 'orders'"
      >
        <ShoppingBag :size="16" />
        <span>Mis Pedidos y Estados</span>
        <span v-if="orders.length" class="orders-count-badge">{{ orders.length }}</span>
      </button>

      <button
        class="portal-tab"
        :class="{ active: activeTab === 'profile' }"
        type="button"
        role="tab"
        :aria-selected="activeTab === 'profile'"
        @click="activeTab = 'profile'"
      >
        <User :size="16" />
        <span>Actualizar Mis Datos</span>
      </button>
    </nav>

    <!-- AVISOS GENERALES -->
    <div v-if="notice" class="notice notice-success portal-alert" role="alert">
      <CheckCircle2 :size="18" />
      <span>{{ notice }}</span>
    </div>

    <div v-if="errorMessage" class="notice notice-error portal-alert" role="alert">
      <AlertCircle :size="18" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- SECCIÓN 1: MIS PEDIDOS Y ESTADOS -->
    <section v-if="activeTab === 'orders'" class="portal-section">
      <div class="section-actions-bar">
        <h3>Historial de compras y seguimiento</h3>
        <button
          class="button button-outline refresh-btn"
          type="button"
          :disabled="loadingOrders"
          @click="loadOrders"
        >
          <RefreshCw :size="14" :class="{ spinning: loadingOrders }" />
          <span>Actualizar estado</span>
        </button>
      </div>

      <!-- LISTA DE PEDIDOS -->
      <div v-if="orders.length" class="orders-grid">
        <article v-for="order in orders" :key="order.id_pedido" class="order-tracker-card">
          <header class="order-card-header">
            <div>
              <span class="order-id">Orden #{{ order.id_pedido }}</span>
              <span class="order-date">{{ formatDate(order.fecha) }}</span>
            </div>
            <div class="order-status-badge" :class="getStatusClass(order.estado)">
              {{ order.estado }}
            </div>
          </header>

          <!-- SEGUIMIENTO VISUAL DE ETAPAS -->
          <div v-if="order.estado !== 'CANCELADO'" class="status-stepper">
            <div
              v-for="(step, idx) in orderStatusSteps"
              :key="step.key"
              class="step-node"
              :class="{
                completed: getStepIndex(order.estado) >= idx,
                current: getStepIndex(order.estado) === idx,
              }"
            >
              <div class="step-circle">
                <component :is="step.icon" :size="13" />
              </div>
              <span class="step-label">{{ step.label }}</span>
            </div>
          </div>
          <div v-else class="order-canceled-banner">
            <AlertCircle :size="15" />
            <span>Este pedido fue cancelado. Comunícate con soporte si requieres ayuda.</span>
          </div>

          <footer class="order-card-footer">
            <div>
              <small class="total-label">Total pagado</small>
              <strong class="total-amount">{{ formatCurrency(order.total) }}</strong>
            </div>

            <button
              class="button button-dark view-detail-btn"
              type="button"
              @click="openOrderDetail(order)"
            >
              <Eye :size="14" />
              Ver detalle
            </button>
          </footer>
        </article>
      </div>

      <!-- VACÍO -->
      <div v-else-if="!loadingOrders" class="orders-empty">
        <ShoppingBag :size="36" />
        <h4>Aún no tienes pedidos registrados</h4>
        <p>Explora el catálogo y realiza tu primer pedido con entrega asegurada.</p>
        <RouterLink to="/" class="button button-dark">
          Ir a la tienda
        </RouterLink>
      </div>
    </section>

    <!-- SECCIÓN 2: ACTUALIZAR DATOS -->
    <section v-else-if="activeTab === 'profile'" class="portal-section profile-section">
      <div class="profile-card">
        <h3>Información personal de tu cuenta</h3>
        <p class="profile-desc">
          Mantén tus datos al día para garantizar que tus entregas se gestionen sin retrasos.
        </p>

        <form class="profile-form" @submit.prevent="handleProfileSubmit">
          <div class="form-grid-2">
            <label class="field-label">
              Nombre completo
              <div class="input-with-icon">
                <User :size="16" class="input-icon" />
                <input
                  v-model.trim="profileForm.nombre"
                  class="text-input"
                  type="text"
                  maxlength="100"
                  required
                />
              </div>
            </label>

            <label class="field-label">
              Correo electrónico
              <div class="input-with-icon">
                <Mail :size="16" class="input-icon" />
                <input
                  v-model.trim="profileForm.email"
                  class="text-input"
                  type="email"
                  maxlength="120"
                  required
                />
              </div>
            </label>
          </div>

          <label class="field-label">
            Teléfono o WhatsApp de contacto
            <div class="input-with-icon">
              <Phone :size="16" class="input-icon" />
              <input
                v-model.trim="profileForm.telefono"
                class="text-input"
                type="tel"
                maxlength="50"
                placeholder="+57 300 1234567"
              />
            </div>
          </label>

          <div class="password-change-box">
            <h4>
              <KeyRound :size="16" /> Cambiar contraseña (opcional)
            </h4>
            <p>Solo llena estos campos si deseas modificar tu clave de acceso actual.</p>

            <div class="form-grid-3">
              <label class="field-label">
                Contraseña actual
                <input
                  v-model="profileForm.currentPassword"
                  class="text-input"
                  type="password"
                  autocomplete="current-password"
                  placeholder="••••••••"
                />
              </label>

              <label class="field-label">
                Nueva contraseña
                <input
                  v-model="profileForm.newPassword"
                  class="text-input"
                  type="password"
                  minlength="6"
                  autocomplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                />
              </label>

              <label class="field-label">
                Confirmar nueva clave
                <input
                  v-model="profileForm.confirmPassword"
                  class="text-input"
                  type="password"
                  minlength="6"
                  autocomplete="new-password"
                  placeholder="Repite tu contraseña"
                />
              </label>
            </div>
          </div>

          <button
            class="button button-dark submit-profile-btn"
            type="submit"
            :disabled="savingProfile"
          >
            {{ savingProfile ? 'Guardando cambios...' : 'Guardar actualización' }}
            <ArrowUpRight :size="16" />
          </button>
        </form>
      </div>
    </section>

    <!-- MODAL DE DETALLE DEL PEDIDO -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="selectedOrder" class="order-detail-backdrop" @click.self="closeOrderDetail">
          <div class="order-detail-card" role="dialog" aria-modal="true">
            <header class="detail-header">
              <div>
                <p class="detail-eyebrow">DETALLE DEL PEDIDO</p>
                <h2>Orden #{{ selectedOrder.id_pedido }}</h2>
                <span class="detail-date">{{ formatDate(selectedOrder.fecha) }}</span>
              </div>
              <button class="close-detail-btn" type="button" @click="closeOrderDetail">
                <X :size="20" />
              </button>
            </header>

            <div class="detail-status-bar">
              <span>Estado actual:</span>
              <strong :class="getStatusClass(selectedOrder.estado)">{{ selectedOrder.estado }}</strong>
            </div>

            <div class="detail-body">
              <div class="detail-client-info">
                <div>
                  <small>Comprador</small>
                  <span>{{ selectedOrder.nombre_cliente }}</span>
                </div>
                <div>
                  <small>Contacto</small>
                  <span>{{ selectedOrder.contacto_cliente }}</span>
                </div>
              </div>

              <!-- ÍTEMS DEL PEDIDO -->
              <div class="detail-lines-heading">Productos incluidos</div>
              <div class="detail-items-list">
                <article
                  v-for="item in selectedOrder.detalles"
                  :key="item.id_detalle"
                  class="detail-line-item"
                >
                  <img
                    v-if="item.imagen_url"
                    :src="item.imagen_url"
                    :alt="item.nombre_producto"
                    class="detail-item-thumb"
                  />
                  <div v-else class="detail-item-thumb placeholder">R.</div>

                  <div class="detail-item-info">
                    <strong>{{ item.nombre_producto }}</strong>
                    <span class="detail-qty-price">
                      {{ item.cantidad }} unidad(es) × {{ formatCurrency(item.precio_unitario) }}
                    </span>
                  </div>

                  <span class="detail-subtotal">{{ formatCurrency(item.subtotal) }}</span>
                </article>
              </div>

              <div class="detail-summary-row">
                <span>Total de la orden</span>
                <strong>{{ formatCurrency(selectedOrder.total) }}</strong>
              </div>
            </div>

            <footer class="detail-footer">
              <button class="button button-outline" type="button" @click="closeOrderDetail">
                Cerrar detalle
              </button>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.client-portal-page {
  padding-top: 40px;
  padding-bottom: 70px;
}

.portal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-bottom: 28px;
  border-bottom: 1px solid #deded5;
  gap: 24px;
}

.portal-header h1 {
  margin: 4px 0 8px;
  font-size: clamp(32px, 5vw, 44px);
  color: #1e4a3d;
}

.portal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #777a71;
}

.portal-user-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px;
  background: #f4f3ee;
  border: 1px solid #deded5;
}

.user-avatar {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  background: #1e4a3d;
  color: #d5f064;
  border-radius: 50%;
}

.portal-user-summary strong {
  display: block;
  font-size: 13px;
  color: #20231f;
}

.portal-user-summary span {
  font-size: 11px;
  color: #777a71;
}

/* TABS */
.portal-tabs {
  display: flex;
  gap: 8px;
  margin: 24px 0;
  border-bottom: 1px solid #deded5;
}

.portal-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  background: transparent;
  border: 0;
  border-bottom: 3px solid transparent;
  font-size: 13px;
  font-weight: 700;
  color: #777a71;
  cursor: pointer;
  transition: all 0.15s;
}

.portal-tab:hover {
  color: #20231f;
}

.portal-tab.active {
  color: #1e4a3d;
  border-bottom-color: #1e4a3d;
}

.orders-count-badge {
  background: #1e4a3d;
  color: #fffefa;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
}

.portal-alert {
  margin-bottom: 20px;
}

/* MIS PEDIDOS */
.section-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-actions-bar h3 {
  margin: 0;
  font-size: 18px;
  color: #20231f;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 8px 14px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.order-tracker-card {
  background: #ffffff;
  border: 1px solid #deded5;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.order-id {
  display: block;
  font-size: 16px;
  font-weight: 800;
  color: #1e4a3d;
}

.order-date {
  font-size: 11px;
  color: #777a71;
}

.order-status-badge {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  border-radius: 2px;
  text-transform: uppercase;
}

.status-pendiente {
  background: #fff8e6;
  color: #8c6b12;
  border: 1px solid #f2d07e;
}

.status-confirmado {
  background: #eef7e9;
  color: #1e5c26;
  border: 1px solid #c3e2b2;
}

.status-preparacion {
  background: #edf5ff;
  color: #1b4d89;
  border: 1px solid #bcd7f5;
}

.status-completado {
  background: #1e4a3d;
  color: #d5f064;
}

.status-cancelado {
  background: #fff4f1;
  color: #a83d32;
  border: 1px solid #fbd2ca;
}

/* STEPPER */
.status-stepper {
  display: flex;
  justify-content: space-between;
  position: relative;
  padding: 10px 0 4px;
}

.status-stepper::before {
  content: '';
  position: absolute;
  top: 22px;
  left: 20px;
  right: 20px;
  height: 2px;
  background: #deded5;
  z-index: 1;
}

.step-node {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.step-circle {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #deded5;
  color: #777a71;
  display: grid;
  place-items: center;
  transition: all 0.2s;
}

.step-label {
  font-size: 9px;
  font-weight: 700;
  color: #777a71;
  text-transform: uppercase;
}

.step-node.completed .step-circle {
  background: #1e4a3d;
  border-color: #1e4a3d;
  color: #d5f064;
}

.step-node.completed .step-label {
  color: #1e4a3d;
}

.step-node.current .step-circle {
  border-color: #d5f064;
  box-shadow: 0 0 0 3px rgba(213, 240, 100, 0.4);
}

.order-canceled-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fff4f1;
  color: #a83d32;
  font-size: 11px;
}

.order-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  border-top: 1px solid #deded5;
}

.total-label {
  display: block;
  font-size: 10px;
  text-transform: uppercase;
  color: #777a71;
}

.total-amount {
  font-size: 16px;
  color: #1e4a3d;
}

.view-detail-btn {
  padding: 8px 14px;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.orders-empty {
  padding: 60px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: #f4f3ee;
  border: 1px solid #deded5;
  color: #777a71;
}

.orders-empty h4 {
  margin: 0;
  font-size: 18px;
  color: #20231f;
}

.orders-empty p {
  margin: 0;
  font-size: 13px;
  max-width: 320px;
}

/* ACTUALIZAR DATOS */
.profile-card {
  background: #ffffff;
  border: 1px solid #deded5;
  padding: 28px;
  max-width: 680px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
}

.profile-card h3 {
  margin: 0 0 6px;
  font-size: 20px;
  color: #1e4a3d;
}

.profile-desc {
  margin: 0 0 24px;
  font-size: 13px;
  color: #777a71;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.password-change-box {
  background: #f4f3ee;
  border: 1px solid #deded5;
  padding: 18px;
  margin-top: 8px;
}

.password-change-box h4 {
  margin: 0 0 4px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #20231f;
}

.password-change-box p {
  margin: 0 0 14px;
  font-size: 11px;
  color: #777a71;
}

.submit-profile-btn {
  align-self: flex-start;
  padding: 12px 24px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

/* MODAL DE DETALLE */
.order-detail-backdrop {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(20, 26, 23, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.order-detail-card {
  width: min(520px, 100%);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #deded5;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background: #1e4a3d;
  color: #fffefa;
}

.detail-eyebrow {
  margin: 0;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #d5f064;
  font-weight: 800;
}

.detail-header h2 {
  margin: 2px 0 4px;
  font-size: 20px;
  color: #fffefa;
}

.detail-date {
  font-size: 11px;
  color: rgba(255, 255, 250, 0.7);
}

.close-detail-btn {
  background: transparent;
  border: 0;
  color: #fffefa;
  cursor: pointer;
  padding: 4px;
}

.detail-status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #f4f3ee;
  border-bottom: 1px solid #deded5;
  font-size: 12px;
}

.detail-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.detail-client-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid #deded5;
  font-size: 12px;
  margin-bottom: 16px;
}

.detail-client-info small {
  display: block;
  font-size: 10px;
  color: #777a71;
  text-transform: uppercase;
}

.detail-lines-heading {
  font-size: 12px;
  font-weight: 800;
  color: #20231f;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.detail-line-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #f4f3ee;
  border: 1px solid #deded5;
}

.detail-item-thumb {
  width: 44px;
  height: 44px;
  object-fit: cover;
}

.detail-item-thumb.placeholder {
  display: grid;
  place-items: center;
  background: #deded5;
  font-weight: 800;
  color: #1e4a3d;
}

.detail-item-info {
  flex: 1;
}

.detail-item-info strong {
  display: block;
  font-size: 12px;
  color: #20231f;
}

.detail-qty-price {
  font-size: 11px;
  color: #777a71;
}

.detail-subtotal {
  font-size: 13px;
  font-weight: 800;
  color: #1e4a3d;
}

.detail-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  border-top: 2px solid #1e4a3d;
  font-size: 14px;
}

.detail-summary-row strong {
  font-size: 18px;
  color: #1e4a3d;
}

.detail-footer {
  padding: 12px 20px;
  background: #f4f3ee;
  border-top: 1px solid #deded5;
  display: flex;
  justify-content: flex-end;
}

/* ENTRADAS */
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
  padding: 10px 12px;
  border: 1px solid #deded5;
  background: #ffffff;
  color: #20231f;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s;
}

.input-with-icon .text-input {
  padding-left: 36px;
}

.text-input:focus {
  border-color: #1e4a3d;
}

@media (max-width: 768px) {
  .portal-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .form-grid-2,
  .form-grid-3 {
    grid-template-columns: 1fr;
  }
}
</style>
