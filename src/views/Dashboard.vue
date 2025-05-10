<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { Farm as FarmFromStore, Section as SectionFromStore, useFarmsStore } from '../stores/farms';
import { useSectionsStore } from '../stores/sections';
//import { Device as DeviceFromStore, useDevicesStore } from '../stores/useDevicesStore';
import { useAssignmentsStore } from '../stores/useAssignmentsStore';
import { useSensorsStore, RawDataRecord } from '../stores/sensors';
import SensorChart from '../components/SensorChart.vue';
// Import XLSX
import * as XLSX from 'xlsx'; // Import the xlsx library

const router = useRouter();
const authStore = useAuthStore();
const farmsStore = useFarmsStore();
const sectionsStore = useSectionsStore();
const devicesStore = useDevicesStore();
const assignmentsStore = useAssignmentsStore();
const sensorsStore = useSensorsStore();

// --- Local Interface Definitions for Dashboard (keep as is) ---
interface DashboardDevice {
  id: number;
  dataRecordId: number;
  deviceHubId: string;
}

interface DashboardSection {
  id: number;
  name: string;
  type: string;
  devices?: DashboardDevice[];
}

interface DashboardFarm {
  id: number;
  name: string;
  location: string;
  sections?: DashboardSection[];
}
// --- End of Local Interface Definitions ---

const selectedFarm = ref<DashboardFarm | null>(null);
const selectedSection = ref<DashboardSection | null>(null);

const sensorTypesForChart = ref([
  { key: 'celciusGradeTemperature' as keyof RawDataRecord, label: 'Temperature', color: '#FF6384', unit: '°C' },
  { key: 'airHumidityPercent' as keyof RawDataRecord, label: 'Air Humidity', color: '#36A2EB', unit: '%' },
  { key: 'soilHumidityPercent' as keyof RawDataRecord, label: 'Soil Moisture', color: '#FFCE56', unit: '%' },
  { key: 'nitrogen' as keyof RawDataRecord, label: 'Nitrogen', color: '#4BC0C0', unit: 'ppm' },
  { key: 'phosphorus' as keyof RawDataRecord, label: 'Phosphorus', color: '#9966FF', unit: 'ppm' },
  { key: 'potassium' as keyof RawDataRecord, label: 'Potassium', color: '#FF9F40', unit: 'ppm' },
  // { key: 'precipitationDetected' as keyof RawDataRecord, label: 'Precipitation', color: '#C9CBCF', unit: '' },
]);

const isLoadingData = computed(() =>
  farmsStore.loading ||
  sectionsStore.loading ||
  devicesStore.loading ||
  assignmentsStore.loading ||
  sensorsStore.loading
);

onMounted(async () => {
  try {
    await Promise.all([
      farmsStore.fetchFarms(),
      sectionsStore.fetchSections(),
      devicesStore.fetchDevices(),
      assignmentsStore.fetchAssignments(),
    ]);
    sensorsStore.startRealtimeUpdates();
  } catch (error) {
    console.error('Error fetching initial dashboard data:', error);
  }
});

onUnmounted(() => {
  sensorsStore.stopRealtimeUpdates();
});

function normalizeFarm(farm: FarmFromStore): DashboardFarm {
  return {
    id: farm.id,
    name: farm.name,
    location: farm.location,
    sections: farm.sections?.map((section: SectionFromStore): DashboardSection => {
      const deviceIds = assignmentsStore.getDevicesForSection(section.id);
      const devices: DashboardDevice[] = deviceIds
        .map(id => {
          const deviceFromStore = devicesStore.getDeviceById(id);
          if (deviceFromStore) {
            return {
              id: deviceFromStore.id,
              dataRecordId: deviceFromStore.dataRecordId,
              deviceHubId: deviceFromStore.deviceHubId,
            };
          }
          return null;
        })
        .filter(Boolean) as DashboardDevice[];
      
      return {
        id: section.id,
        name: section.name,
        type: section.type || 'Unknown',
        devices: devices,
      };
    }),
  };
}

function selectFarm(farm: FarmFromStore) {
  selectedFarm.value = normalizeFarm(farm);
  selectedSection.value = null;
}

function handleLogout() {
  selectedFarm.value = null;
  selectedSection.value = null;
  authStore.logout();
  router.push('/login');
}

function selectSection(section: DashboardSection) {
  selectedSection.value = section;
}

function goBackToFarms() {
  selectedFarm.value = null;
  selectedSection.value = null;
}

