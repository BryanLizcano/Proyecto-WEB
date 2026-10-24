<script setup>
import { computed, ref, watch } from 'vue'
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  Smartphone,
  X,
} from '@lucide/vue'
import { createOrder } from '../services/orders'
import { getApiError } from '../services/api'
import { formatCurrency } from '../utils/formatCurrency'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  customerName: { type: String, default: '' },
  customerContact: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
})

const emit = defineEmits(['close', 'success'])

const activeMethod = ref('card') // 'card' | 'pse' | 'bancolombia' | 'efecty'
const status = ref('idle') // 'idle' | 'processing' | 'approved' | 'error'
const processingMessage = ref('Iniciando conexión segura...')
const errorMessage = ref('')
const confirmedOrder = ref(null)
const transactionId = ref('')

// Formulario Tarjeta
const cardData = ref({
  number: '',
  name: '',
  expiry: '',
  cvv: '',
  installments: '1',
})

// Formulario PSE
const pseData = ref({
  bank: 'bancolombia',
  personType: 'natural',
  docType: 'CC',
  docNumber: '',
  email: '',
})

// Formulario Botón Bancolombia
const bancolombiaAccountType = ref('ahorros')

// Datos Efecty
const efectyCode = ref('110757')
const efectyPin = ref('')

const banks = [
  { id: 'bancolombia', name: 'Bancolombia' },
  { id: 'nequi', name: 'Nequi' },
  { id: 'davivienda', name: 'Davivienda' },
  { id: 'bogota', name: 'Banco de Bogotá' },
  { id: 'bbva', name: 'BBVA Colombia' },
  { id: 'scotiabank', name: 'Scotiabank Colpatria' },
  { id: 'occidente', name: 'Banco de Occidente' },
  { id: 'lulo', name: 'Lulo Bank' },
]

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      status.value = 'idle'
      errorMessage.value = ''
      confirmedOrder.value = null
      efectyPin.value = String(Math.floor(100000 + Math.random() * 900000))
      transactionId.value = 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase()
      if (props.customerName && !cardData.value.name) {
        cardData.value.name = props.customerName
      }
      if (props.customerContact && props.customerContact.includes('@') && !pseData.value.email) {
        pseData.value.email = props.customerContact
      }
    }
  }
)

function formatCardNumber(val) {
  const clean = val.replace(/\D/g, '').slice(0, 16)
  cardData.value = {
    ...cardData.value,
    number: clean.replace(/(\d{4})/g, '$1 ').trim(),
  }
}

function formatExpiry(val) {
  const clean = val.replace(/\D/g, '').slice(0, 4)
  if (clean.length >= 2) {
    cardData.value.expiry = clean.slice(0, 2) + '/' + clean.slice(2)
  } else {
    cardData.value.expiry = clean
  }
}

const displayCardNumber = computed(() => {
  if (!cardData.value.number) return '•••• •••• •••• ••••'
  const clean = cardData.value.number.replace(/\s/g, '')
  let formatted = ''
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) formatted += ' '
    formatted += clean[i] || '•'
  }
  return formatted
})

const methodLabel = computed(() => {
  switch (activeMethod.value) {
    case 'card':
      return 'Tarjeta de Crédito / Débito'
    case 'pse':
      return 'PSE (Débito en Línea)'
    case 'bancolombia':
      return 'Botón Bancolombia'
    case 'efecty':
      return 'Efectivo (Efecty)'
    default:
      return 'Pago Digital'
  }
})

