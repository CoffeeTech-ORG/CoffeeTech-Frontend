<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const notifications = ref(true)
const emailAlerts = ref(true)
const updateInterval = ref(5)

function handleSave() {
  // Implement settings save logic here
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-primary">CoffeeTech</h1>
          </div>
          <div class="flex items-center space-x-4">
            <router-link to="/dashboard" class="text-gray-600 hover:text-gray-900">Dashboard</router-link>
            <button @click="handleLogout" class="text-gray-600 hover:text-gray-900">Logout</button>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="card">
        <h2 class="text-2xl font-bold mb-6">Settings</h2>

        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-medium mb-4">Notifications</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span>Enable notifications</span>
                <input type="checkbox" v-model="notifications" class="toggle" />
              </div>
              <div class="flex items-center justify-between">
                <span>Email alerts</span>
                <input type="checkbox" v-model="emailAlerts" class="toggle" />
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-medium mb-4">Data Updates</h3>
            <div class="flex items-center space-x-4">
              <label>Update interval (minutes):</label>
              <input
                type="number"
                v-model="updateInterval"
                min="1"
                max="60"
                class="input-field w-24"
              />
            </div>
          </div>

          <div class="pt-4">
            <button @click="handleSave" class="btn-primary">Save Settings</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.toggle {
  @apply h-6 w-11 rounded-full bg-gray-200 cursor-pointer appearance-none checked:bg-primary transition-colors;
}
</style>