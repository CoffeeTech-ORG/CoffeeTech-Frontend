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
  updateInterval: number | null
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
        const response = await axios.get('https://coffeetech-api-netcore.azurewebsites.net/api/v1/data-records', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })
        console.log('Data Records:', response.data)
        
        const dataRecords = response.data
        this.humidity = dataRecords.map((record: any) => ({
          value: record.airHumidityPercent,
          timestamp: record.timestamp
        }))
        this.temperature = dataRecords.map((record: any) => ({
          value: record.celciusGradeTemperature,
          timestamp: record.timestamp
        }))
        this.soilMoisture = dataRecords.map((record: any) => ({
          value: record.soilHumidityPercent,
          timestamp: record.timestamp
        }))
        this.precipitation = dataRecords.map((record: any) => ({
          value: record.precipitationDetected,
          timestamp: record.timestamp
        }))
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
      }, interval) as unknown as number
    },

    stopRealtimeUpdates() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval)
        this.updateInterval = null
      }
    }
  }
})
