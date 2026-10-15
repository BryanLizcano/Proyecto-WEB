<script setup>
import { ShoppingBag, ShieldCheck } from '@lucide/vue'
import { useCartStore } from '../stores/cart'
const cart = useCartStore()
</script>

<template>
  <header class="site-header"><div class="header-inner">
    <RouterLink class="brand" to="/" aria-label="Ritmo Store, inicio"><span class="brand-mark">R</span><span>ritmo<span class="brand-period">.</span></span></RouterLink>
    <nav class="main-nav" aria-label="Navegación principal"><RouterLink to="/">Tienda</RouterLink><RouterLink to="/?category=1">Calzado</RouterLink><RouterLink to="/?category=2">Ropa y accesorios</RouterLink></nav>
    <div class="header-actions"><RouterLink class="admin-link" to="/admin/login" aria-label="Acceso administrador"><ShieldCheck :size="17" /><span>Admin</span></RouterLink><button class="cart-trigger" type="button" aria-label="Abrir carrito" @click="cart.isOpen = true"><ShoppingBag :size="19" /><span class="cart-label">Bolsa</span><span class="cart-count">{{ cart.itemCount }}</span></button></div>
  </div><div class="header-rule"></div></header>
</template>
