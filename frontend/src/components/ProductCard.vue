<script setup>
import { ArrowUpRight, Plus } from '@lucide/vue'
import { useCartStore } from '../stores/cart'
import { formatCurrency } from '../utils/formatCurrency'
defineProps({ product: { type: Object, required: true } })
const cart = useCartStore()
function add(product) {
  const result = cart.addItem(product)
  if (result.success) cart.isOpen = true
  else window.alert(result.message)
}
</script>

<template>
  <article class="product-card">
    <RouterLink class="product-image-link" :to="`/productos/${product.id_producto}`"><div class="product-image-wrap"><img v-if="product.imagen_url" class="product-image" :src="product.imagen_url" :alt="product.nombre" loading="lazy" /><div v-else class="image-fallback">R.</div><span class="image-arrow"><ArrowUpRight :size="17" /></span><span v-if="product.stock < 5 && product.stock > 0" class="stock-flag">Quedan {{ product.stock }}</span><span v-if="product.stock <= 0" class="stock-flag sold-out">Agotado</span></div></RouterLink>
    <div class="product-card-info"><div class="product-title-row"><div><p class="product-category">{{ product.categoria_nombre || 'Colección' }}</p><RouterLink class="product-name" :to="`/productos/${product.id_producto}`">{{ product.nombre }}</RouterLink></div><span class="product-price">{{ formatCurrency(product.precio) }}</span></div><div class="product-card-bottom"><span class="product-stock">{{ product.stock > 0 ? `${product.stock} disponibles` : 'Sin existencias' }}</span><button class="quick-add" type="button" :disabled="product.stock <= 0" :aria-label="`Agregar ${product.nombre} al carrito`" @click="add(product)"><Plus :size="17" /></button></div></div>
  </article>
</template>
