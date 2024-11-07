import { defineStore } from 'pinia'
import axios from 'axios'

interface User {
  id: string
  email: string
  username: string
  name?: string
}

interface AuthState {
  user: User | null
  token: string
  loading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: localStorage.getItem('token') || '',
    loading: false,
    error: null
  }),
  
  actions: {
    async login(email: string, password: string) {
      try {
        this.loading = true
        this.error = null
        const response = await axios.post('https://coffeetech-api-netcore.azurewebsites.net/api/v1/authentication/sign-in', {
          email,
          password
        })
        
        this.token = response.data.token || '' // Asegura que token sea string
        localStorage.setItem('token', this.token)
        this.user = response.data.user
        return true
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Invalid credentials'
        return false
      } finally {
        this.loading = false
      }
    },

    async register(username: string, email: string, password: string) {
      try {
        this.loading = true
        this.error = null
        await axios.post('https://coffeetech-api-netcore.azurewebsites.net/api/v1/authentication/sign-up', {
          username,
          email,
          rolId: 1,
          password
        })
        return true
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Registration failed'
        return false
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.user = null
      this.token = '' // Resetea el token a una cadena vacía
      this.error = null
      localStorage.removeItem('token')
    }
  }
})
