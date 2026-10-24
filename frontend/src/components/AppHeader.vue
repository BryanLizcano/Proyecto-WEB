<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { LogOut, ShieldCheck, ShoppingBag, User } from '@lucide/vue'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import { getCategories } from '../services/catalog'
import AuthModal from './AuthModal.vue'

const cart = useCartStore()
const auth = useAuthStore()
const route = useRoute()
const categories = ref([])
const showAuthModal = ref(false)

onMounted(async () => {
  try {
    categories.value = await getCategories()
  } catch (error) {
    categories.value = []
  }
  // Verificar si hay sesión activa en cookie / storage
  await auth.checkSession()
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
          active-class=""
          exact-active-class=""
          :class="{ 'is-active': route.path === '/' && !route.query.category }"
        >
          Tienda
        </RouterLink>
        <RouterLink
          v-for="category in categories"
          :key="category.id_categoria"
          :to="`/?category=${category.id_categoria}`"
          active-class=""
          exact-active-class=""
          :class="{ 'is-active': route.path === '/' && String(route.query.category) === String(category.id_categoria) }"
        >
          {{ category.nombre }}
        </RouterLink>
      </nav>

      <div class="header-actions">
        <!-- PESTAÑA ADMIN: SOLO SE REVELA SI ES ADMINISTRADOR -->
        <RouterLink
          v-if="auth.isAdmin"
          class="admin-link is-admin-visible"
          to="/admin"
          aria-label="Panel de administración"
        >
          <ShieldCheck :size="17" />
          <span>Admin</span>
        </RouterLink>

        <!-- CAJA DE USUARIO LOGUEADO -->
        <div v-if="auth.authenticated" class="user-session-box">
          <!-- ENLACE A MI CUENTA PARA CLIENTES -->
          <RouterLink
            v-if="!auth.isAdmin"
            to="/mi-cuenta"
            class="user-account-link"
            title="Ir a Mi Cuenta (Mis pedidos y actualización de datos)"
          >
            <User :size="14" />
            <span class="user-greeting">Mi cuenta ({{ auth.user?.nombre ? auth.user.nombre.split(' ')[0] : 'Cliente' }})</span>
          </RouterLink>

          <!-- INDICADOR PARA ADMINISTRADOR -->
          <span v-else class="user-greeting">
            Admin: {{ auth.user?.nombre ? auth.user.nombre.split(' ')[0] : 'Admin' }}
          </span>

          <button
            class="logout-trigger"
            type="button"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            @click="auth.logout()"
          >
            <LogOut :size="13" />
          </button>
        </div>

        <!-- BOTÓN INGRESAR (CUANDO NO ESTÁ AUTENTICADO) -->
        <button
          v-else
          class="auth-trigger"
          type="button"
          aria-label="Iniciar sesión o registrarse"
          @click="showAuthModal = true"
        >
          <User :size="16" />
          <span>Ingresar</span>
        </button>

        <!-- BOLSA DE COMPRAS -->
        <button class="cart-trigger" type="button" aria-label="Abrir carrito" @click="cart.isOpen = true">
          <ShoppingBag :size="19" />
          <span class="cart-label">Bolsa</span>
          <span class="cart-count">{{ cart.itemCount }}</span>
        </button>
      </div>
    </div>
    <div class="header-rule"></div>

    <AuthModal
      :is-open="showAuthModal"
      @close="showAuthModal = false"
    />
  </header>
</template>

<style scoped>
.auth-trigger {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  background: none;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  color: #777a71;
  transition: color 0.15s;
  padding: 4px 6px;
}

.auth-trigger:hover {
  color: #20231f;
}

.user-session-box {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f4f3ee;
  border: 1px solid #deded5;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
}

.user-account-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #1e4a3d;
  text-decoration: none;
  transition: opacity 0.15s;
}

.user-account-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.user-greeting {
  color: #1e4a3d;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-trigger {
  display: grid;
  place-items: center;
  background: transparent;
  border: 0;
  color: #777a71;
  cursor: pointer;
  padding: 2px;
  transition: color 0.15s;
}

.logout-trigger:hover {
  color: #a83d32;
}

.is-admin-visible {
  color: #1e4a3d !important;
  font-weight: 800 !important;
}
</style>
