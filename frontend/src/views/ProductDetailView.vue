<script setup>
import { onMounted, ref, watch } from 'vue'
import { ArrowLeft, Minus, Plus, ShoppingBag } from '@lucide/vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { getApiError } from '../services/api'
import { getProduct } from '../services/catalog'
import { formatCurrency } from '../utils/formatCurrency'
const route = useRoute()
const cart = useCartStore()
const product = ref(null)
const quantity = ref(1)
const loading = ref(true)
const errorMessage = ref('')
async function loadProduct() {
  loading.value = true
  errorMessage.value = ''
  try { product.value = await getProduct(route.params.id); quantity.value = 1 } catch (error) { errorMessage.value = getApiError(error) } finally { loading.value = false }
}
function addToCart() {
  if (!product.value) return
  const result = cart.addItem(product.value, quantity.value)
  if (result.success) cart.isOpen = true
  else window.alert(result.message)
}
watch(() => route.params.id, loadProduct)
onMounted(loadProduct)
</script>

<template>
  <section class="detail-page page-wrap"><RouterLink class="back-link" to="/">← Volver a la tienda</RouterLink><div v-if="loading" class="detail-loading">Cargando producto...</div>
    <div v-else-if="errorMessage" class="notice notice-error" role="alert"><div><strong>No encontramos el producto</strong><p>{{ errorMessage }}</p></div><RouterLink class="button button-outline" to="/">Volver al catálogo</RouterLink></div>
    <article v-else-if="product" class="detail-layout"><div class="detail-image-frame"><img v-if="product.imagen_url" :src="product.imagen_url" :alt="product.nombre" /><div v-else class="image-fallback">R.</div><span class="detail-image-index">RITMO / {{ String(product.id_producto).padStart(3, '0') }}</span></div><div class="detail-copy"><p class="eyebrow">{{ product.categoria_nombre || 'COLECCIÓN RITMO' }}</p><h1>{{ product.nombre }}</h1><p class="detail-price">{{ formatCurrency(product.precio) }}</p><p class="detail-description">{{ product.descripcion || 'Una pieza versátil, pensada para acompañarte en movimiento.' }}</p><div class="detail-stock" :class="{ unavailable: product.stock <= 0 }"><span></span>{{ product.stock > 0 ? `${product.stock} unidades disponibles` : 'Agotado por el momento' }}</div><div class="detail-purchase"><div class="quantity-control quantity-large"><button type="button" aria-label="Restar una unidad" :disabled="quantity <= 1" @click="quantity--"><Minus :size="15" /></button><span>{{ quantity }}</span><button type="button" aria-label="Sumar una unidad" :disabled="quantity >= product.stock" @click="quantity++"><Plus :size="15" /></button></div><button class="button button-accent add-to-cart" type="button" :disabled="product.stock <= 0" @click="addToCart"><ShoppingBag :size="18" /> Añadir a la bolsa</button></div><div class="detail-divider"></div><div class="detail-facts"><span>Disponibilidad</span><strong>{{ product.stock > 0 ? 'En stock' : 'Agotado' }}</strong></div></div></article>
  </section>
</template>
