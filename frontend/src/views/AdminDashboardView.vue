<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  ArrowUpRight,
  Eye,
  LogOut,
  PackagePlus,
  Pencil,
  Plus,
  RefreshCw,
  ShoppingBag,
  Tags,
  Trash2,
  X,
} from '@lucide/vue'
import { useRouter } from 'vue-router'
import { getApiError } from '../services/api'
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getCategories,
  getProducts,
  updateCategory,
  updateProduct,
} from '../services/catalog'
import { getOrder, getOrders, updateOrderStatus } from '../services/orders'
import { useAuthStore } from '../stores/auth'
import { formatCurrency } from '../utils/formatCurrency'

const auth = useAuthStore()
const router = useRouter()
const categories = ref([])
const products = ref([])
const orders = ref([])
const activeTab = ref('products')
const orderFilterStatus = ref('')
const selectedOrder = ref(null)
const loadingOrderDetail = ref(false)

const notice = ref('')
const errorMessage = ref('')
const saving = ref(false)
const showProductForm = ref(false)
const showCategoryForm = ref(false)
const editingCategory = ref(null)
const editingProduct = ref(null)

const productForm = ref({ id_categoria: '', nombre: '', descripcion: '', precio: '', stock: '', imagen_url: '' })
const categoryForm = ref({ nombre: '', descripcion: '' })
const totalUnits = computed(() => products.value.reduce((sum, product) => sum + Number(product.stock), 0))

async function loadDashboard() {
  errorMessage.value = ''
  try {
    const [categoryData, productResponse, orderResponse] = await Promise.all([
      getCategories(),
      getProducts({ page: 1, limit: 50 }),
      getOrders({ estado: orderFilterStatus.value || undefined, limit: 50 }),
    ])
    categories.value = categoryData
    products.value = productResponse.data
    orders.value = orderResponse.data
    if (!productForm.value.id_categoria && categories.value.length) {
      productForm.value.id_categoria = String(categories.value[0].id_categoria)
    }
  } catch (error) {
    errorMessage.value = getApiError(error)
  }
}

async function filterOrders(status) {
  orderFilterStatus.value = status
  errorMessage.value = ''
  try {
    const res = await getOrders({ estado: status || undefined, limit: 50 })
    orders.value = res.data
  } catch (error) {
    errorMessage.value = getApiError(error)
  }
}

async function openOrderDetail(order) {
  errorMessage.value = ''
  loadingOrderDetail.value = true
  try {
    const fullOrder = await getOrder(order.id_pedido)
    selectedOrder.value = fullOrder
  } catch (error) {
    errorMessage.value = getApiError(error)
  } finally {
    loadingOrderDetail.value = false
  }
}

function closeOrderDetail() {
  selectedOrder.value = null
}

const updatingStatusOrderId = ref(null)

async function changeOrderStatus(orderId, newStatus) {
  if (!newStatus) return
  updatingStatusOrderId.value = orderId
  errorMessage.value = ''
  notice.value = ''
  try {
    const updatedOrder = await updateOrderStatus(orderId, newStatus)
    notice.value = `Estado del pedido #${orderId} actualizado a "${updatedOrder.estado}" exitosamente.`

    const idx = orders.value.findIndex((o) => o.id_pedido === orderId)
    if (idx !== -1) {
      orders.value[idx].estado = updatedOrder.estado
    }

    if (selectedOrder.value && selectedOrder.value.id_pedido === orderId) {
      selectedOrder.value.estado = updatedOrder.estado
    }
  } catch (error) {
    errorMessage.value = getApiError(error)
  } finally {
    updatingStatusOrderId.value = null
  }
}

function formatOrderDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function startEditCategory(category) {
  editingCategory.value = category
  categoryForm.value = {
    nombre: category.nombre,
    descripcion: category.descripcion || '',
  }
  showCategoryForm.value = true
  activeTab.value = 'categories'
}

function cancelCategoryForm() {
  showCategoryForm.value = false
  editingCategory.value = null
  categoryForm.value = { nombre: '', descripcion: '' }
}

function startEditProduct(product) {
  editingProduct.value = product
  productForm.value = {
    id_categoria: String(product.id_categoria),
    nombre: product.nombre,
    descripcion: product.descripcion || '',
    precio: product.precio,
    stock: product.stock,
    imagen_url: product.imagen_url || '',
  }
  showProductForm.value = true
  activeTab.value = 'products'
}

function cancelProductForm() {
  showProductForm.value = false
  editingProduct.value = null
  productForm.value = {
    id_categoria: String(categories.value[0]?.id_categoria || ''),
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    imagen_url: '',
  }
}

