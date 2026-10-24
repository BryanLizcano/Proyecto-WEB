import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'catalog', component: () => import('../views/CatalogView.vue') },
    { path: '/productos/:id', name: 'product-detail', component: () => import('../views/ProductDetailView.vue') },
    { path: '/mi-cuenta', name: 'client-account', component: () => import('../views/ClientAccountView.vue'), meta: { requiresClientAuth: true } },
    { path: '/admin/login', name: 'admin-login', component: () => import('../views/AdminLoginView.vue') },
    { path: '/admin', redirect: '/admin/dashboard' },
    { path: '/admin/dashboard', name: 'admin-dashboard', component: () => import('../views/AdminDashboardView.vue'), meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
  ],
  scrollBehavior: () => ({ top: 0, behavior: 'smooth' }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth) {
    const ok = await auth.checkSession()
    if (ok && auth.isAdmin) return true
    return { path: '/', query: { auth: 'required' } }
  }

  if (to.meta.requiresClientAuth) {
    const ok = await auth.checkSession()
    if (ok && auth.authenticated) return true
    return { path: '/', query: { auth: 'required' } }
  }

  return true
})

export default router
