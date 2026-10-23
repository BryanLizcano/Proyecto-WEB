<script setup>
import { computed, onMounted, ref } from 'vue'
import { ArrowUpRight, LogOut, PackagePlus, Plus, RefreshCw, Tags } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { getApiError } from '../services/api'
import { createCategory, createProduct, getCategories, getProducts } from '../services/catalog'
import { useAuthStore } from '../stores/auth'
import { formatCurrency } from '../utils/formatCurrency'
const auth = useAuthStore()
const router = useRouter()
const categories = ref([])
const products = ref([])
const activeTab = ref('products')
const notice = ref('')
const errorMessage = ref('')
const saving = ref(false)
const showProductForm = ref(false)
const showCategoryForm = ref(false)
const productForm = ref({ id_categoria: '', nombre: '', descripcion: '', precio: '', stock: '', imagen_url: '' })
const categoryForm = ref({ nombre: '', descripcion: '' })
const totalUnits = computed(() => products.value.reduce((sum, product) => sum + Number(product.stock), 0))
async function loadDashboard() {
  errorMessage.value = ''
  try {
    const [categoryData, productResponse] = await Promise.all([getCategories(), getProducts({ page: 1, limit: 50 })])
    categories.value = categoryData
    products.value = productResponse.data
    if (!productForm.value.id_categoria && categories.value.length) productForm.value.id_categoria = String(categories.value[0].id_categoria)
  } catch (error) { errorMessage.value = getApiError(error) }
}
async function submitCategory() {
  saving.value = true; notice.value = ''; errorMessage.value = ''
  try {
    await createCategory(categoryForm.value)
    categoryForm.value = { nombre: '', descripcion: '' }; showCategoryForm.value = false; notice.value = 'Categoría creada.'
    await loadDashboard()
  } catch (error) { errorMessage.value = getApiError(error) } finally { saving.value = false }
}
async function submitProduct() {
  saving.value = true; notice.value = ''; errorMessage.value = ''
  try {
    await createProduct({ ...productForm.value, id_categoria: Number(productForm.value.id_categoria), precio: Number(productForm.value.precio), stock: Number(productForm.value.stock), imagen_url: productForm.value.imagen_url || null })
    productForm.value = { id_categoria: String(categories.value[0]?.id_categoria || ''), nombre: '', descripcion: '', precio: '', stock: '', imagen_url: '' }; showProductForm.value = false; notice.value = 'Producto creado.'
    await loadDashboard()
  } catch (error) { errorMessage.value = getApiError(error) } finally { saving.value = false }
}
async function signOut() { await auth.logout(); router.push('/admin/login') }
onMounted(loadDashboard)
</script>

<template>
  <section class="admin-page page-wrap"><div class="admin-page-heading"><div><p class="eyebrow">RITMO / ADMINISTRACIÓN</p><h1>El espacio de control<span class="brand-period">.</span></h1></div><button class="button button-outline" type="button" @click="signOut"><LogOut :size="16" /> Cerrar sesión</button></div>
    <div class="admin-stats"><div class="admin-stat"><span>Productos</span><strong>{{ products.length }}</strong></div><div class="admin-stat"><span>Categorías</span><strong>{{ categories.length }}</strong></div><div class="admin-stat"><span>Unidades</span><strong>{{ totalUnits }}</strong></div><div class="admin-stat"><button class="button button-accent" type="button" @click="loadDashboard"><RefreshCw :size="16" /> Actualizar datos</button></div></div>
    <div v-if="notice" class="notice notice-success" role="status">{{ notice }}</div><div v-if="errorMessage" class="notice notice-error" role="alert"><span>{{ errorMessage }}</span><button class="text-button" type="button" @click="loadDashboard">Reintentar</button></div>
    <div class="admin-workspace"><div class="admin-workspace-head"><div class="admin-tabs" role="tablist"><button class="admin-tab" :class="{ active: activeTab === 'products' }" role="tab" :aria-selected="activeTab === 'products'" type="button" @click="activeTab = 'products'"><PackagePlus :size="17" /> Productos</button><button class="admin-tab" :class="{ active: activeTab === 'categories' }" role="tab" :aria-selected="activeTab === 'categories'" type="button" @click="activeTab = 'categories'"><Tags :size="17" /> Categorías</button></div><button class="button button-dark" type="button" @click="activeTab === 'products' ? showProductForm = !showProductForm : showCategoryForm = !showCategoryForm"><Plus :size="17" /> Añadir {{ activeTab === 'products' ? 'producto' : 'categoría' }}</button></div>
  <form v-if="showProductForm && activeTab === 'products'" class="admin-form" @submit.prevent="submitProduct"><div class="form-heading"><h2>Agregar producto</h2><button class="text-button" type="button" @click="showProductForm = false">Cancelar</button></div><div class="form-grid"><label class="field-label">Nombre<input v-model.trim="productForm.nombre" class="text-input" required maxlength="150" /></label><label class="field-label">Categoría<select v-model="productForm.id_categoria" class="text-input" required><option disabled value="">Selecciona categoría</option><option v-for="category in categories" :key="category.id_categoria" :value="String(category.id_categoria)">{{ category.nombre }}</option></select></label><label class="field-label">Precio<input v-model="productForm.precio" class="text-input" type="number" min="0" step="0.01" required /></label><label class="field-label">Stock<input v-model="productForm.stock" class="text-input" type="number" min="0" step="1" required /></label><label class="field-label field-wide">Descripción<textarea v-model.trim="productForm.descripcion" class="text-input" rows="3"></textarea></label><label class="field-label field-wide">URL de imagen<input v-model.trim="productForm.imagen_url" class="text-input" type="url" maxlength="255" /></label></div><button class="button button-accent" type="submit" :disabled="saving || !categories.length">{{ saving ? 'Guardando...' : 'Guardar producto' }} <ArrowUpRight :size="17" /></button></form>
  <form v-if="showCategoryForm && activeTab === 'categories'" class="admin-form" @submit.prevent="submitCategory"><div class="form-heading"><h2>Agregar categoría</h2><button class="text-button" type="button" @click="showCategoryForm = false">Cancelar</button></div><div class="form-grid"><label class="field-label">Nombre<input v-model.trim="categoryForm.nombre" class="text-input" maxlength="100" required /></label><label class="field-label">Descripción<input v-model.trim="categoryForm.descripcion" class="text-input" /></label></div><button class="button button-accent" type="submit" :disabled="saving">{{ saving ? 'Guardando...' : 'Guardar categoría' }} <ArrowUpRight :size="17" /></button></form>
    <div v-if="activeTab === 'products'" class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id_producto">
            <td>{{ product.nombre }}</td>
            <td>{{ product.categoria_nombre }}</td>
            <td>{{ formatCurrency(product.precio) }}</td>
            <td>{{ product.stock }}</td>
          </tr>
          <tr v-if="!products.length">
            <td colspan="4" class="table-empty">No hay productos para mostrar.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="category-list">
      <article v-for="category in categories" :key="category.id_categoria" class="category-row">
        <span>{{ String(category.id_categoria).padStart(2, '0') }}</span>
        <div>
          <h3>{{ category.nombre }}</h3>
          <p>{{ category.descripcion || 'Sin descripción' }}</p>
        </div>
        <small>{{ products.filter((product) => product.id_categoria === category.id_categoria).length }} productos</small>
      </article>
      <p v-if="!categories.length" class="table-empty">No hay categorías para mostrar.</p>
    </div>
  </div>
</section>
</template>