async function submitCategory() {
  saving.value = true
  notice.value = ''
  errorMessage.value = ''
  try {
    if (editingCategory.value) {
      await updateCategory(editingCategory.value.id_categoria, categoryForm.value)
      notice.value = 'Categoría actualizada exitosamente.'
    } else {
      await createCategory(categoryForm.value)
      notice.value = 'Categoría creada exitosamente.'
    }
    cancelCategoryForm()
    await loadDashboard()
  } catch (error) {
    errorMessage.value = getApiError(error)
  } finally {
    saving.value = false
  }
}

async function removeCategory(category) {
  const confirmed = window.confirm(
    `¿Estás seguro de que deseas eliminar la categoría "${category.nombre}"? Esta acción no se puede deshacer.`
  )
  if (!confirmed) return

  notice.value = ''
  errorMessage.value = ''
  try {
    const response = await deleteCategory(category.id_categoria)
    notice.value = response.message || `Categoría "${category.nombre}" eliminada exitosamente.`
    if (editingCategory.value?.id_categoria === category.id_categoria) {
      cancelCategoryForm()
    }
    await loadDashboard()
  } catch (error) {
    errorMessage.value = getApiError(error)
  }
}

async function removeProduct(product) {
  const confirmed = window.confirm(
    `¿Estás seguro de que deseas eliminar el producto "${product.nombre}"? Esta acción no se puede deshacer.`
  )
  if (!confirmed) return

  notice.value = ''
  errorMessage.value = ''
  try {
    const response = await deleteProduct(product.id_producto)
    notice.value = response.message || `Producto "${product.nombre}" eliminado exitosamente.`
    if (editingProduct.value?.id_producto === product.id_producto) {
      cancelProductForm()
    }
    await loadDashboard()
  } catch (error) {
    errorMessage.value = getApiError(error)
  }
}

async function submitProduct() {
  saving.value = true
  notice.value = ''
  errorMessage.value = ''
  try {
    const payload = {
      ...productForm.value,
      id_categoria: Number(productForm.value.id_categoria),
      precio: Number(productForm.value.precio),
      stock: Number(productForm.value.stock),
      imagen_url: productForm.value.imagen_url ? productForm.value.imagen_url.trim() : null,
    }

    if (editingProduct.value) {
      await updateProduct(editingProduct.value.id_producto, payload)
      notice.value = 'Producto actualizado exitosamente.'
    } else {
      await createProduct(payload)
      notice.value = 'Producto creado exitosamente.'
    }

    cancelProductForm()
    await loadDashboard()
  } catch (error) {
    errorMessage.value = getApiError(error)
  } finally {
    saving.value = false
  }
}

async function signOut() {
  await auth.logout()
  router.push('/')
}

onMounted(loadDashboard)
</script>

