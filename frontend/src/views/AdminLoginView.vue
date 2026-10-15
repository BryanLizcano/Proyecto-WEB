<script setup>
import { ref } from 'vue'
import { ArrowUpRight, LockKeyhole } from '@lucide/vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const submitting = ref(false)
async function submitLogin() {
  errorMessage.value = ''
  submitting.value = true
  const result = await auth.login({ email: email.value, password: password.value })
  submitting.value = false
  if (!result.success) { errorMessage.value = result.message; return }
  router.push(route.query.redirect || '/admin/dashboard')
}
</script>

<template>
  <section class="admin-login-page page-wrap"><div class="admin-login-art"><span class="art-index">RITMO / BACK OFFICE</span><div class="art-circle"><span>R.</span></div><p>Lo que mueve<br />la tienda, <em>empieza aquí.</em></p><span class="art-bottom">PANEL DE ADMINISTRACIÓN</span></div>
    <form class="admin-login-form" @submit.prevent="submitLogin"><p class="eyebrow">ACCESO PRIVADO</p><h1>Hola de nuevo.</h1><p class="login-subtitle">Ingresa con tu cuenta de administrador.</p><div v-if="errorMessage" class="notice notice-error login-error" role="alert"><LockKeyhole :size="18" /><span>{{ errorMessage }}</span></div><label class="field-label" for="admin-email">Correo electrónico<input id="admin-email" v-model.trim="email" class="text-input" type="email" autocomplete="username" required placeholder="admin@tiendamodular.com" /></label><label class="field-label" for="admin-password">Contraseña<input id="admin-password" v-model="password" class="text-input" type="password" autocomplete="current-password" required placeholder="Tu contraseña" /></label><button class="button button-dark login-submit" type="submit" :disabled="submitting">{{ submitting ? 'Verificando...' : 'Entrar al panel' }} <ArrowUpRight :size="17" /></button><RouterLink class="back-link login-back" to="/">← Volver a la tienda</RouterLink></form>
  </section>
</template>
