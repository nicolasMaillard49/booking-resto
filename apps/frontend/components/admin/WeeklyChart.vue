<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const props = defineProps<{
  data: Array<{ date: string; count: number }>
}>()

// ── Resolve CSS variable at runtime ─────────────────────
function getCSSColor(varName: string, alpha = 1): string {
  if (!import.meta.client) return `rgba(0,0,0,${alpha})`
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName).trim()
  // raw is "128 45 30" (RGB triplet from Tailwind)
  if (raw.includes(',') || raw.startsWith('#') || raw.startsWith('rgb')) return raw
  return `rgba(${raw.replace(/ /g, ', ')}, ${alpha})`
}

// ── Remplir les 7 derniers jours (même ceux sans données) ─
const fullWeek = computed(() => {
  // Indexer les données reçues par date (YYYY-MM-DD)
  const map = new Map<string, number>()
  for (const d of props.data) {
    const key = new Date(d.date).toISOString().slice(0, 10)
    map.set(key, (map.get(key) ?? 0) + d.count)
  }

  // Générer les 7 derniers jours en ordre chronologique
  const days: Array<{ date: Date; count: number }> = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString().slice(0, 10)
    days.push({ date: d, count: map.get(key) ?? 0 })
  }
  return days
})

const labels = computed(() =>
  fullWeek.value.map(d =>
    d.date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
  )
)

const counts = computed(() => fullWeek.value.map(d => d.count))

// ── Tendance (régression linéaire) ──────────────────────
const regression = computed(() => {
  const y = counts.value
  const n = y.length
  if (n < 2) return { slope: 0, intercept: 0 }
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += y[i]; sumXY += i * y[i]; sumX2 += i * i
  }
  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return { slope: 0, intercept: sumY / n }
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
})

const trendData = computed(() =>
  counts.value.map((_, i) => +(regression.value.intercept + regression.value.slope * i).toFixed(1))
)

const trendDir = computed(() => {
  const s = regression.value.slope
  if (s > 0.15) return 'up'
  if (s < -0.15) return 'down'
  return 'flat'
})

const trendColor = computed(() => {
  if (trendDir.value === 'up') return 'rgba(16, 185, 129, 0.5)'
  if (trendDir.value === 'down') return 'rgba(239, 68, 68, 0.5)'
  return 'rgba(163, 163, 163, 0.5)'
})

// ── Chart.js config ─────────────────────────────────────
const primaryColor = computed(() => getCSSColor('--color-primary-500'))
const primaryFaded = computed(() => getCSSColor('--color-primary-500', 0.15))
const primaryGhost = computed(() => getCSSColor('--color-primary-500', 0.01))

const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'Réservations',
      data: counts.value,
      borderColor: primaryColor.value,
      backgroundColor: (ctx: any) => {
        const chart = ctx.chart
        const { ctx: c, chartArea } = chart
        if (!chartArea) return 'transparent'
        const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        g.addColorStop(0, primaryFaded.value)
        g.addColorStop(1, primaryGhost.value)
        return g
      },
      borderWidth: 2.5,
      pointRadius: 5,
      pointHoverRadius: 8,
      pointBackgroundColor: primaryColor.value,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverBorderWidth: 3,
      tension: 0.4,
      fill: true,
    },
    {
      label: 'Tendance',
      data: trendData.value,
      borderColor: trendColor.value,
      borderWidth: 1.5,
      borderDash: [6, 4],
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0,
      fill: false,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    tooltip: {
      backgroundColor: '#1a1a1a',
      titleColor: '#fff',
      bodyColor: '#fff',
      titleFont: { size: 12, weight: '600' as const },
      bodyFont: { size: 12 },
      padding: { top: 8, bottom: 8, left: 12, right: 12 },
      cornerRadius: 8,
      displayColors: false,
      filter: (item: any) => item.datasetIndex === 0,
      callbacks: {
        title: (items: any[]) => {
          const idx = items[0]?.dataIndex
          if (idx == null || !fullWeek.value[idx]) return ''
          return fullWeek.value[idx].date.toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long',
          })
        },
        label: (item: any) => ` ${item.raw} réservation${item.raw > 1 ? 's' : ''}`,
      },
    },
    legend: { display: false },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#8F8878', font: { size: 11 } },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      grid: { color: '#F4EFE6', drawTicks: false },
      ticks: {
        color: '#8F8878',
        font: { size: 11 },
        stepSize: 1,
        padding: 8,
      },
      border: { display: false },
    },
  },
}
</script>

<template>
  <div class="bg-white rounded-xl border border-neutral-100 p-4 sm:p-6 mb-6 sm:mb-8">
    <div class="flex items-center justify-between mb-4 gap-2">
      <h2 class="font-semibold text-neutral-900">Réservations — 7 derniers jours</h2>
      <span
        :class="[
          'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
          trendDir === 'up' ? 'bg-emerald-50 text-emerald-600' :
          trendDir === 'down' ? 'bg-red-50 text-red-600' :
          'bg-neutral-100 text-neutral-500'
        ]"
      >
        <span v-if="trendDir === 'up'">↗</span>
        <span v-else-if="trendDir === 'down'">↘</span>
        <span v-else>→</span>
        {{ trendDir === 'up' ? 'En hausse' : trendDir === 'down' ? 'En baisse' : 'Stable' }}
      </span>
    </div>

    <div class="h-56 sm:h-64">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
