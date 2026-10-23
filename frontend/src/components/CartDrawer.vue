<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { ArrowLeft, ArrowUpRight, CheckCircle2, Minus, Plus, ShoppingBag, Trash2, X } from '@lucide/vue'
import { useCartStore } from '../stores/cart'
import { createOrder } from '../services/orders'
import { getApiError } from '../services/api'
import { formatCurrency } from '../utils/formatCurrency'

const cart = useCartStore()

const mode = ref('cart') // 'cart' | 'checkout' | 'success'
const customerName = ref('')
const customerContact = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const confirmedOrder = ref(null)

function resetCheckout() {
  mode.value = 'cart'
  customerName.value = ''
  customerContact.value = ''
  errorMessage.value = ''
  confirmedOrder.value = null
}

function closeDrawer() {
  cart.isOpen = false
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
  if (!open && mode.value === 'success') {
    resetCheckout()
  }
})

async function submitCheckout() {
  if (!customerName.value.trim() || !customerContact.value.trim()) {
    errorMessage.value = 'Por favor completa todos los campos requeridos.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const payload = {
      nombre_cliente: customerName.value.trim(),
      contacto_cliente: customerContact.value.trim(),
      items: cart.items.map((item) => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
      })),
    }

    const order = await createOrder(payload)
    confirmedOrder.value = order
    cart.clearCart()
    mode.value = 'success'
  } catch (error) {
    errorMessage.value = getApiError(error)
  } finally {
    isSubmitting.value = false
  }
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
                @click="mode = 'checkout'"
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

              <form class="checkout-form" @submit.prevent="submitCheckout">
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
                  Al confirmar tu compra, se reservará el inventario de tus productos y un asesor coordinará tu entrega.
                </p>

                <button
                  class="button button-dark checkout-button"
                  type="submit"
                  :disabled="isSubmitting"
                >
                  {{ isSubmitting ? 'Procesando compra...' : 'Confirmar pedido' }}
                  <ArrowUpRight :size="17" />
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
  margin-bottom: 20px;
}

.checkout-items-count {
  font-size: 11px;
  color: #727774;
}

.checkout-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.checkout-summary-box {
  background: #f7f6f1;
  border: 1px solid #e2e1d7;
  padding: 16px;
  margin-bottom: 8px;
}

.checkout-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.checkout-summary-row strong {
  font-size: 16px;
  color: #181f1b;
}

.checkout-disclaimer {
  font-size: 10px;
  line-height: 1.5;
  color: #727774;
  margin: 0;
}

.order-confirmed {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px 0;
}

.confirmed-icon {
  color: #1a4d2e;
  margin-bottom: 16px;
}

.order-confirmed h3 {
  margin: 0 0 8px;
  font-family: inherit;
  font-size: 24px;
  color: #181f1b;
}

.order-badge {
  font-size: 13px;
  color: #727774;
  margin-bottom: 24px;
}

.order-badge strong {
  color: #1a4d2e;
}

.confirmed-card {
  width: 100%;
  background: #f7f6f1;
  border: 1px solid #e2e1d7;
  padding: 16px;
  margin-bottom: 20px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 12px;
}

.confirmed-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 2px;
}

.status-pendiente {
  background: #fff8e6;
  color: #b78103;
  border: 1px solid #f2d07e;
}

.confirmed-note {
  font-size: 11px;
  color: #727774;
  line-height: 1.5;
  margin-bottom: 24px;
}
</style>
