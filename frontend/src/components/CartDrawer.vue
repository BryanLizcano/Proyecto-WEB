<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { ArrowLeft, ArrowUpRight, CheckCircle2, Lock, Minus, Plus, ShoppingBag, Trash2, User, X } from '@lucide/vue'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import { formatCurrency } from '../utils/formatCurrency'
import PaymentModal from './PaymentModal.vue'
import AuthModal from './AuthModal.vue'

const cart = useCartStore()
const auth = useAuthStore()

const mode = ref('cart') // 'cart' | 'checkout' | 'success'
const customerName = ref('')
const customerContact = ref('')
const showPaymentGateway = ref(false)
const showAuthModal = ref(false)
const errorMessage = ref('')
const confirmedOrder = ref(null)

function resetCheckout() {
  mode.value = 'cart'
  customerName.value = ''
  customerContact.value = ''
  errorMessage.value = ''
  confirmedOrder.value = null
  showPaymentGateway.value = false
  showAuthModal.value = false
}

function closeDrawer() {
  cart.isOpen = false
  showPaymentGateway.value = false
  showAuthModal.value = false
  if (mode.value === 'success') {
    resetCheckout()
  }
}

function onKeydown(event) {
  if (event.key === 'Escape') closeDrawer()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

watch(() => cart.isOpen, (open) => {
  if (!open) {
    showPaymentGateway.value = false
    showAuthModal.value = false
    if (mode.value === 'success') {
      resetCheckout()
    }
  }
})

function startCheckout() {
  if (auth.authenticated && auth.user) {
    if (!customerName.value && auth.user.nombre) {
      customerName.value = auth.user.nombre
    }
    if (!customerContact.value) {
      customerContact.value = auth.user.email || auth.user.telefono || ''
    }
  }
  mode.value = 'checkout'
}

function handleAuthSuccess(user) {
  if (user) {
    if (!customerName.value && user.nombre) customerName.value = user.nombre
    if (!customerContact.value) customerContact.value = user.email || user.telefono || ''
  }
}

function submitCheckout() {
  if (!auth.authenticated) {
    showAuthModal.value = true
    return
  }

  if (!customerName.value.trim() || !customerContact.value.trim()) {
    errorMessage.value = 'Por favor completa todos los campos requeridos.'
    return
  }

  errorMessage.value = ''
  showPaymentGateway.value = true
}

function handlePaymentSuccess(data) {
  confirmedOrder.value = data.order
  cart.clearCart()
  mode.value = 'success'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="cart.isOpen" class="drawer-layer" @click.self="closeDrawer">
        <aside class="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
          <!-- CABECERA DEL DRAWER -->
          <div class="drawer-heading">
            <div>
              <p class="eyebrow">
                {{ mode === 'checkout' ? 'CHECKOUT DIRECTO' : mode === 'success' ? 'CONFIRMACIÓN' : 'TU SELECCIÓN' }}
              </p>
              <h2 id="cart-title">
                {{ mode === 'checkout' ? 'Completar pedido' : mode === 'success' ? '¡Orden recibida!' : 'La bolsa' }}<span class="brand-period">.</span>
              </h2>
            </div>
            <button class="icon-button" type="button" aria-label="Cerrar carrito" @click="closeDrawer">
              <X />
            </button>
          </div>

          <!-- ESTADO: BOLSA DE COMPRAS (CART) -->
          <template v-if="mode === 'cart'">
            <div v-if="cart.items.length" class="cart-lines">
              <article v-for="item in cart.items" :key="item.id_producto" class="cart-line">
                <img v-if="item.imagen_url" :src="item.imagen_url" :alt="item.nombre" />
                <div v-else class="cart-line-placeholder">R.</div>
                <div class="cart-line-info">
                  <span class="product-category">{{ item.categoria_nombre || 'Colección' }}</span>
                  <RouterLink class="cart-line-name" :to="`/productos/${item.id_producto}`" @click="closeDrawer">
                    {{ item.nombre }}
                  </RouterLink>
                  <span class="cart-line-price">{{ formatCurrency(item.precio) }}</span>
                  <div class="quantity-control">
                    <button
                      type="button"
                      :aria-label="`Quitar una unidad de ${item.nombre}`"
                      @click="cart.setQuantity(item.id_producto, item.cantidad - 1)"
                    >
                      <Minus :size="13" />
                    </button>
                    <span>{{ item.cantidad }}</span>
                    <button
                      type="button"
                      :disabled="item.cantidad >= item.stock"
                      :aria-label="`Añadir una unidad de ${item.nombre}`"
                      @click="cart.setQuantity(item.id_producto, item.cantidad + 1)"
                    >
                      <Plus :size="13" />
                    </button>
                  </div>
                </div>
                <button
                  class="remove-line"
                  type="button"
                  :aria-label="`Eliminar ${item.nombre}`"
                  @click="cart.removeItem(item.id_producto)"
                >
                  <Trash2 :size="16" />
                </button>
              </article>
            </div>

            <div v-else class="cart-empty">
              <span class="empty-bag"><ShoppingBag :size="25" /></span>
              <h3>Tu bolsa está vacía</h3>
              <p>Encuentra tu próximo favorito en la tienda.</p>
              <RouterLink class="button button-dark" to="/" @click="closeDrawer">
                Explorar productos
              </RouterLink>
            </div>

            <div v-if="cart.items.length" class="drawer-footer">
              <div class="subtotal-row">
                <span>Subtotal</span>
                <strong>{{ formatCurrency(cart.total) }}</strong>
              </div>
              <p class="checkout-note">
                Precios e inventario verificados en tiempo real al confirmar tu compra.
              </p>
              <button
                class="button button-dark checkout-button"
                type="button"
                @click="startCheckout"
              >
                Finalizar compra
                <ArrowUpRight :size="17" />
              </button>
              <button class="text-button clear-cart" type="button" @click="cart.clearCart()">
                Vaciar bolsa
              </button>
            </div>
          </template>

          <!-- ESTADO: FORMULARIO DE CHECKOUT -->
          <template v-else-if="mode === 'checkout'">
            <div class="checkout-content">
              <div class="checkout-back-bar">
                <button class="text-button" type="button" @click="mode = 'cart'">
                  <ArrowLeft :size="14" /> Volver a la bolsa
                </button>
                <span class="checkout-items-count">{{ cart.totalCount }} productos</span>
              </div>

              <div v-if="errorMessage" class="notice notice-error" role="alert">
                <span>{{ errorMessage }}</span>
              </div>

              <!-- BLOQUEO SI NO ESTÁ AUTENTICADO: CREAR CUENTA O INICIAR SESIÓN -->
              <div v-if="!auth.authenticated" class="auth-gate-card">
                <div class="auth-gate-icon">
                  <Lock :size="32" />
                </div>
                <h3>Inicia sesión o crea tu cuenta</h3>
                <p>
                  Para procesar tu compra de forma segura y reservar tu inventario, debes identificarte con tu cuenta o registrarte en la tienda.
                </p>
                <button
                  class="button button-dark auth-gate-btn"
                  type="button"
                  @click="showAuthModal = true"
                >
                  Identificarme para continuar
                  <ArrowUpRight :size="16" />
                </button>
              </div>

              <!-- FORMULARIO DE CHECKOUT (DESBLOQUEADO AL TENER SESIÓN) -->
              <form v-else class="checkout-form" @submit.prevent="submitCheckout">
                <div class="checkout-user-badge">
                  <User :size="14" />
                  <span>Comprando como <strong>{{ auth.user?.nombre }}</strong> ({{ auth.user?.email }})</span>
                </div>

                <div class="checkout-summary-box">
                  <div class="checkout-summary-row">
                    <span>Total a pagar</span>
                    <strong>{{ formatCurrency(cart.total) }}</strong>
                  </div>
                </div>

                <label class="field-label">
                  Nombre completo
                  <input
                    v-model.trim="customerName"
                    class="text-input"
                    type="text"
                    maxlength="100"
                    placeholder="Ej. Carlos Mendoza"
                    required
                  />
                </label>

                <label class="field-label">
                  Dato de contacto (Email o Teléfono)
                  <input
                    v-model.trim="customerContact"
                    class="text-input"
                    type="text"
                    maxlength="100"
                    placeholder="Ej. carlos@example.com / +57 300 1234567"
                    required
                  />
                </label>

                <p class="checkout-disclaimer">
                  Al continuar, pasarás a la pasarela de pagos segura RITMO PAY para elegir tu medio de pago preferido y finalizar tu compra.
                </p>

                <button
                  class="button button-dark checkout-button"
                  type="submit"
                >
                  Continuar al pago seguro
                  <Lock :size="15" />
                </button>
              </form>
            </div>
          </template>

          <!-- ESTADO: CONFIRMACIÓN EXITOSA -->
          <template v-else-if="mode === 'success' && confirmedOrder">
            <div class="order-confirmed">
              <div class="confirmed-icon">
                <CheckCircle2 :size="48" />
              </div>
              <h3>¡Pedido registrado con éxito!</h3>
              <p class="order-badge">
                Pedido <strong>#{{ confirmedOrder.id_pedido }}</strong>
              </p>
              <div class="confirmed-card">
                <div class="confirmed-row">
                  <span>Cliente</span>
                  <strong>{{ confirmedOrder.nombre_cliente }}</strong>
                </div>
                <div class="confirmed-row">
                  <span>Contacto</span>
                  <span>{{ confirmedOrder.contacto_cliente }}</span>
                </div>
                <div class="confirmed-row">
                  <span>Total</span>
                  <strong>{{ formatCurrency(confirmedOrder.total) }}</strong>
                </div>
                <div class="confirmed-row">
                  <span>Estado</span>
                  <span class="status-tag status-pendiente">{{ confirmedOrder.estado }}</span>
                </div>
              </div>
              <p class="confirmed-note">
                Hemos recibido tu solicitud. Nuestro equipo comercial se comunicará contigo para despachar tus productos.
              </p>
              <button class="button button-dark" type="button" @click="closeDrawer">
                Seguir explorando
              </button>
            </div>
          </template>
        </aside>
      </div>
    </Transition>
  </Teleport>

  <PaymentModal
    :is-open="showPaymentGateway"
    :customer-name="customerName"
    :customer-contact="customerContact"
    :items="cart.items"
    :total="cart.total"
    @close="showPaymentGateway = false"
    @success="handlePaymentSuccess"
  />

  <AuthModal
    :is-open="showAuthModal"
    context-message="Inicia sesión o regístrate para confirmar tu pedido."
    @close="showAuthModal = false"
    @success="handleAuthSuccess"
  />
</template>

<style scoped>
.checkout-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-top: 14px;
}

.checkout-back-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #deded5;
}

