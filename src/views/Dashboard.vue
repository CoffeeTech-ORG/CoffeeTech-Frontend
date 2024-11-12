<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSensorsStore } from '../stores/sensors'
import SensorChart from '../components/SensorChart.vue'
import * as XLSX from 'xlsx'
import '@fortawesome/fontawesome-free/css/all.css';

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

function downloadExcel() {
  const reportData = sensorsStore.humidity.map((h, index) => ({
    'Air Humidity (%)': h.value,
    'Temperature (°C)': sensorsStore.temperature[index]?.value || null,
    'Soil Humidity (%)': sensorsStore.soilMoisture[index]?.value || null,
    'Precipitation (%)': sensorsStore.precipitation[index]?.value || null,
  }))

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(reportData)

  worksheet['!cols'] = [
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
  ]

  const columnsToStyle = ['A1', 'B1', 'C1', 'D1']
  columnsToStyle.forEach(cell => {
    if (worksheet[cell]) {
      worksheet[cell].s = {
        fill: { fgColor: { rgb: '008080' } },
        font: { color: { rgb: 'FFFFFF' }, bold: true },
      }
    }
  })

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sensor Data Report')

  XLSX.writeFile(workbook, 'SensorDataReport.xlsx')
}

</script>

<template>
  <div class="flex min-h-screen">
    <!-- Navbar lateral -->
    <aside class="w-64" style="background-color: #008080; color: white; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; height: 100vh;">
      <div class="flex flex-col items-center mb-8">
        <img src="/src/assets/logo.png" alt="User Profile" class="rounded-full w-24 h-24 mb-4 border-2 border-white">
        <h2 class="text-2xl font-semibold">Cooperativa</h2>
        <p class="text-sm text-gray-300">Manager</p>
      </div>
      <nav class="flex flex-col space-y-4 w-full items-center">
        <router-link to="/dashboard" class="flex items-center justify-center text-white hover:text-gray-300 transition-colors duration-200 w-full">
          <i class="fas fa-tachometer-alt mr-2"></i>
          <span>Dashboard</span>
        </router-link>
        <button @click="downloadExcel" class="flex items-center justify-center text-white hover:text-gray-300 transition-colors duration-200 w-full">
          <i class="fas fa-file-excel mr-2"></i>
          <span>Report</span>
        </button>
        <router-link to="/settings" class="flex items-center justify-center text-white hover:text-gray-300 transition-colors duration-200 w-full">
          <i class="fas fa-cog mr-2"></i>
          <span>Settings</span>
        </router-link>
      </nav>
      <div class="mt-auto w-full">
        <button @click="handleLogout" class="flex items-center justify-center text-white hover:text-gray-300 transition-colors duration-200 w-full">
          <i class="fas fa-sign-out-alt mr-2"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- Contenido principal -->
    <div class="flex-1 bg-background">
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 class="text-2xl font-semibold mb-4">Dashboard</h2>
        <p class="text-gray-600 mb-6">Your summary and sensor data collection activity.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card">
            <h3 class="text-lg font-semibold mb-4">Air Humidity</h3>
            <SensorChart
              :data="sensorsStore.humidity.map(h => h.value)"
              label="Humidity %"
              color="#4A90E2"
            />
          </div>
          <div class="card">
            <h3 class="text-lg font-semibold mb-4">Temperature</h3>
            <SensorChart
              :data="sensorsStore.temperature.map(t => t.value)"
              label="Temperature °C"
              color="#FF6B6B"
            />
          </div>
          <div class="card">
            <h3 class="text-lg font-semibold mb-4">Precipitation</h3>
            <SensorChart
              :data="sensorsStore.precipitation.map(p => p.value)"
              label="Precipitation %"
              color="#4CAF50"
            />
          </div>
          <div class="card">
            <h3 class="text-lg font-semibold mb-4">Soil Moisture</h3>
            <SensorChart
              :data="sensorsStore.soilMoisture.map(sm => sm.value)"
              label="Soil Moisture %"
              color="#FFA726"
            />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
