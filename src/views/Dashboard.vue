<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSensorsStore } from '../stores/sensors'
import SensorChart from '../components/SensorChart.vue'

const router = useRouter()
const authStore = useAuthStore()
const sensorsStore = useSensorsStore()

onMounted(async () => {
  await sensorsStore.fetchSensorData()
})

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
            <router-link to="/settings" class="text-gray-600 hover:text-gray-900">Settings</router-link>
            <button @click="handleLogout" class="text-gray-600 hover:text-gray-900">Logout</button>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Air Humidity</h3>
          <SensorChart
            :data="sensorsStore.humidity"
            label="Humidity %"
            color="#4A90E2"
          />
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Temperature</h3>
          <SensorChart
            :data="sensorsStore.temperature"
            label="Temperature °C"
            color="#FF6B6B"
          />
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Precipitation</h3>
          <SensorChart
            :data="sensorsStore.precipitation"
            label="Precipitation %"
            color="#4CAF50"
          />
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Soil Moisture</h3>
          <SensorChart
            :data="sensorsStore.soilMoisture"
            label="Soil Moisture %"
            color="#FFA726"
          />
        </div>
      </div>

      <div class="mt-8 flex justify-end">
        <button class="btn-primary">Generate Report</button>
      </div>
    </main>
  </div>
</template>