.checkout-items-count {
  font-size: 11px;
  color: #777a71;
  font-weight: 700;
}

.checkout-summary-box {
  background: #f4f3ee;
  border: 1px solid #deded5;
  padding: 12px 14px;
  margin-bottom: 14px;
}

.checkout-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.checkout-summary-row strong {
  font-size: 16px;
  color: #1e4a3d;
}

.checkout-user-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f4f3ee;
  border: 1px solid #deded5;
  font-size: 11px;
  color: #1e4a3d;
  margin-bottom: 10px;
}

.auth-gate-card {
  padding: 32px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: #f4f3ee;
  border: 1px solid #deded5;
  margin-top: 14px;
}

.auth-gate-icon {
  color: #1e4a3d;
  margin-bottom: 2px;
}

.auth-gate-card h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #20231f;
}

.auth-gate-card p {
  margin: 0;
  font-size: 12px;
  color: #777a71;
  max-width: 280px;
  line-height: 1.45;
}

.auth-gate-btn {
  margin-top: 8px;
  width: 100%;
  justify-content: center;
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkout-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #20231f;
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

.text-input:focus {
  border-color: #1e4a3d;
}

.checkout-disclaimer {
  font-size: 11px;
  color: #777a71;
  line-height: 1.45;
  margin: 4px 0 8px;
}

.checkout-button {
  width: 100%;
  justify-content: center;
  padding: 13px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-confirmed {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px 8px;
}

.confirmed-icon {
  color: #1e4a3d;
  margin-bottom: 12px;
}

.order-confirmed h3 {
  margin: 0 0 6px;
  font-size: 20px;
  color: #20231f;
}

.order-badge {
  font-size: 12px;
  color: #777a71;
  margin: 0 0 18px;
}

.order-badge strong {
  color: #1e4a3d;
  font-size: 14px;
}

.confirmed-card {
  width: 100%;
  background: #f4f3ee;
  border: 1px solid #deded5;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  text-align: left;
  margin-bottom: 16px;
}

.confirmed-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-tag {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: 2px;
}

.status-pendiente {
  background: #fff8e6;
  color: #8c6b12;
  border: 1px solid #f2d07e;
}

.confirmed-note {
  font-size: 11px;
  color: #777a71;
  line-height: 1.45;
  margin: 0 0 20px;
}
</style>