async function processPayment() {
  status.value = 'processing'
  errorMessage.value = ''
  processingMessage.value = 'Estableciendo canal cifrado 256-bit...'

  try {
    // Simular paso 1: Red de pagos
    await new Promise((resolve) => setTimeout(resolve, 600))
    processingMessage.value = `Validando transacción con ${methodLabel.value}...`

    // Simular paso 2: Aprobación
    await new Promise((resolve) => setTimeout(resolve, 700))
    processingMessage.value = 'Confirmando pedido y reservando inventario...'

    // Llamada real al backend para confirmar pedido y descontar stock
    const payload = {
      nombre_cliente: props.customerName.trim(),
      contacto_cliente: props.customerContact.trim(),
      items: props.items.map((it) => ({
        id_producto: it.id_producto,
        cantidad: it.cantidad,
      })),
    }

    const order = await createOrder(payload)
    confirmedOrder.value = order
    status.value = 'approved'
    emit('success', {
      order,
      method: methodLabel.value,
      transactionId: transactionId.value,
    })
  } catch (err) {
    status.value = 'error'
    errorMessage.value = getApiError(err)
  }
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="payment-modal-backdrop" @click.self="handleClose">
        <div class="payment-modal-card" role="dialog" aria-modal="true" aria-labelledby="gateway-title">
          <!-- CABECERA DE LA PASARELA -->
          <header class="gateway-header">
            <div class="gateway-brand">
              <span class="brand-chip">R</span>
              <div>
                <h2 id="gateway-title">RITMO PAY<span class="brand-dot">.</span></h2>
                <p class="gateway-tagline">
                  <Lock :size="11" /> Pasarela de pago segura
                </p>
              </div>
            </div>

            <div class="gateway-amount">
              <span class="amount-label">Total a debitar</span>
              <strong class="amount-value">{{ formatCurrency(total) }}</strong>
            </div>

            <button
              v-if="status !== 'processing'"
              class="gateway-close"
              type="button"
              aria-label="Cerrar pasarela de pago"
              @click="handleClose"
            >
              <X :size="20" />
            </button>
          </header>

          <!-- ESTADO: PAGO APROBADO CON RECIBO -->
          <div v-if="status === 'approved' && confirmedOrder" class="gateway-approved-view">
            <div class="approved-badge-ring">
              <CheckCircle2 :size="52" />
            </div>

            <h3>¡Pago Aprobado con Éxito!</h3>
            <p class="approved-subtitle">
              Tu transacción ha sido procesada y el inventario ha sido reservado.
            </p>

            <div class="receipt-card">
              <div class="receipt-row">
                <span>Número de Orden</span>
                <strong class="order-highlight">#{{ confirmedOrder.id_pedido }}</strong>
              </div>
              <div class="receipt-row">
                <span>Referencia de Pago</span>
                <code class="receipt-code">{{ transactionId }}</code>
              </div>
              <div class="receipt-row">
                <span>Método de Pago</span>
                <span>{{ methodLabel }}</span>
              </div>
              <div class="receipt-row">
                <span>Comprador</span>
                <span>{{ confirmedOrder.nombre_cliente }}</span>
              </div>
              <div class="receipt-row">
                <span>Contacto</span>
                <span>{{ confirmedOrder.contacto_cliente }}</span>
              </div>
              <div class="receipt-divider"></div>
              <div class="receipt-row receipt-total">
                <span>Monto Pagado</span>
                <strong>{{ formatCurrency(confirmedOrder.total) }}</strong>
              </div>
            </div>

            <div class="approved-actions">
              <button class="button button-accent button-wide" type="button" @click="handleClose">
                Listo, volver a la tienda
                <ArrowUpRight :size="16" />
              </button>
            </div>
          </div>

          <!-- ESTADO: PROCESANDO PAGO CON ANIMACIÓN -->
          <div v-else-if="status === 'processing'" class="gateway-processing-view">
            <div class="processing-spinner-box">
              <div class="pulse-circle"></div>
              <div class="spinner-ring"></div>
              <ShieldCheck :size="38" class="shield-pulse" />
            </div>
            <h3>Procesando transacción</h3>
            <p class="processing-text">{{ processingMessage }}</p>
            <div class="processing-safety-note">
              <Lock :size="13" /> Cifrado de extremo a extremo de 256 bits. No cierres esta ventana.
            </div>
          </div>

          <!-- ESTADO: ERROR EN TRANSACCIÓN -->
          <div v-else-if="status === 'error'" class="gateway-error-view">
            <div class="error-badge-ring">
              <AlertCircle :size="48" />
            </div>
            <h3>No pudimos procesar tu pago</h3>
            <p class="error-details">{{ errorMessage }}</p>
            <div class="error-actions">
              <button class="button button-dark" type="button" @click="status = 'idle'">
                <ArrowLeft :size="14" /> Reintentar método de pago
              </button>
              <button class="button button-outline" type="button" @click="handleClose">
                Volver a la bolsa
              </button>
            </div>
          </div>

          <!-- ESTADO: FORMULARIO DE SELECCIÓN DE MÉTODO (IDLE) -->
          <div v-else class="gateway-body">
            <!-- NAVEGACIÓN ENTRE MÉTODOS -->
            <nav class="payment-tabs" role="tablist" aria-label="Métodos de pago disponibles">
              <button
                class="payment-tab"
                :class="{ active: activeMethod === 'card' }"
                type="button"
                role="tab"
                :aria-selected="activeMethod === 'card'"
                @click="activeMethod = 'card'"
              >
                <CreditCard :size="18" />
                <span>Tarjeta</span>
              </button>

              <button
                class="payment-tab"
                :class="{ active: activeMethod === 'pse' }"
                type="button"
                role="tab"
                :aria-selected="activeMethod === 'pse'"
                @click="activeMethod = 'pse'"
              >
                <Building2 :size="18" />
                <span>PSE</span>
              </button>

              <button
                class="payment-tab"
                :class="{ active: activeMethod === 'bancolombia' }"
                type="button"
                role="tab"
                :aria-selected="activeMethod === 'bancolombia'"
                @click="activeMethod = 'bancolombia'"
              >
                <Smartphone :size="18" />
                <span>Bancolombia</span>
              </button>

              <button
                class="payment-tab"
                :class="{ active: activeMethod === 'efecty' }"
                type="button"
                role="tab"
                :aria-selected="activeMethod === 'efecty'"
                @click="activeMethod = 'efecty'"
              >
                <Banknote :size="18" />
                <span>Efecty</span>
              </button>
            </nav>

            <!-- CONTENEDOR DE FORMAS DE PAGO CON ANIMACIÓN -->
            <div class="tab-content-area">
              <!-- MÉTODO 1: TARJETA CRÉDITO/DÉBITO -->
              <Transition name="slide-fade" mode="out-in">
                <div v-if="activeMethod === 'card'" key="card" class="payment-subpanel">
                  <!-- TARJETA VIRTUAL PREVIEW -->
                  <div class="virtual-card">
                    <div class="card-top">
                      <div class="card-chip"></div>
                      <span class="card-network">RITMO / VISA</span>
                    </div>
                    <div class="card-number-preview">
                      {{ displayCardNumber }}
                    </div>
                    <div class="card-bottom">
                      <div>
                        <small>TITULAR</small>
                        <span>{{ cardData.name || customerName || 'TU NOMBRE' }}</span>
                      </div>
                      <div>
                        <small>VENCE</small>
                        <span>{{ cardData.expiry || 'MM/AA' }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- CAMPOS DE LA TARJETA -->
                  <form class="payment-form" @submit.prevent="processPayment">
                    <label class="field-label">
                      Número de tarjeta
                      <input
                        :value="cardData.number"
                        class="text-input"
                        type="text"
                        placeholder="4532 •••• •••• 8910"
                        maxlength="19"
                        required
                        @input="formatCardNumber($event.target.value)"
                      />
                    </label>

                    <label class="field-label">
                      Nombre en la tarjeta
                      <input
                        v-model.trim="cardData.name"
                        class="text-input"
                        type="text"
                        placeholder="Como figura en el plástico"
                        required
                      />
                    </label>

                    <div class="form-row-2">
                      <label class="field-label">
                        Vencimiento
                        <input
                          :value="cardData.expiry"
                          class="text-input"
                          type="text"
                          placeholder="MM/AA"
                          maxlength="5"
                          required
                          @input="formatExpiry($event.target.value)"
                        />
                      </label>

                      <label class="field-label">
                        CVV / CVC
                        <input
                          v-model.trim="cardData.cvv"
                          class="text-input"
                          type="password"
                          placeholder="•••"
                          maxlength="4"
                          required
                        />
                      </label>
                    </div>

                    <label class="field-label">
                      Cuotas
                      <select v-model="cardData.installments" class="text-input">
                        <option value="1">1 cuota (Sin interés)</option>
                        <option value="3">3 cuotas</option>
                        <option value="6">6 cuotas</option>
                        <option value="12">12 cuotas</option>
                        <option value="24">24 cuotas</option>
                      </select>
                    </label>

                    <button class="button button-dark submit-payment-button" type="submit">
                      Pagar {{ formatCurrency(total) }}
                      <ArrowUpRight :size="16" />
                    </button>
                  </form>
                </div>

                <!-- MÉTODO 2: PSE -->
                <div v-else-if="activeMethod === 'pse'" key="pse" class="payment-subpanel">
                  <div class="pse-intro-banner">
                    <Building2 :size="24" class="pse-icon" />
                    <div>
                      <strong>Débito directo desde tu cuenta bancaria</strong>
                      <p>Transfiere de forma inmediata y sin cargos adicionales.</p>
                    </div>
                  </div>

                  <form class="payment-form" @submit.prevent="processPayment">
                    <label class="field-label">
                      Selecciona tu banco
                      <select v-model="pseData.bank" class="text-input" required>
                        <option v-for="b in banks" :key="b.id" :value="b.id">
                          {{ b.name }}
                        </option>
                      </select>
                    </label>

                    <div class="person-type-selector">
                      <label class="radio-label">
                        <input v-model="pseData.personType" type="radio" value="natural" />
                        <span>Persona Natural</span>
                      </label>
                      <label class="radio-label">
                        <input v-model="pseData.personType" type="radio" value="juridica" />
                        <span>Persona Jurídica</span>
                      </label>
                    </div>

                    <div class="form-row-2">
                      <label class="field-label">
                        Tipo de Documento
                        <select v-model="pseData.docType" class="text-input">
                          <option value="CC">C.C. Cédula de Ciudadanía</option>
                          <option value="CE">C.E. Cédula de Extranjería</option>
                          <option value="NIT">NIT Número de Identificación</option>
                          <option value="PP">Pasaporte</option>
                        </select>
                      </label>

                      <label class="field-label">
                        Número de Documento
                        <input
                          v-model.trim="pseData.docNumber"
                          class="text-input"
                          type="text"
                          placeholder="1020304050"
                          required
                        />
                      </label>
                    </div>

                    <label class="field-label">
                      Email registrado en PSE
                      <input
                        v-model.trim="pseData.email"
                        class="text-input"
                        type="email"
                        placeholder="tu-correo@banco.com"
                        required
                      />
                    </label>

                    <button class="button button-dark submit-payment-button" type="submit">
                      Continuar a PSE ({{ formatCurrency(total) }})
                      <ArrowUpRight :size="16" />
                    </button>
                  </form>
                </div>

                <!-- MÉTODO 3: BOTÓN BANCOLOMBIA -->
                <div v-else-if="activeMethod === 'bancolombia'" key="bancolombia" class="payment-subpanel">
                  <div class="bancolombia-badge-box">
                    <Smartphone :size="28" />
                    <div>
                      <strong>Transferencia express con App Bancolombia</strong>
                      <p>Paga directamente aprobando la notificación en tu celular.</p>
                    </div>
                  </div>

                  <form class="payment-form" @submit.prevent="processPayment">
                    <label class="field-label">
                      Tipo de cuenta de débito
                      <select v-model="bancolombiaAccountType" class="text-input">
                        <option value="ahorros">Cuenta de Ahorros Bancolombia</option>
                        <option value="corriente">Cuenta Corriente Bancolombia</option>
                      </select>
                    </label>

                    <div class="bancolombia-instruction-box">
                      <ol>
                        <li>Al hacer clic en pagar, te enviaremos una notificación push a tu App Bancolombia.</li>
                        <li>Ingresa a tu aplicación y confirma la clave dinámica.</li>
                        <li>El débito por <strong>{{ formatCurrency(total) }}</strong> se aplicará al instante.</li>
                      </ol>
                    </div>

                    <button class="button button-dark submit-payment-button" type="submit">
                      Pagar con Botón Bancolombia
                      <ArrowUpRight :size="16" />
                    </button>
                  </form>
                </div>

                <!-- MÉTODO 4: EFECTY -->
                <div v-else-if="activeMethod === 'efecty'" key="efecty" class="payment-subpanel">
                  <div class="efecty-banner">
                    <Banknote :size="28" />
                    <div>
                      <strong>Pago en efectivo en puntos Efecty</strong>
                      <p>Genera tu comprobante digital y acércate a cualquier punto Efecty del país.</p>
                    </div>
                  </div>

                  <div class="efecty-info-card">
                    <div class="efecty-row">
                      <span>Convenio Empresarial</span>
                      <strong>#{{ efectyCode }} (RITMO STORE)</strong>
                    </div>
                    <div class="efecty-row">
                      <span>Número de Referencia</span>
                      <strong class="efecty-pin">{{ efectyPin }}</strong>
                    </div>
                    <div class="efecty-row">
                      <span>Total a pagar</span>
                      <strong class="efecty-amount">{{ formatCurrency(total) }}</strong>
                    </div>
                    <div class="efecty-row">
                      <span>Vencimiento</span>
                      <small>Tienes 24 horas para realizar el pago</small>
                    </div>
                  </div>

                  <form class="payment-form" @submit.prevent="processPayment">
                    <p class="efecty-disclaimer">
                      Al confirmar, tu pedido quedará reservado temporalmente mientras realizas el pago en la sucursal Efecty.
                    </p>

                    <button class="button button-dark submit-payment-button" type="submit">
                      Generar PIN y confirmar pedido
                      <ArrowUpRight :size="16" />
                    </button>
                  </form>
                </div>
              </Transition>
            </div>
          </div>

          <!-- PIE DE SEGURIDAD -->
          <footer class="gateway-footer">
            <div class="security-badges">
              <span><ShieldCheck :size="14" /> Pagos seguros</span>
              <span><Lock :size="14" /> Encriptación SSL</span>
              <span>RITMO PAY v2.0</span>
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.payment-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 26, 23, 0.65);
  backdrop-filter: blur(4px);
  padding: 16px;
}

