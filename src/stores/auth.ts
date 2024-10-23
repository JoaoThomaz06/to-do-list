import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})

export const useAuth = defineStore('Auth', () => {
  const token = ref(localStorage.getItem('token'))

  function setToken(tokenValue: string) {
    localStorage.setItem('token', tokenValue)
    token.value = tokenValue
  }

  function setRefreshToken(tokenValue: string) {
    localStorage.setItem('refreshToken', tokenValue)
    token.value = tokenValue
  }

  function clear() {
    localStorage.removeItem('token')
    token.value = ''
  }

  return {
    token,
    setToken,
    setRefreshToken,
    clear,
  }
})
