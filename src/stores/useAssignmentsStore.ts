import { defineStore } from 'pinia';
import axios from 'axios';

export interface Assignment {
  id: number;
  sectionId: number;
  deviceId: number;
}

interface AssignmentsState {
  assignments: Assignment[];
  loading: boolean;
  error: string | null;
}

export const useAssignmentsStore = defineStore('assignments', {
  state: (): AssignmentsState => ({
    assignments: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchAssignments() {
      try {
        this.loading = true;
        const response = await axios.get(
          'https://coffeetech-netcoreappweb-f6hwc3fph9hndhhg.centralus-01.azurewebsites.net/api/v1/assignments',
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        this.assignments = response.data.map((assignment: any) => ({
          id: assignment.id,
          sectionId: assignment.sectionId,
          deviceId: assignment.deviceId,
        }));
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch assignments';
      } finally {
        this.loading = false;
      }
    },
    
    getDevicesForSection(sectionId: number): number[] {
      return this.assignments
        .filter(assignment => assignment.sectionId === sectionId)
        .map(assignment => assignment.deviceId);
    },
    
    getSectionForDevice(deviceId: number): number | undefined {
      const assignment = this.assignments.find(a => a.deviceId === deviceId);
      return assignment?.sectionId;
    }
  },
});