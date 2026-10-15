<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Search, SlidersHorizontal, X } from '@lucide/vue'
import { useRoute } from 'vue-router'
import ProductCard from '../components/ProductCard.vue'
import { getApiError } from '../services/api'
import { getCategories, getProducts } from '../services/catalog'

const route = useRoute()
const categories = ref([])
const products = ref([])
const selectedCategory = ref(route.query.category || '')
const searchInput = ref('')
const query = ref('')
const page = ref(1)
const meta = ref({ total: 0, totalPages: 0, limit: 12 })
const loading = ref(true)
const errorMessage = ref('')
let requestId = 0
const resultLabel = computed(() => `${meta.value.total} ${meta.value.total === 1 ? 'pieza' : 'piezas'}`)

async function loadCategories() {
  try { categories.value = await getCategories() } catch (error) { errorMessage.value = getApiError(error) }
}
async function loadProducts() {
  const currentRequest = ++requestId
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await getProducts({ ...(selectedCategory.value ? { id_categoria: selectedCategory.value } : {}), ...(query.value ? { q: query.value } : {}), page: page.value, limit: meta.value.limit })
    if (currentRequest !== requestId) return
    products.value = response.data
    meta.value = response.meta
  } catch (error) {
    if (currentRequest === requestId) errorMessage.value = getApiError(error)
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}
function submitSearch() { query.value = searchInput.value.trim(); page.value = 1 }
function selectCategory(id) { selectedCategory.value = id; page.value = 1 }
watch([selectedCategory, query, page], loadProducts)
watch(() => route.query.category, (value) => { selectedCategory.value = value || ''; page.value = 1 })
onMounted(async () => { await Promise.all([loadCategories(), loadProducts()]) })
</script>

<template>
  <div class="catalog-page page-wrap">
    <section class="catalog-intro"><div class="catalog-heading"><p class="eyebrow"><span class="eyebrow-dot"></span> EQUIPO PARA CADA MOVIMIENTO</p><h1>Muévete<br /><span>a tu ritmo.</span></h1><p class="intro-copy">Piezas cómodas, funcionales y listas para acompañarte donde empieza tu día.</p></div><div class="intro-stamp" aria-hidden="true"><span>R</span><small>MOVE<br />YOUR WAY</small></div><div class="intro-aside"><span class="aside-index">01 / 03</span><p>Una selección pensada para hacerlo<br />bien, sentirte bien y seguir.</p><span class="aside-line"></span></div></section>
    <section class="shop-section" aria-labelledby="shop-title"><div class="shop-topline"><div><p class="eyebrow">LA COLECCIÓN</p><h2 id="shop-title">Encuentra tu siguiente favorito</h2></div><form class="search-form" role="search" @submit.prevent="submitSearch"><label class="sr-only" for="product-search">Buscar productos</label><Search :size="18" /><input id="product-search" v-model="searchInput" type="search" placeholder="Buscar en la tienda" /><button v-if="searchInput" class="search-clear" type="button" aria-label="Borrar búsqueda" @click="searchInput = ''; submitSearch()"><X :size="16" /></button></form></div>
      <div class="catalog-toolbar"><div class="category-filters" role="group" aria-label="Filtrar por categoría"><button class="category-chip" :class="{ active: !selectedCategory }" type="button" @click="selectCategory('')">Todo</button><button v-for="category in categories" :key="category.id_categoria" class="category-chip" :class="{ active: selectedCategory === String(category.id_categoria) }" type="button" @click="selectCategory(String(category.id_categoria))">{{ category.nombre }}</button></div><span class="result-count"><SlidersHorizontal :size="15" /> {{ resultLabel }}</span></div>
      <div v-if="errorMessage" class="notice notice-error" role="alert"><div><strong>No pudimos cargar la tienda</strong><p>{{ errorMessage }}</p></div><button class="button button-outline" type="button" @click="loadProducts">Reintentar</button></div>
      <div v-else-if="loading" class="product-grid" aria-label="Cargando productos" aria-busy="true"><div v-for="item in 8" :key="item" class="product-skeleton"><div></div><span></span><span></span></div></div>
      <div v-else-if="products.length" class="product-grid"><ProductCard v-for="product in products" :key="product.id_producto" :product="product" /></div>
      <div v-else class="empty-results"><span class="empty-results-mark">R.</span><h3>No encontramos esa combinación</h3><p>Prueba con otra palabra o revisa todas las categorías.</p><button class="button button-outline" type="button" @click="searchInput = ''; query = ''; selectCategory('')">Ver toda la colección</button></div>
      <nav v-if="meta.totalPages > 1 && !loading" class="pagination" aria-label="Paginación de productos"><button class="button button-outline" type="button" :disabled="page <= 1" @click="page--">Anterior</button><span>Página {{ page }} de {{ meta.totalPages }}</span><button class="button button-outline" type="button" :disabled="page >= meta.totalPages" @click="page++">Siguiente</button></nav>
    </section>
  </div>
</template>
