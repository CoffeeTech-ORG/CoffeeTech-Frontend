import { defineStore } from 'pinia';
import axios from 'axios';

// Define the structure of individual raw data records from the API
export interface RawDataRecord {
  id: number;
  timestamp: string;
  airHumidityPercent: number;
  celciusGradeTemperature: number;
  soilHumidityPercent: number;
  precipitationDetected: number; // Is 0 or 1
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  deviceHubId?: string; // Make sure your API returns this for each record
  // Add any other fields your API might return for a data record
}

// Interface for the data points used by the old aggregated arrays (can be kept if used elsewhere)
interface SensorDataPoint {
  value: number;
  timestamp: string;
}

interface SensorState {
  // These aggregated arrays can be kept if you have a use case for global trends,
  // or removed if all charting will be per-device.
  humidity: SensorDataPoint[];
  temperature: SensorDataPoint[];
  precipitation: SensorDataPoint[];
  soilMoisture: SensorDataPoint[];
  nitrogen: SensorDataPoint[];
  phosphorus: SensorDataPoint[];
  potassium: SensorDataPoint[];

  allRecords: RawDataRecord[]; // Store all raw records fetched from the API
  loading: boolean;
  error: string | null;
  updateInterval: number | null;
}

export const useSensorsStore = defineStore('sensors', {
  state: (): SensorState => ({
    humidity: [],
    temperature: [],
    precipitation: [],
    soilMoisture: [],
    nitrogen: [],
    phosphorus: [],
    potassium: [],
    allRecords: [], // Initialize raw records array
    loading: false,
    error: null,
    updateInterval: null,
  }),

  actions: {
    async fetchSensorData() {
      try {
        this.loading = true;
        this.error = null; // Reset error on new fetch
        const response = await axios.get(
          'https://coffeetech-netcoreappweb-f6hwc3fph9hndhhg.centralus-01.azurewebsites.net/api/v1/data-records',
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        console.log('Raw Data Records fetched by useSensorsStore:', response.data);
        this.allRecords = response.data as RawDataRecord[]; // Store all raw records

        // Optional: Populate aggregated arrays if they are still needed for some other purpose.
        // Ensure your API response structure matches these property names.
        // Example for humidity (adapt for others if keeping these global arrays):
        /*
        this.humidity = this.allRecords.map((record) => ({
          value: record.airHumidityPercent,
          timestamp: record.timestamp,
        }));
        this.temperature = this.allRecords.map((record) => ({
            value: record.celciusGradeTemperature,
            timestamp: record.timestamp,
        }));
        // ... and so on for other sensor types if you need these global arrays.
        */

      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch sensor data';
        console.error("Error fetching sensor data:", error);
      } finally {
        this.loading = false;
      }
    },

    startRealtimeUpdates(interval = 30000) { // e.g., 30 seconds
      this.stopRealtimeUpdates(); // Clear existing interval if any
      this.fetchSensorData(); // Fetch immediately
      this.updateInterval = setInterval(() => {
        this.fetchSensorData();
      }, interval) as unknown as number;
    },

    stopRealtimeUpdates() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
    },
  },

  getters: {
    /**
     * Gets data for a specific device and sensor type, sorted for charting.
     * @param state Pinia state
     * @returns A function that takes deviceHubId, sensorProperty key, and limit,
     *          and returns an array of { value: number, timestamp: string }
     */
    getDeviceDataByType: (state) => {
      return (
        deviceHubId: string,
        sensorProperty: keyof RawDataRecord, // e.g., 'celciusGradeTemperature'
        limit: number = 15 // Number of latest records to return for the chart
      ): { value: number; timestamp: string }[] => {
        if (!state.allRecords || state.allRecords.length === 0) {
          return [];
        }
        return state.allRecords
          .filter(
            (record) =>
              record.deviceHubId === deviceHubId &&
              record[sensorProperty] !== undefined &&
              record[sensorProperty] !== null
          )
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) // Sort: oldest to newest for chart
          .slice(-limit) // Take the last 'limit' records (latest if sorted ascending by time)
          .map((record) => ({
            value: record[sensorProperty] as number, // Type assertion
            timestamp: record.timestamp,
          }));
      };
    },
  },
});