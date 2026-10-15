<script setup>
import { onMounted, onUnmounted } from 'vue'
import { Minus, Plus, ShoppingBag, Trash2, X } from '@lucide/vue'
import { useCartStore } from '../stores/cart'
import { formatCurrency } from '../utils/formatCurrency'
const cart = useCartStore()
function onKeydown(event) { if (event.key === 'Escape') cart.isOpen = false }
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body"><Transition name="drawer"><div v-if="cart.isOpen" class="drawer-layer" @click.self="cart.isOpen = false"><aside class="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
    <div class="drawer-heading"><div><p class="eyebrow">TU SELECCIÓN</p><h2 id="cart-title">La bolsa<span class="brand-period">.</span></h2></div><button class="icon-button" type="button" aria-label="Cerrar carrito" @click="cart.isOpen = false"><X /></button></div>
    <div v-if="cart.items.length" class="cart-lines"><article v-for="item in cart.items" :key="item.id_producto" class="cart-line"><img v-if="item.imagen_url" :src="item.imagen_url" :alt="item.nombre" /><div v-else class="cart-line-placeholder">R.</div><div class="cart-line-info"><span class="product-category">{{ item.categoria_nombre || 'Colección' }}</span><RouterLink class="cart-line-name" :to="`/productos/${item.id_producto}`" @click="cart.isOpen = false">{{ item.nombre }}</RouterLink><span class="cart-line-price">{{ formatCurrency(item.precio) }}</span><div class="quantity-control"><button type="button" :aria-label="`Quitar una unidad de ${item.nombre}`" @click="cart.setQuantity(item.id_producto, item.cantidad - 1)"><Minus :size="13" /></button><span>{{ item.cantidad }}</span><button type="button" :disabled="item.cantidad >= item.stock" :aria-label="`Añadir una unidad de ${item.nombre}`" @click="cart.setQuantity(item.id_producto, item.cantidad + 1)"><Plus :size="13" /></button></div></div><button class="remove-line" type="button" :aria-label="`Eliminar ${item.nombre}`" @click="cart.removeItem(item.id_producto)"><Trash2 :size="16" /></button></article></div>
    <div v-else class="cart-empty"><span class="empty-bag"><ShoppingBag :size="25" /></span><h3>Tu bolsa está vacía</h3><p>Encuentra tu próximo favorito en la tienda.</p><RouterLink class="button button-dark" to="/" @click="cart.isOpen = false">Explorar productos</RouterLink></div>
    <div v-if="cart.items.length" class="drawer-footer"><div class="subtotal-row"><span>Subtotal</span><strong>{{ formatCurrency(cart.total) }}</strong></div><p class="checkout-note">La creación de pedidos aún no está habilitada en el backend.</p><button class="button button-dark checkout-button" type="button" disabled>Finalizar compra</button><button class="text-button clear-cart" type="button" @click="cart.clearCart()">Vaciar bolsa</button></div>
  </aside></div></Transition></Teleport>
</template>
