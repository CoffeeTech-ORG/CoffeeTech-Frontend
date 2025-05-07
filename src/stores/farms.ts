import { defineStore } from 'pinia';
import axios from 'axios';

export interface Section {
    id: number;
    name: string;
    type: string;
}

export interface Farm {
    id: number;
    name: string;
    location: string;
    userId?: number;
    sections?: Section[]; 
}

interface FarmsState {
    farms: Farm[];
    loading: boolean;
    error: string | null;
}

export const useFarmsStore = defineStore('farms', {
    state: (): FarmsState => ({
        farms: [],
        loading: false,
        error: null,
    }),

    actions: {
        async fetchFarms() {
            try {
                this.loading = true;
                const response = await axios.get(
                    'https://coffeetech-netcoreappweb-f6hwc3fph9hndhhg.centralus-01.azurewebsites.net/api/v1/farms',
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );
                this.farms = response.data.map((farm: any) => ({
                    id: farm.id,
                    name: farm.name,
                    location: farm.location,
                    userId: farm.userId,
                    sections: [], // Inicializamos las secciones como un array vacío
                }));

                // Fetch sections for each farm
                for (const farm of this.farms) {
                    await this.fetchFarmSections(farm.id);
                }
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Failed to fetch farms';
            } finally {
                this.loading = false;
            }
        },

        async fetchFarmSections(farmId: number) {
            try {
                // Corregido el endpoint para obtener secciones
                const response = await axios.get(
                    `https://coffeetech-netcoreappweb-f6hwc3fph9hndhhg.centralus-01.azurewebsites.net/api/v1/farms/${farmId}/sections`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );
                const farm = this.farms.find((f) => f.id === farmId);
                if (farm) {
                    farm.sections = response.data.map((section: any) => ({
                        id: section.id,
                        name: section.name,
                        type: section.type || 'Unknown', // Añadido type con valor por defecto
                    }));
                }
            } catch (error: any) {
                console.error(
                    `Failed to fetch sections for farm ${farmId}:`,
                    error.response?.data?.message || error.message
                );
            }
        },
    },
});