// --- EXCEL DOWNLOAD FUNCTION ---
function downloadExcel() {
  if (sensorsStore.allRecords.length === 0) {
    alert("No sensor data available to download.");
    return;
  }

  // 1. Determine which records to include
  let recordsToExport: RawDataRecord[] = [];
  //let reportTitle = 'All Sensor Data Report';
  let fileName = 'AllSensorDataReport.xlsx';

  if (selectedSection.value && selectedSection.value.devices) {
    // Report for the selected section
    const sectionDeviceHubIds = selectedSection.value.devices.map(d => d.deviceHubId);
    recordsToExport = sensorsStore.allRecords.filter(record => 
      record.deviceHubId && sectionDeviceHubIds.includes(record.deviceHubId)
    );
    reportTitle = `Sensor Data for Section ${selectedSection.value.name}`;
    fileName = `Section_${selectedSection.value.name.replace(/\s+/g, '_')}_Report.xlsx`;
    if (recordsToExport.length === 0) {
        alert(`No sensor data found for section ${selectedSection.value.name}.`);
        return;
    }
  } else if (selectedFarm.value && selectedFarm.value.sections) {
    // Report for the selected farm (all its sections' devices)
    const farmDeviceHubIds: string[] = [];
    selectedFarm.value.sections.forEach(section => {
        section.devices?.forEach(device => {
            if (device.deviceHubId) farmDeviceHubIds.push(device.deviceHubId);
        });
    });
    const uniqueFarmDeviceHubIds = [...new Set(farmDeviceHubIds)];
    recordsToExport = sensorsStore.allRecords.filter(record => 
      record.deviceHubId && uniqueFarmDeviceHubIds.includes(record.deviceHubId)
    );
    reportTitle = `Sensor Data for Farm ${selectedFarm.value.name}`;
    fileName = `Farm_${selectedFarm.value.name.replace(/\s+/g, '_')}_Report.xlsx`;
     if (recordsToExport.length === 0) {
        alert(`No sensor data found for farm ${selectedFarm.value.name}.`);
        return;
    }
  } else {
    // Report for all data if no specific farm/section is selected
    recordsToExport = [...sensorsStore.allRecords]; // Create a shallow copy
  }

  if (recordsToExport.length === 0) {
    alert("No sensor data available for the current selection.");
    return;
  }

  // 2. Map data to the desired Excel format
  const reportData = recordsToExport.map(record => ({
    'Timestamp': new Date(record.timestamp).toLocaleString(),
    'Device Hub ID': record.deviceHubId || 'N/A',
    'Temperature (°C)': record.celciusGradeTemperature,
    'Air Humidity (%)': record.airHumidityPercent,
    'Soil Humidity (%)': record.soilHumidityPercent,
    'Nitrogen (ppm)': record.nitrogen,
    'Phosphorus (ppm)': record.phosphorus,
    'Potassium (ppm)': record.potassium,
    'Precipitation': record.precipitationDetected === 1 ? 'Detected' : 'Not Detected',
    // Add other fields from RawDataRecord if needed
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(reportData);

  // 3. Set column widths (optional, but good for readability)
  // Adjust wch (width in characters) as needed
  worksheet['!cols'] = [
    { wch: 22 }, // Timestamp
    { wch: 20 }, // Device Hub ID
    { wch: 18 }, // Temperature
    { wch: 18 }, // Air Humidity
    { wch: 18 }, // Soil Humidity
    { wch: 15 }, // Nitrogen
    { wch: 15 }, // Phosphorus
    { wch: 15 }, // Potassium
    { wch: 15 }, // Precipitation
  ];

  // 4. Style header row
  const headerCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1']; // Adjust based on your columns
  headerCells.forEach(cellRef => {
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: "008080" } }, // Teal background
        font: { color: { rgb: "FFFFFF" }, bold: true }, // White, bold text
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
  });

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sensor Data'); // Sheet name

  // 5. Write the file
  XLSX.writeFile(workbook, fileName);
}
// --- END OF EXCEL DOWNLOAD FUNCTION ---

</script>

<template>
  <div class="flex min-h-screen">
    <!-- Navbar lateral (KEEP AS IS) -->
    <aside class="w-64" style="background-color: #008080; color: white; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; height: 100vh; position: fixed; top: 0; left: 0;">
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

        <!-- Esta en proceso lo de settings no esta dentro del core -->
        <!--
        <router-link to="/settings" class="flex items-center justify-center text-white hover:text-gray-300 transition-colors duration-200 w-full">
          <i class="fas fa-cog mr-2"></i>
          <span>Settings</span>
        </router-link>
        -->

        <!-- Add Download Button to Sidebar -->
        <button @click="downloadExcel" class="flex items-center justify-center text-white hover:text-gray-300 transition-colors duration-200 w-full mt-4 py-2 px-4 rounded hover:bg-teal-700">
          <i class="fas fa-file-excel mr-2"></i>
          <span>Download Report</span>
        </button>
      </nav>
      <div class="mt-auto w-full">
        <button @click="handleLogout" class="flex items-center justify-center text-white hover:text-gray-300 transition-colors duration-200 w-full">
          <i class="fas fa-sign-out-alt mr-2"></i>
          <span>⍇ Logout</span>
        </button>
      </div>
    </aside>

    <!-- Contenido principal (KEEP MOSTLY AS IS, just ensure context for button if placed here) -->
    <div class="flex-1 bg-gray-100 ml-64">
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Optional: Download button specific to farm/section context -->
        <!-- 
        <div v-if="selectedFarm || selectedSection" class="mb-4 text-right">
            <button @click="downloadExcel" 
                    class="bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded inline-flex items-center">
              <i class="fas fa-file-excel mr-2"></i>
              Download 
              <span v-if="selectedSection">Section</span>
              <span v-else-if="selectedFarm">Farm</span>
              Report
            </button>
        </div>
        -->

        <div v-if="isLoadingData && !selectedFarm" class="text-center py-8">
          <p class="text-gray-600 text-xl">Cargando datos maestros...</p>
        </div>

        <!-- Farm Selection (KEEP AS IS) -->
        <div v-else-if="!selectedFarm">
          <h2 class="text-3xl font-semibold mb-6 text-gray-800">Farms Dashboard</h2>
          <p class="text-gray-600 mb-8">Select a farm to view its sections and sensor data.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="farm in farmsStore.farms"
              :key="farm.id"
              class="bg-white shadow-lg rounded-xl p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1"
              @click="selectFarm(farm)"
            >
              <h3 class="text-xl font-bold text-teal-700 mb-2">{{ farm.name }}</h3>
              <p class="text-gray-500"><i class="fas fa-map-marker-alt mr-2 text-teal-500"></i>{{ farm.location }}</p>
              <p class="text-gray-500 mt-2">
                <i class="fas fa-th-large mr-2 text-teal-500"></i>Sections: {{ farm.sections?.length || 0 }}
              </p>
            </div>
          </div>
        </div>

        <!-- Sections and Charts View (when a farm is selected) (KEEP AS IS) -->
        <div v-else>
          <button @click="goBackToFarms" class="mb-6 text-teal-600 hover:text-teal-800 font-medium transition-colors">
            <i class="fas fa-arrow-left mr-2"></i>← Back to Farms
          </button>
          <h2 class="text-3xl font-semibold text-gray-800 mb-2">{{ selectedFarm.name }}</h2>
          <p class="text-gray-600 mb-6"><i class="fas fa-map-marker-alt mr-2 text-teal-500"></i>{{ selectedFarm.location }}</p>

          <!-- Section Selection (KEEP AS IS) -->
          <div v-if="!selectedSection">
            <h3 class="text-2xl font-medium text-gray-700 mb-4">Sections</h3>
            <div v-if="selectedFarm.sections && selectedFarm.sections.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                v-for="section in selectedFarm.sections"
                :key="section.id"
                class="bg-white shadow-lg rounded-xl p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1"
                @click="selectSection(section)"
              >
                <h4 class="text-lg font-bold text-teal-700 mb-2">{{ section.name }}</h4>
                <p class="text-gray-600">Type: {{ section.type }}</p>
                <p class="text-gray-600 mt-1">
                  Devices: {{ section.devices?.length || 0 }}
                </p>
              </div>
            </div>
            <p v-else class="text-gray-500 italic">No sections available for this farm.</p>
          </div>

          <!-- Charts for Selected Section (KEEP AS IS) -->
          <div v-if="selectedSection">
            <button @click="selectedSection = null" class="mb-6 text-teal-600 hover:text-teal-800 font-medium transition-colors">
              <i class="fas fa-arrow-left mr-2"></i>← Back to Sections
            </button>
            <h3 class="text-2xl font-semibold text-gray-700 mb-4">
              Sensor Data for Section: <span class="text-teal-600">{{ selectedSection.name }}</span>
            </h3>

            <div v-if="sensorsStore.loading && sensorsStore.allRecords.length === 0" class="text-center py-6">
                <p class="text-gray-500">Loading sensor data...</p>
            </div>
            <div v-else-if="!selectedSection.devices || selectedSection.devices.length === 0" class="bg-white shadow rounded-lg p-6 text-center">
              <p class="text-gray-500">No devices assigned to this section to display sensor data.</p>
            </div>
            <div v-else>
              <div v-for="device in selectedSection.devices" :key="device.deviceHubId" class="mb-8 p-6 bg-white shadow-xl rounded-lg">
                <h4 class="text-xl font-semibold text-gray-700 mb-6 border-b pb-3">
                  Device: <span class="text-teal-600">{{ device.deviceHubId }}</span> (ID: {{device.id}})
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div v-for="sensorType in sensorTypesForChart" :key="sensorType.key">
                    <h5 class="text-md font-medium text-gray-600 mb-2">{{ sensorType.label }}</h5>
                    <SensorChart
                      v-if="sensorsStore.getDeviceDataByType(device.deviceHubId, sensorType.key).length > 0"
                      :data="sensorsStore.getDeviceDataByType(device.deviceHubId, sensorType.key).map(d => d.value)"
                      :label="`${sensorType.label} (${sensorType.unit})`"
                      :color="sensorType.color"
                    />
                    <div v-else class="h-64 flex items-center justify-center bg-gray-50 rounded text-gray-400">
                      No data for {{ sensorType.label }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>