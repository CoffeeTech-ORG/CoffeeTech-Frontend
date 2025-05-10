import { defineStore } from 'pinia';
import axios from 'axios';

export interface Section {
  id: number;
  name: string;
  farmId?: number;
  type: string;
}

interface SectionsState {
  sections: Section[];
  loading: boolean;
  error: string | null;
}

export const useSectionsStore = defineStore('sections', {
  state: (): SectionsState => ({
    sections: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchSections() {
      try {
        this.loading = true;
        const response = await axios.get(
          'https://coffeetech-netcoreappweb-f6hwc3fph9hndhhg.centralus-01.azurewebsites.net/api/v1/sections',
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        this.sections = response.data.map((section: any) => ({
          id: section.id,
          name: section.name,
          farmId: section.farmId,
          type: section.type || 'Unknown', // Valor por defecto para type
        }));
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch sections';
      } finally {
        this.loading = false;
      }
    },
  },
});