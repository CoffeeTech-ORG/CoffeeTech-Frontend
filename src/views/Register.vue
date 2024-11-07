<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

async function handleRegister() {
  if (!username.value || !email.value || !password.value || !confirmPassword.value) {
    authStore.error = 'Please fill in all fields'
    return
  }

  if (password.value !== confirmPassword.value) {
    authStore.error = 'Passwords do not match'
    return
  }

  const success = await authStore.register(username.value, email.value, password.value)
  if (success) {
    router.push('/login')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Coffee Tech</h2>
        <h3 class="mt-2 text-center text-sm text-gray-600">SIGN UP</h3>
        <p class="mt-2 text-center text-sm text-gray-600">Create your account</p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label for="username" class="sr-only">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              class="input-field"
              placeholder="Username"
              :disabled="authStore.loading"
            />
          </div>
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
          <div>
            <label for="confirm-password" class="sr-only">Confirm Password</label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              required
              class="input-field"
              placeholder="Confirm Password"
              :disabled="authStore.loading"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="authStore.loading"
            class="btn-primary w-full"
          >
            {{ authStore.loading ? 'Creating account...' : 'Create Account' }}
          </button>
        </div>

        <p v-if="authStore.error" class="text-red-500 text-center">{{ authStore.error }}</p>

        <div class="text-sm text-center">
          Already have an account?
          <router-link to="/login" class="text-primary hover:text-opacity-90">
            Sign in
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>