.payment-modal-card {
  width: min(580px, 100%);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #deded5;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: card-appear 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes card-appear {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* HEADER */
.gateway-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background: #1e4a3d;
  color: #fffefa;
}

.gateway-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-chip {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  background: #d5f064;
  color: #14372e;
  font-weight: 900;
  font-size: 18px;
}

.gateway-brand h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #fffefa;
}

.brand-dot {
  color: #d5f064;
}

.gateway-tagline {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: rgba(255, 255, 250, 0.7);
}

.gateway-amount {
  text-align: right;
}

.amount-label {
  display: block;
  font-size: 10px;
  color: rgba(255, 255, 250, 0.7);
  text-transform: uppercase;
}

.amount-value {
  font-size: 17px;
  font-weight: 800;
  color: #d5f064;
}

.gateway-close {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 0;
  color: rgba(255, 255, 250, 0.8);
  cursor: pointer;
  transition: color 0.15s;
}

.gateway-close:hover {
  color: #ffffff;
}

/* TABS */
.payment-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: #f4f3ee;
  border-bottom: 1px solid #deded5;
}

.payment-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 6px;
  border: 0;
  background: transparent;
  color: #777a71;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
}

.payment-tab:hover {
  color: #20231f;
  background: rgba(255, 255, 255, 0.5);
}

