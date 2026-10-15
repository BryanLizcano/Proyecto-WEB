import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'ritmo-cart'

function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref(readCart())
  const isOpen = ref(false)
  const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.cantidad, 0))
  const total = computed(() => items.value.reduce((sum, item) => sum + item.precio * item.cantidad, 0))

  watch(items, (value) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)) } catch { /* Storage may be unavailable. */ }
  }, { deep: true })

  function addItem(product, quantity = 1) {
    const amount = Number(quantity)
    const stock = Number(product.stock)
    if (!Number.isInteger(amount) || amount < 1 || stock < 1) return { success: false, message: 'Este producto no tiene unidades disponibles.' }
    const existing = items.value.find((item) => item.id_producto === product.id_producto)
    const nextQuantity = (existing?.cantidad || 0) + amount
    if (nextQuantity > stock) return { success: false, message: `Solo hay ${stock} unidades disponibles.` }
    if (existing) {
      existing.cantidad = nextQuantity
      existing.stock = stock
    } else {
      items.value.push({ ...product, cantidad: amount })
    }
    return { success: true }
  }

  function setQuantity(productId, quantity) {
    const item = items.value.find((entry) => entry.id_producto === productId)
    if (!item) return
    const nextQuantity = Math.trunc(Number(quantity))
    if (nextQuantity < 1) return removeItem(productId)
    item.cantidad = Math.min(nextQuantity, Number(item.stock))
  }
  function removeItem(productId) { items.value = items.value.filter((item) => item.id_producto !== productId) }
  function clearCart() { items.value = [] }

  return { items, isOpen, itemCount, total, addItem, setQuantity, removeItem, clearCart }
})
