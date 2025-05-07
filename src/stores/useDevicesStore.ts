import { defineStore } from 'pinia';
import axios from 'axios';

export interface Device {
  id: number;
  dataRecordId: number;
  deviceHubId: string;
}

interface DevicesState {
  devices: Device[];
  loading: boolean;
  error: string | null;
}

export const useDevicesStore = defineStore('devices', {
  state: (): DevicesState => ({
    devices: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchDevices() {
      try {
        this.loading = true;
        const response = await axios.get(
          'https://coffeetech-netcoreappweb-f6hwc3fph9hndhhg.centralus-01.azurewebsites.net/api/v1/devices',
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        this.devices = response.data.map((device: any) => ({
          id: device.id,
          dataRecordId: device.dataRecordId,
          deviceHubId: device.deviceHubId,
        }));
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch devices';
      } finally {
        this.loading = false;
      }
    },
    
    getDeviceById(id: number): Device | undefined {
      return this.devices.find(device => device.id === id);
    },
    
    getDevicesByDataRecordId(dataRecordId: number): Device[] {
      return this.devices.filter(device => device.dataRecordId === dataRecordId);
    }
  },
});