<template>
  <section class="admin-page page-wrap">
    <div class="admin-page-heading">
      <div>
        <p class="eyebrow">RITMO / ADMINISTRACIÓN</p>
        <h1>El espacio de control<span class="brand-period">.</span></h1>
      </div>
      <button class="button button-outline" type="button" @click="signOut">
        <LogOut :size="16" /> Cerrar sesión
      </button>
    </div>

    <div class="admin-stats">
      <div class="admin-stat"><span>Productos</span><strong>{{ products.length }}</strong></div>
      <div class="admin-stat"><span>Categorías</span><strong>{{ categories.length }}</strong></div>
      <div class="admin-stat"><span>Unidades</span><strong>{{ totalUnits }}</strong></div>
      <div class="admin-stat"><span>Pedidos</span><strong>{{ orders.length }}</strong></div>
      <div class="admin-stat" style="border: 0;">
        <button class="button button-accent" type="button" @click="loadDashboard">
          <RefreshCw :size="16" /> Actualizar datos
        </button>
      </div>
    </div>

    <div v-if="notice" class="notice notice-success" role="status">{{ notice }}</div>
    <div v-if="errorMessage" class="notice notice-error" role="alert">
      <span>{{ errorMessage }}</span>
      <button class="text-button" type="button" @click="loadDashboard">Reintentar</button>
    </div>

    <div class="admin-workspace">
      <div class="admin-workspace-head">
        <div class="admin-tabs" role="tablist">
          <button
            class="admin-tab"
            :class="{ active: activeTab === 'products' }"
            role="tab"
            :aria-selected="activeTab === 'products'"
            type="button"
            @click="activeTab = 'products'"
          >
            Productos
          </button>
          <button
            class="admin-tab"
            :class="{ active: activeTab === 'categories' }"
            role="tab"
            :aria-selected="activeTab === 'categories'"
            type="button"
            @click="activeTab = 'categories'"
          >
            Categorías
          </button>
          <button
            class="admin-tab"
            :class="{ active: activeTab === 'orders' }"
            role="tab"
            :aria-selected="activeTab === 'orders'"
            type="button"
            @click="activeTab = 'orders'"
          >
            Pedidos
          </button>
        </div>

        <div class="admin-workspace-actions">
          <button
            v-if="activeTab === 'products'"
            class="button button-accent"
            type="button"
            @click="editingProduct ? cancelProductForm() : (showProductForm = !showProductForm)"
          >
            <PackagePlus :size="16" />
            {{ showProductForm ? 'Cerrar formulario' : 'Nuevo producto' }}
          </button>
          <button
            v-else-if="activeTab === 'categories'"
            class="button button-accent"
            type="button"
            @click="editingCategory ? cancelCategoryForm() : (showCategoryForm = !showCategoryForm)"
          >
            <Tags :size="16" />
            {{ showCategoryForm ? 'Cerrar formulario' : 'Nueva categoría' }}
          </button>
        </div>
      </div>

      <!-- FORMULARIOS -->
      <form v-if="showProductForm && activeTab === 'products'" class="admin-form" @submit.prevent="submitProduct">
        <div class="form-heading">
          <h2>{{ editingProduct ? 'Editar producto' : 'Agregar producto' }}</h2>
          <button class="text-button" type="button" @click="cancelProductForm">Cancelar</button>
        </div>
        <div class="form-grid">
          <label class="field-label">
            Categoría
            <select v-model="productForm.id_categoria" class="text-input" required>
              <option disabled value="">Selecciona una categoría</option>
              <option v-for="cat in categories" :key="cat.id_categoria" :value="String(cat.id_categoria)">
                {{ cat.nombre }}
              </option>
            </select>
          </label>
          <label class="field-label">
            Nombre del producto
            <input v-model.trim="productForm.nombre" class="text-input" maxlength="150" required />
          </label>
          <label class="field-label">
            Precio
            <input v-model="productForm.precio" class="text-input" type="number" min="0" step="0.01" required />
          </label>
          <label class="field-label">
            Stock
            <input v-model="productForm.stock" class="text-input" type="number" min="0" step="1" required />
          </label>
          <label class="field-label field-wide">
            Descripción
            <textarea v-model.trim="productForm.descripcion" class="text-input" rows="3"></textarea>
          </label>
          <label class="field-label field-wide">
            URL de imagen
            <input v-model.trim="productForm.imagen_url" class="text-input" type="url" maxlength="255" />
          </label>
        </div>
        <button class="button button-accent" type="submit" :disabled="saving || !categories.length">
          {{ saving ? 'Guardando...' : editingProduct ? 'Guardar cambios' : 'Guardar producto' }}
          <ArrowUpRight :size="17" />
        </button>
      </form>

      <form v-if="showCategoryForm && activeTab === 'categories'" class="admin-form" @submit.prevent="submitCategory">
        <div class="form-heading">
          <h2>{{ editingCategory ? 'Editar categoría' : 'Agregar categoría' }}</h2>
          <button class="text-button" type="button" @click="cancelCategoryForm">Cancelar</button>
        </div>
        <div class="form-grid">
          <label class="field-label">
            Nombre
            <input v-model.trim="categoryForm.nombre" class="text-input" maxlength="100" required />
          </label>
          <label class="field-label">
            Descripción
            <input v-model.trim="categoryForm.descripcion" class="text-input" />
          </label>
        </div>
        <button class="button button-accent" type="submit" :disabled="saving">
          {{ saving ? 'Guardando...' : editingCategory ? 'Guardar cambios' : 'Guardar categoría' }}
          <ArrowUpRight :size="17" />
        </button>
      </form>

      <!-- TABLA DE PRODUCTOS -->
      <div v-if="activeTab === 'products'" class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th style="text-align: right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id_producto">
              <td>{{ product.nombre }}</td>
              <td>{{ product.categoria_nombre }}</td>
              <td>{{ formatCurrency(product.precio) }}</td>
              <td>{{ product.stock }}</td>
              <td style="text-align: right;">
                <button
                  class="text-button"
                  type="button"
                  title="Editar producto"
                  aria-label="Editar producto"
                  @click="startEditProduct(product)"
                >
                  <Pencil :size="13" /> Editar
                </button>
                <button
                  class="text-button text-button-danger"
                  type="button"
                  title="Eliminar producto"
                  aria-label="Eliminar producto"
                  style="margin-left: 0.5rem;"
                  @click="removeProduct(product)"
                >
                  <Trash2 :size="13" /> Eliminar
                </button>
              </td>
            </tr>
            <tr v-if="!products.length">
              <td colspan="5" class="table-empty">No hay productos para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- LISTA DE CATEGORÍAS -->
      <div v-else-if="activeTab === 'categories'" class="category-list">
        <article v-for="category in categories" :key="category.id_categoria" class="category-row">
          <span>{{ String(category.id_categoria).padStart(2, '0') }}</span>
          <div>
            <h3>{{ category.nombre }}</h3>
            <p>{{ category.descripcion || 'Sin descripción' }}</p>
          </div>
          <div class="category-row-aside">
            <small>{{ products.filter((product) => product.id_categoria === category.id_categoria).length }} productos</small>
            <button
              class="text-button"
              type="button"
              title="Editar categoría"
              aria-label="Editar categoría"
              @click="startEditCategory(category)"
            >
              <Pencil :size="13" /> Editar
            </button>
            <button
              class="text-button text-button-danger"
              type="button"
              title="Eliminar categoría"
              aria-label="Eliminar categoría"
              @click="removeCategory(category)"
            >
              <Trash2 :size="13" /> Eliminar
            </button>
          </div>
        </article>
        <p v-if="!categories.length" class="table-empty">No hay categorías para mostrar.</p>
      </div>

      <!-- TABLA DE PEDIDOS (HU-17) -->
      <div v-else-if="activeTab === 'orders'" class="orders-section">
        <div class="orders-filter-bar">
          <span class="filter-label">Filtrar por estado:</span>
          <div class="filter-buttons">
            <button
              class="filter-pill"
              :class="{ active: orderFilterStatus === '' }"
              type="button"
              @click="filterOrders('')"
            >
              Todos ({{ orders.length }})
            </button>
            <button
              class="filter-pill"
              :class="{ active: orderFilterStatus === 'PENDIENTE' }"
              type="button"
              @click="filterOrders('PENDIENTE')"
            >
              Pendiente
            </button>
            <button
              class="filter-pill"
              :class="{ active: orderFilterStatus === 'CONFIRMADO' }"
              type="button"
              @click="filterOrders('CONFIRMADO')"
            >
              Confirmado
            </button>
            <button
              class="filter-pill"
              :class="{ active: orderFilterStatus === 'EN_PREPARACION' }"
              type="button"
              @click="filterOrders('EN_PREPARACION')"
            >
              En preparación
            </button>
            <button
              class="filter-pill"
              :class="{ active: orderFilterStatus === 'COMPLETADO' }"
              type="button"
              @click="filterOrders('COMPLETADO')"
            >
              Completado
            </button>
            <button
              class="filter-pill"
              :class="{ active: orderFilterStatus === 'CANCELADO' }"
              type="button"
              @click="filterOrders('CANCELADO')"
            >
              Cancelado
            </button>
          </div>
        </div>

        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Total</th>
                <th>Estado</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order.id_pedido">
                <td><strong>#{{ order.id_pedido }}</strong></td>
                <td>{{ formatOrderDate(order.fecha) }}</td>
                <td>{{ order.nombre_cliente }}</td>
                <td>{{ order.contacto_cliente }}</td>
                <td>{{ formatCurrency(order.total) }}</td>
                <td>
                  <select
                    class="status-select"
                    :class="`status-${order.estado.toLowerCase()}`"
                    :value="order.estado"
                    :disabled="updatingStatusOrderId === order.id_pedido"
                    aria-label="Cambiar estado del pedido"
                    @change="changeOrderStatus(order.id_pedido, $event.target.value)"
                  >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="CONFIRMADO">CONFIRMADO</option>
                    <option value="EN_PREPARACION">EN_PREPARACION</option>
                    <option value="COMPLETADO">COMPLETADO</option>
                    <option value="CANCELADO">CANCELADO</option>
                  </select>
                </td>
                <td style="text-align: right;">
                  <button
                    class="text-button"
                    type="button"
                    title="Ver detalle del pedido"
                    aria-label="Ver detalle del pedido"
                    @click="openOrderDetail(order)"
                  >
                    <Eye :size="13" /> Ver detalle
                  </button>
                </td>
              </tr>
              <tr v-if="!orders.length">
                <td colspan="7" class="table-empty">No hay pedidos registrados con el filtro seleccionado.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL DETALLE DE PEDIDO (HU-17) -->
    <Teleport to="body">
      <div v-if="selectedOrder" class="modal-layer" @click.self="closeOrderDetail">
        <div class="order-modal" role="dialog" aria-modal="true" aria-labelledby="modal-order-title">
          <div class="modal-header">
            <div>
              <p class="eyebrow">DETALLE DEL PEDIDO</p>
              <h2 id="modal-order-title">Orden #{{ selectedOrder.id_pedido }}</h2>
            </div>
            <button class="icon-button" type="button" aria-label="Cerrar modal" @click="closeOrderDetail">
              <X :size="18" />
            </button>
          </div>

          <div class="modal-body">
            <div class="order-info-card">
              <div class="order-info-col">
                <span class="info-label">Cliente</span>
                <strong>{{ selectedOrder.nombre_cliente }}</strong>
              </div>
              <div class="order-info-col">
                <span class="info-label">Dato de contacto</span>
                <span>{{ selectedOrder.contacto_cliente }}</span>
              </div>
              <div class="order-info-col">
                <span class="info-label">Fecha y hora</span>
                <span>{{ formatOrderDate(selectedOrder.fecha) }}</span>
              </div>
              <div class="order-info-col">
                <span class="info-label">Estado actual</span>
                <select
                  class="status-select"
                  :class="`status-${selectedOrder.estado.toLowerCase()}`"
                  :value="selectedOrder.estado"
                  :disabled="updatingStatusOrderId === selectedOrder.id_pedido"
                  aria-label="Cambiar estado en detalle"
                  @change="changeOrderStatus(selectedOrder.id_pedido, $event.target.value)"
                >
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="CONFIRMADO">CONFIRMADO</option>
                  <option value="EN_PREPARACION">EN_PREPARACION</option>
                  <option value="COMPLETADO">COMPLETADO</option>
                  <option value="CANCELADO">CANCELADO</option>
                </select>
              </div>
            </div>

            <h3 class="items-heading">Productos comprados</h3>
            <table class="detail-items-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style="text-align: center;">Cantidad</th>
                  <th style="text-align: right;">Precio Unitario</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedOrder.detalles" :key="item.id_detalle">
                  <td>{{ item.nombre_producto }}</td>
                  <td style="text-align: center;">{{ item.cantidad }}</td>
                  <td style="text-align: right;">{{ formatCurrency(item.precio_unitario) }}</td>
                  <td style="text-align: right;">{{ formatCurrency(item.subtotal) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="text-align: right; font-weight: 800;">Total del pedido:</td>
                  <td style="text-align: right; font-weight: 800; font-size: 15px; color: #1a4d2e;">
                    {{ formatCurrency(selectedOrder.total) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="modal-footer">
            <button class="button button-outline" type="button" @click="closeOrderDetail">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.orders-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.orders-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: #f7f6f1;
  border: 1px solid #e2e1d7;
}

.filter-label {
  font-size: 11px;
  font-weight: 700;
  color: #727774;
}

.filter-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-pill {
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 700;
  border: 1px solid #e2e1d7;
  background: #ffffff;
  color: #181f1b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill:hover {
  border-color: #1a4d2e;
}

.filter-pill.active {
  background: #1a4d2e;
  color: #ffffff;
  border-color: #1a4d2e;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 2px;
  text-transform: uppercase;
}

.status-select {
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 2px;
  text-transform: uppercase;
  cursor: pointer;
  outline: none;
  font-family: inherit;
  transition: all 0.15s ease;
}

.status-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-pendiente {
  background: #fff8e6;
  color: #b78103;
  border: 1px solid #f2d07e;
}

.status-confirmado {
  background: #e8f4fd;
  color: #1765ad;
  border: 1px solid #a8d5fc;
}

.status-en_preparacion {
  background: #f0eafb;
  color: #633eb5;
  border: 1px solid #d1bff5;
}

.status-completado {
  background: #e9f7ef;
  color: #1e7e34;
  border: 1px solid #a3e4d7;
}

.status-cancelado {
  background: #fdeeee;
  color: #dc3545;
  border: 1px solid #f5c6cb;
}

/* MODAL DE DETALLE */
.modal-layer {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(24, 31, 27, 0.5);
  padding: 20px;
}

.order-modal {
  width: min(650px, 100%);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid #e2e1d7;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e1d7;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-info-card {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 16px;
  background: #f7f6f1;
  border: 1px solid #e2e1d7;
  font-size: 12px;
}

.order-info-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 10px;
  font-weight: 800;
  color: #727774;
  text-transform: uppercase;
}

.items-heading {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #181f1b;
}

.detail-items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.detail-items-table th,
.detail-items-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e2e1d7;
}

.detail-items-table th {
  background: #faf9f5;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  color: #727774;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #e2e1d7;
  background: #faf9f5;
}
</style>