.payment-tab.active {
  color: #1e4a3d;
  background: #ffffff;
  border-bottom-color: #1e4a3d;
}

/* BODY */
.gateway-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.tab-content-area {
  padding: 24px;
  flex: 1;
}

/* VIRTUAL CARD PREVIEW */
.virtual-card {
  width: 100%;
  aspect-ratio: 1.8;
  max-height: 180px;
  border-radius: 8px;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(135deg, #1e4a3d 0%, #14372e 100%);
  color: #fffefa;
  box-shadow: 0 10px 25px rgba(20, 55, 46, 0.3);
  margin-bottom: 22px;
  position: relative;
  overflow: hidden;
}

.virtual-card::after {
  content: '';
  position: absolute;
  top: -40%;
  right: -20%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(213, 240, 100, 0.15) 0%, transparent 70%);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-chip {
  width: 34px;
  height: 26px;
  background: linear-gradient(135deg, #f7d070, #d4a024);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.card-network {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #d5f064;
}

.card-number-preview {
  font-family: 'Courier New', Courier, monospace;
  font-size: 18px;
  letter-spacing: 0.15em;
  font-weight: 700;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.card-bottom small {
  display: block;
  font-size: 8px;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 250, 0.6);
}

.card-bottom span {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

/* FORMS */
.payment-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

.submit-payment-button {
  margin-top: 10px;
  width: 100%;
  padding: 14px;
  font-size: 13px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

/* PSE & BANCOS */
.pse-intro-banner,
.bancolombia-badge-box,
.efecty-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: #f4f3ee;
  border: 1px solid #deded5;
  margin-bottom: 18px;
  font-size: 12px;
}

.pse-intro-banner strong,
.bancolombia-badge-box strong,
.efecty-banner strong {
  display: block;
  color: #20231f;
}

.pse-intro-banner p,
.bancolombia-badge-box p,
.efecty-banner p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #777a71;
}

.person-type-selector {
  display: flex;
  gap: 18px;
  margin-bottom: 4px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
}

.bancolombia-instruction-box {
  padding: 14px;
  background: #f4f3ee;
  border-left: 3px solid #1e4a3d;
  font-size: 11px;
  color: #777a71;
}

.bancolombia-instruction-box ol {
  margin: 0;
  padding-left: 18px;
  line-height: 1.6;
}

/* EFECTY */
.efecty-info-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: #fff8e6;
  border: 1px dashed #f2d07e;
  margin-bottom: 16px;
  font-size: 12px;
}

.efecty-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.efecty-pin {
  font-size: 16px;
  letter-spacing: 0.1em;
  color: #1e4a3d;
}

.efecty-amount {
  font-size: 15px;
  color: #20231f;
}

.efecty-disclaimer {
  font-size: 11px;
  color: #777a71;
  margin: 0;
  line-height: 1.4;
}

/* PROCESSING STATE */
.gateway-processing-view {
  padding: 50px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.processing-spinner-box {
  position: relative;
  width: 90px;
  height: 90px;
  display: grid;
  place-items: center;
  margin-bottom: 24px;
}

.spinner-ring {
  position: absolute;
  inset: 0;
  border: 3px solid rgba(30, 74, 61, 0.15);
  border-top-color: #1e4a3d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.pulse-circle {
  position: absolute;
  inset: 8px;
  background: #d5f064;
  border-radius: 50%;
  opacity: 0.3;
  animation: pulse 1.8s ease-in-out infinite;
}

.shield-pulse {
  color: #1e4a3d;
  z-index: 2;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(0.9);
    opacity: 0.2;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.45;
  }
}

.gateway-processing-view h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: #20231f;
}

