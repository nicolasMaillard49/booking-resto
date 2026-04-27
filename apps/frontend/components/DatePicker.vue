<template>
  <div class="relative inline-block w-full" ref="rootRef">
    <button
      type="button"
      @click="open = !open"
      class="w-full px-4 py-3 border text-left flex items-center justify-between gap-3 transition"
      :class="dark ? 'hover:border-white/40' : 'hover:border-neutral-400'"
      :style="dark
        ? 'border-color: rgba(255,255,255,0.2); background-color: rgba(255,255,255,0.05); color: #ffffff;'
        : 'border-color: #cccccc; background-color: #ffffff; color: #111111;'"
    >
      <span :class="modelValue ? '' : 'opacity-50'">{{ displayValue }}</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
        <rect x="3" y="5" width="18" height="16" rx="0" />
        <path d="M3 9h18M8 3v4M16 3v4" />
      </svg>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/30"
        @click="open = false"
      >
        <div
          class="absolute"
          :style="popoverStyle"
          @click.stop
        >
          <div class="w-[320px] bg-white shadow-2xl border" style="border-color: #e5e5e5;">
            <!-- En-tête mois/année + nav -->
            <div class="flex items-center justify-between px-4 py-3 border-b" style="border-color: #e5e5e5; background-color: #1f1f1f;">
              <button type="button" @click="changeMonth(-1)" class="w-9 h-9 flex items-center justify-center hover:opacity-70 transition" style="color: #ffffff;">‹</button>
              <p class="font-display tracking-extra-wide uppercase text-sm" style="color: #ffffff;">{{ monthLabel }} {{ viewYear }}</p>
              <button type="button" @click="changeMonth(1)" class="w-9 h-9 flex items-center justify-center hover:opacity-70 transition" style="color: #ffffff;">›</button>
            </div>

            <!-- Jours de la semaine -->
            <div class="grid grid-cols-7 px-2 pt-3 pb-1">
              <span v-for="d in weekdays" :key="d" class="text-center text-[10px] uppercase tracking-wider" style="color: #999999;">{{ d }}</span>
            </div>

            <!-- Grille jours -->
            <div class="grid grid-cols-7 gap-1 px-2 pb-3">
              <button
                v-for="(d, i) in days" :key="i"
                type="button"
                :disabled="d.disabled"
                @click="select(d)"
                :class="[
                  'h-9 text-sm transition flex items-center justify-center',
                  d.outside ? 'opacity-30' : '',
                  d.disabled ? 'cursor-not-allowed opacity-25' : 'hover:bg-neutral-100',
                  d.selected ? 'font-bold' : '',
                  d.today && !d.selected ? 'border' : '',
                ]"
                :style="{
                  backgroundColor: d.selected ? '#c39d63' : 'transparent',
                  color: d.selected ? '#ffffff' : (d.outside ? '#999' : '#111'),
                  borderColor: d.today && !d.selected ? '#c39d63' : 'transparent',
                }"
              >
                {{ d.day }}
              </button>
            </div>

            <div class="flex justify-between items-center px-4 py-3 border-t" style="border-color: #e5e5e5;">
              <button type="button" @click="selectToday" class="text-xs uppercase tracking-wider hover:opacity-70" style="color: #c39d63;">Aujourd'hui</button>
              <button type="button" @click="open = false" class="text-xs uppercase tracking-wider hover:opacity-70" style="color: #666666;">Fermer</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  min?: string         // YYYY-MM-DD
  max?: string         // YYYY-MM-DD
  placeholder?: string
  dark?: boolean
}>(), {
  placeholder: 'Choisir une date',
  dark: false,
})
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)
const popoverStyle = ref<Record<string, string>>({})

const today = new Date()
const todayKey = isoFromDate(today)

const initial = props.modelValue ? dateFromIso(props.modelValue) : today
const viewYear = ref(initial.getFullYear())
const viewMonth = ref(initial.getMonth())

const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const weekdays = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

const monthLabel = computed(() => months[viewMonth.value])

interface DayCell { day: number; key: string; outside: boolean; today: boolean; selected: boolean; disabled: boolean }

const days = computed<DayCell[]>(() => {
  const y = viewYear.value, m = viewMonth.value
  const first = new Date(y, m, 1)
  // Lundi = 0
  const startOffset = (first.getDay() + 6) % 7
  const lastDayOfPrev = new Date(y, m, 0).getDate()
  const daysInMonth = new Date(y, m + 1, 0).getDate()

  const cells: DayCell[] = []
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(y, m - 1, lastDayOfPrev - i)
    cells.push(buildCell(d, true))
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(buildCell(new Date(y, m, i), false))
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const next = cells.length - (startOffset + daysInMonth) + 1
    cells.push(buildCell(new Date(y, m + 1, next), true))
    if (cells.length >= 42) break
  }
  return cells
})

function buildCell(d: Date, outside: boolean): DayCell {
  const key = isoFromDate(d)
  return {
    day: d.getDate(),
    key,
    outside,
    today: key === todayKey,
    selected: key === props.modelValue,
    disabled:
      (props.min && key < props.min) || (props.max && key > props.max) ||
      false,
  }
}

function changeMonth(delta: number) {
  const d = new Date(viewYear.value, viewMonth.value + delta, 1)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
}

function select(cell: DayCell) {
  if (cell.disabled) return
  emit('update:modelValue', cell.key)
  open.value = false
}

function selectToday() {
  const d = new Date()
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
  emit('update:modelValue', isoFromDate(d))
  open.value = false
}

function isoFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function dateFromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const displayValue = computed(() => {
  if (!props.modelValue) return props.placeholder
  const d = dateFromIso(props.modelValue)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
})

// Positionner le popover sous le bouton
watch(open, (v) => {
  if (!v) return
  nextTick(() => {
    const btn = rootRef.value?.querySelector('button')
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const viewportH = window.innerHeight
    const top = r.bottom + 8
    const showAbove = top + 380 > viewportH
    popoverStyle.value = {
      top: showAbove ? `${r.top - 380 - 8}px` : `${top}px`,
      left: `${Math.max(8, Math.min(r.left, window.innerWidth - 328))}px`,
    }
  })
})

// Resync vue interne quand modelValue change de l'extérieur
watch(() => props.modelValue, (v) => {
  if (!v) return
  const d = dateFromIso(v)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
})
</script>
