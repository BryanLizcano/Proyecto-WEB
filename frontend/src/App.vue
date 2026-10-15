<template>
  <div class="app-shell">
    <AppHeader />
    <main><RouterView /></main>
    <CartDrawer />
  </div>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue'
import CartDrawer from './components/CartDrawer.vue'
</script>
