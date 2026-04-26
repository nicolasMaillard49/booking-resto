export interface Slot { time: string; serviceWindowId: string; serviceWindowLabel: string; date: string }

export function useReservationFlow() {
  const config = useRuntimeConfig()
  const apiUrl = config.public.apiUrl

  const partySize = ref(2)
  const date = ref(new Date().toISOString().slice(0, 10))
  const slots = ref<Slot[]>([])
  const selectedSlot = ref<Slot | null>(null)
  const loadingSlots = ref(false)
  const form = reactive({ clientName: '', clientEmail: '', clientPhone: '', notes: '' })
  const submitting = ref(false)
  const result = ref<null | { status: string; cancelToken: string }>(null)
  const error = ref('')

  async function fetchSlots() {
    loadingSlots.value = true
    try {
      const r = await $fetch<Slot[]>(`${apiUrl}/public/availability-slots`, {
        params: { date: date.value, partySize: partySize.value },
      })
      slots.value = r
      selectedSlot.value = null
    } finally {
      loadingSlots.value = false
    }
  }

  const slotsByWindow = computed(() => {
    const groups: Record<string, { label: string; slots: Slot[] }> = {}
    for (const s of slots.value) {
      ;(groups[s.serviceWindowId] ??= { label: s.serviceWindowLabel, slots: [] }).slots.push(s)
    }
    return Object.values(groups)
  })

  async function submit() {
    if (!selectedSlot.value) return
    submitting.value = true; error.value = ''
    const dateTime = `${date.value}T${selectedSlot.value.time}:00.000Z`
    try {
      const r = await $fetch<{ status: string; cancelToken: string }>(`${apiUrl}/bookings`, {
        method: 'POST',
        body: {
          partySize: partySize.value, date: dateTime,
          clientName: form.clientName, clientEmail: form.clientEmail,
          clientPhone: form.clientPhone, notes: form.notes || undefined,
        },
      })
      result.value = r
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Erreur lors de la création'
    } finally {
      submitting.value = false
    }
  }

  watch([partySize, date], fetchSlots, { immediate: false })

  return { partySize, date, slots, slotsByWindow, selectedSlot, loadingSlots, fetchSlots, form, submit, submitting, result, error }
}
