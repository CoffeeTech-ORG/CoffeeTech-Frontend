import { defineStore } from 'pinia'
import axios from 'axios'

interface SensorData {
  value: number
  timestamp: string
}

interface SensorState {
  humidity: SensorData[]
  temperature: SensorData[]
  precipitation: SensorData[]
  soilMoisture: SensorData[]
  loading: boolean
  error: string | null
  updateInterval: NodeJS.Timer | null
}

export const useSensorsStore = defineStore('sensors', {
  state: (): SensorState => ({
    humidity: [],
    temperature: [],
    precipitation: [],
    soilMoisture: [],
    loading: false,
    error: null,
    updateInterval: null
  }),
  
  actions: {
    async fetchSensorData() {
      try {
        this.loading = true
        const response = await axios.get('https://coffeetech-api-netcore.azurewebsites.net/api/sensors/data', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        this.humidity = response.data.humidity
        this.temperature = response.data.temperature
        this.precipitation = response.data.precipitation
        this.soilMoisture = response.data.soilMoisture
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch sensor data'
      } finally {
        this.loading = false
      }
    },

    startRealtimeUpdates(interval = 5000) {
      this.stopRealtimeUpdates()
      this.updateInterval = setInterval(() => {
        this.fetchSensorData()
      }, interval)
    },

    stopRealtimeUpdates() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval)
        this.updateInterval = null
      }
    }
  }
})