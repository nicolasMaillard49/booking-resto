export interface Slot { time: string; serviceWindowId: string; serviceWindowLabel: string; date: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[+0-9 .()-]{6,20}$/

interface ValidationErrors {
  clientName?: string
  clientEmail?: string
  clientPhone?: string
}

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
  const fieldErrors = ref<ValidationErrors>({})

  function validate(): boolean {
    const errs: ValidationErrors = {}
    if (form.clientName.trim().length < 2) errs.clientName = 'Nom trop court'
    if (!EMAIL_RE.test(form.clientEmail.trim())) errs.clientEmail = 'Email invalide'
    if (!PHONE_RE.test(form.clientPhone.trim())) errs.clientPhone = 'Téléphone invalide'
    fieldErrors.value = errs
    return Object.keys(errs).length === 0
  }

  async function fetchSlots() {
    loadingSlots.value = true
    error.value = ''
    try {
      const r = await $fetch<Slot[]>(`${apiUrl}/public/availability-slots`, {
        params: { date: date.value, partySize: partySize.value },
      })
      slots.value = r
      selectedSlot.value = null
    } catch (e) {
      error.value = extractError(e)
      slots.value = []
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
    if (!validate()) {
      error.value = 'Merci de corriger les champs en rouge'
      return
    }
    submitting.value = true; error.value = ''
    const dateTime = `${date.value}T${selectedSlot.value.time}:00.000Z`
    try {
      const r = await $fetch<{ status: string; cancelToken: string }>(`${apiUrl}/bookings`, {
        method: 'POST',
        body: {
          partySize: partySize.value, date: dateTime,
          clientName: form.clientName.trim(),
          clientEmail: form.clientEmail.trim(),
          clientPhone: form.clientPhone.trim(),
          notes: form.notes.trim() || undefined,
        },
      })
      result.value = r
    } catch (e) {
      error.value = extractError(e)
      // Si conflit de capacité (résa concurrente), refresh les slots
      if (extractStatusCode(e) === 409) await fetchSlots()
    } finally {
      submitting.value = false
    }
  }

  watch([partySize, date], fetchSlots, { immediate: false })

  return { partySize, date, slots, slotsByWindow, selectedSlot, loadingSlots, fetchSlots, form, submit, submitting, result, error, fieldErrors }
}

function extractError(e: unknown): string {
  if (e && typeof e === 'object' && 'data' in e) {
    const data = (e as { data?: { message?: string } }).data
    return data?.message ?? 'Erreur lors de la création'
  }
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

function extractStatusCode(e: unknown): number | undefined {
  if (e && typeof e === 'object' && 'response' in e) {
    return (e as { response?: { status?: number } }).response?.status
  }
  if (e && typeof e === 'object' && 'data' in e) {
    return (e as { data?: { statusCode?: number } }).data?.statusCode
  }
  return undefined
}