.processing-text {
  font-size: 13px;
  color: #777a71;
  margin-bottom: 24px;
  min-height: 20px;
}

.processing-safety-note {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #777a71;
}

/* APPROVED / RECEIPT VIEW */
.gateway-approved-view {
  padding: 30px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow-y: auto;
}

.approved-badge-ring {
  color: #1e4a3d;
  margin-bottom: 16px;
  animation: bounce-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes bounce-in {
  from {
    transform: scale(0.4);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.gateway-approved-view h3 {
  margin: 0 0 6px;
  font-size: 24px;
  color: #20231f;
}

.approved-subtitle {
  font-size: 12px;
  color: #777a71;
  margin: 0 0 20px;
}

.receipt-card {
  width: 100%;
  background: #f4f3ee;
  border: 1px solid #deded5;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 12px;
  text-align: left;
  margin-bottom: 22px;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-highlight {
  font-size: 14px;
  color: #1e4a3d;
}

.receipt-code {
  background: #ffffff;
  padding: 2px 6px;
  border: 1px solid #deded5;
  font-size: 11px;
  font-family: monospace;
}

.receipt-divider {
  height: 1px;
  background: #deded5;
  margin: 4px 0;
}

.receipt-total {
  font-size: 14px;
}

.receipt-total strong {
  font-size: 16px;
  color: #1e4a3d;
}

.approved-actions {
  width: 100%;
}

.button-wide {
  width: 100%;
  justify-content: center;
}

/* ERROR VIEW */
.gateway-error-view {
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.error-badge-ring {
  color: #a83d32;
  margin-bottom: 16px;
}

.gateway-error-view h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: #20231f;
}

.error-details {
  font-size: 12px;
  color: #a83d32;
  margin-bottom: 24px;
  padding: 10px 14px;
  background: #fff4f1;
  border: 1px solid #fbd2ca;
  max-width: 400px;
}

.error-actions {
  display: flex;
  gap: 12px;
}

/* FOOTER */
.gateway-footer {
  padding: 12px 24px;
  background: #f4f3ee;
  border-top: 1px solid #deded5;
}

.security-badges {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  color: #777a71;
}

.security-badges span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ANIMACIONES */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
