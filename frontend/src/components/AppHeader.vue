<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ShoppingBag, ShieldCheck } from '@lucide/vue'
import { useCartStore } from '../stores/cart'
import { getCategories } from '../services/catalog'

const cart = useCartStore()
const route = useRoute()
const categories = ref([])

onMounted(async () => {
  try {
    categories.value = await getCategories()
  } catch (error) {
    categories.value = []
  }
})
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink class="brand" to="/" aria-label="Ritmo Store, inicio">
        <span class="brand-mark">R</span>
        <span>ritmo<span class="brand-period">.</span></span>
      </RouterLink>

      <nav class="main-nav" aria-label="Navegación principal">
        <RouterLink
          to="/"
          :class="{ 'is-active': route.path === '/' && !route.query.category }"
        >
          Tienda
        </RouterLink>
        <RouterLink
          v-for="category in categories"
          :key="category.id_categoria"
          :to="`/?category=${category.id_categoria}`"
          :class="{ 'is-active': route.path === '/' && String(route.query.category) === String(category.id_categoria) }"
        >
          {{ category.nombre }}
        </RouterLink>
      </nav>

      <div class="header-actions">
        <RouterLink class="admin-link" to="/admin/login" aria-label="Acceso administrador">
          <ShieldCheck :size="17" />
          <span>Admin</span>
        </RouterLink>
        <button class="cart-trigger" type="button" aria-label="Abrir carrito" @click="cart.isOpen = true">
          <ShoppingBag :size="19" />
          <span class="cart-label">Bolsa</span>
          <span class="cart-count">{{ cart.itemCount }}</span>
        </button>
      </div>
    </div>
    <div class="header-rule"></div>
  </header>
</template>
