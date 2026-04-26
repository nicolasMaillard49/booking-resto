<script setup lang="ts">
import type { ServicePublic } from '@booking-resto/shared'

const config = useRuntimeConfig()
const baseUrl = config.public.apiUrl
const toast = useToast()

useSeoMeta({
  title: 'Réservation en ligne',
  robots: 'noindex',
})

const { data: services } = await useAsyncData('services-booking', () =>
  $fetch<ServicePublic[]>(`${baseUrl}/public/services`).catch(() => [])
)

// ── État du wizard ────────────────────────────────────────
const step = ref(1)
const selectedService = ref<ServicePublic | null>(null)
const selectedDate = ref<string>('')
const selectedTime = ref<string>('')
const isSubmitting = ref(false)

const form = reactive({
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  notes: '',
})

function selectService(service: ServicePublic) {
  selectedService.value = service
  step.value = 2
}

function selectSlot(date: string, time: string) {
  selectedDate.value = date
  selectedTime.value = time
  step.value = 3
}

async function submitBooking() {
  if (!selectedService.value || !selectedDate.value || !selectedTime.value) {
    toast.error('Veuillez compléter toutes les étapes')
    return
  }

  isSubmitting.value = true

  try {
    const [year, month, day] = selectedDate.value.split('-').map(Number)
    const [hour, min] = selectedTime.value.split(':').map(Number)
    const bookingDate = new Date(year, month - 1, day, hour, min)

    const result = await $fetch<{ id: string; cancelToken: string }>(`${baseUrl}/bookings`, {
      method: 'POST',
      body: {
        serviceId: selectedService.value.id,
        date: bookingDate.toISOString(),
        ...form,
        clientEmail: form.clientEmail.trim(),
      },
    })

    await navigateTo(`/reservation/confirmation/${result.cancelToken}`)
  } catch (error: unknown) {
    const msg = (error as { data?: { message?: string } })?.data?.message
    toast.error(msg || 'Une erreur est survenue. Veuillez réessayer.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50">
    <header class="bg-white border-b border-neutral-100 sticky top-0 z-40">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        <NuxtLink to="/" class="text-neutral-400 hover:text-neutral-600 transition-colors">
          ← Retour
        </NuxtLink>
        <span class="text-neutral-300">|</span>
        <span class="font-medium text-neutral-700">Réservation</span>
      </div>
    </header>

    <div class="max-w-2xl mx-auto px-4 py-8">
      <div class="flex items-center justify-center gap-2 mb-8">
        <div v-for="i in 3" :key="i" class="flex items-center gap-2">
          <div
            :class="[
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
              step > i ? 'bg-green-500 text-white' :
              step === i ? 'bg-primary-600 text-white' :
              'bg-neutral-200 text-neutral-500'
            ]"
          >
            <span v-if="step > i">✓</span>
            <span v-else>{{ i }}</span>
          </div>
          <span
            :class="['text-sm', step >= i ? 'text-neutral-700 font-medium' : 'text-neutral-400']"
          >
            {{ i === 1 ? 'Prestation' : i === 2 ? 'Créneau' : 'Coordonnées' }}
          </span>
          <div v-if="i < 3" class="w-8 h-px bg-neutral-200" />
        </div>
      </div>

      <div v-if="step === 1" class="animate-fade-in">
        <h1 class="text-2xl font-bold text-neutral-900 mb-6">Choisissez une prestation</h1>

        <div v-if="!services?.length" class="text-center py-12 text-neutral-400">
          Aucune prestation disponible
        </div>

        <div v-else class="space-y-3">
          <ServiceCard
            v-for="service in services"
            :key="service.id"
            :service="service"
            :interactive="true"
            @click="selectService(service)"
          />
        </div>
      </div>

      <div v-else-if="step === 2" class="animate-fade-in">
        <div class="flex items-center gap-3 mb-6">
          <button @click="step = 1" class="text-primary-600 hover:underline text-sm">← Modifier</button>
          <h1 class="text-2xl font-bold text-neutral-900">Choisissez un créneau</h1>
        </div>

        <div class="bg-primary-50 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p class="font-semibold text-neutral-800">{{ selectedService?.name }}</p>
            <p class="text-sm text-neutral-500">{{ selectedService?.duration }} min · {{ selectedService?.price }} €</p>
          </div>
          <button @click="step = 1" class="text-sm text-primary-600 hover:underline">Changer</button>
        </div>

        <SlotPicker
          :service-duration="selectedService?.duration"
          @select="selectSlot"
        />
      </div>

      <div v-else-if="step === 3" class="animate-fade-in">
        <div class="flex items-center gap-3 mb-6">
          <button @click="step = 2" class="text-primary-600 hover:underline text-sm">← Modifier</button>
          <h1 class="text-2xl font-bold text-neutral-900">Vos informations</h1>
        </div>

        <div class="bg-primary-50 rounded-xl p-4 mb-6">
          <p class="font-semibold text-neutral-800">{{ selectedService?.name }}</p>
          <p class="text-neutral-600 text-sm">
            {{ new Date(selectedDate + 'T' + selectedTime).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) }}
            à {{ selectedTime }}
          </p>
        </div>

        <form @submit.prevent="submitBooking" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1" for="clientName">
              Nom complet *
            </label>
            <input
              id="clientName"
              v-model="form.clientName"
              type="text"
              required
              maxlength="100"
              autocomplete="name"
              placeholder="Marie Dupont"
              class="w-full border border-neutral-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1" for="clientEmail">
              Email *
            </label>
            <input
              id="clientEmail"
              v-model="form.clientEmail"
              type="email"
              required
              autocomplete="email"
              placeholder="marie@example.com"
              class="w-full border border-neutral-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
            />
            <p class="text-xs text-neutral-400 mt-1">La confirmation vous sera envoyée par email</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1" for="clientPhone">
              Téléphone *
            </label>
            <input
              id="clientPhone"
              v-model="form.clientPhone"
              type="tel"
              required
              autocomplete="tel"
              placeholder="06 12 34 56 78"
              class="w-full border border-neutral-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1" for="notes">
              Note (optionnel)
            </label>
            <textarea
              id="notes"
              v-model="form.notes"
              rows="3"
              maxlength="500"
              placeholder="Une demande particulière ?"
              class="w-full border border-neutral-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition resize-none"
            />
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg transition-colors mt-2"
          >
            <span v-if="isSubmitting">Réservation en cours...</span>
            <span v-else>Confirmer le rendez-vous</span>
          </button>

          <p class="text-xs text-neutral-400 text-center">
            En confirmant, vous acceptez d'être contacté(e) pour ce rendez-vous.
            Annulation gratuite jusqu'à 2h avant.
          </p>
        </form>
      </div>
    </div>

    <ToastContainer />
  </div>
</template>
