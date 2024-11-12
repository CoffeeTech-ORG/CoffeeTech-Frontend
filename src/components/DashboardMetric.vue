<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  value: number
  unit: string
  trend?: 'up' | 'down' | 'stable'
}>()

const trendColor = computed(() => {
  switch (props.trend) {
    case 'up':
      return 'text-green-500'
    case 'down':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
})

const formattedValue = computed(() => {
  return new Intl.NumberFormat().format(props.value)
})
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
    <div class="mt-2 flex items-baseline">
      <p class="text-4xl font-semibold text-gray-900">{{ formattedValue }}</p>
      <p class="ml-2 text-sm font-medium text-gray-500">{{ unit }}</p>
    </div>
    <div v-if="trend" class="mt-2 flex items-center">
      <span :class="[trendColor, 'text-sm font-medium']">
        {{ trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→' }}
        {{ trend.charAt(0).toUpperCase() + trend.slice(1) }}
      </span>
    </div>
  </div>
</template>
