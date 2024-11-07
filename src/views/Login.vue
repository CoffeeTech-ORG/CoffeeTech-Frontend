<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')

async function handleLogin() {
  if (!email.value || !password.value) {
    return
  }

  const success = await authStore.login(email.value, password.value)
  if (success) {
    router.push('/dashboard')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Coffee Tech</h2>
        <h3 class="mt-2 text-center text-sm text-gray-600">SIGN IN</h3>
        <p class="mt-2 text-center text-sm text-gray-600">Enter your credentials to access your account</p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label for="email" class="sr-only">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="input-field"
              placeholder="Email"
              :disabled="authStore.loading"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="input-field"
              placeholder="Password"
              :disabled="authStore.loading"
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="text-sm">
            <router-link to="/register" class="text-primary hover:text-opacity-90">
              Create new account
            </router-link>
          </div>
          <div class="text-sm">
            <a href="#" class="text-primary hover:text-opacity-90">
              Forgot password?
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="authStore.loading"
            class="btn-primary w-full"
          >
            {{ authStore.loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </div>

        <p v-if="authStore.error" class="text-red-500 text-center">{{ authStore.error }}</p>
      </form>
    </div>
  </div>
</template>