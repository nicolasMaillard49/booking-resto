<template>
  <div class="max-w-2xl mx-auto px-6 py-16">
    <h1 class="font-display text-4xl md:text-5xl text-center mb-12 tracking-tight">Réserver une table</h1>

    <div v-if="!result" class="space-y-10">
      <div>
        <label class="block text-sm font-medium mb-3">Nombre de couverts</label>
        <div class="flex gap-2 flex-wrap">
          <button v-for="n in [1,2,3,4,5,6,7]" :key="n"
            type="button"
            @click="partySize = n"
            :class="['px-4 py-2 border', partySize === n ? 'bg-ink text-canvas border-ink' : 'border-line/20 hover:border-line/40']">
            {{ n }}
          </button>
          <input v-model.number="partySize" type="number" min="8" max="50" class="px-3 py-2 border border-line/20 w-24 bg-canvas" placeholder="8+" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-3">Date</label>
        <input v-model="date" type="date" :min="todayISO" class="px-3 py-2 border border-line/20 bg-canvas" />
      </div>

      <div>
        <label class="block text-sm font-medium mb-3">Créneau</label>
        <div v-if="loadingSlots" class="text-muted">Chargement…</div>
        <div v-else-if="!slotsByWindow.length" class="text-muted">Pas de créneaux disponibles à cette date.</div>
        <div v-else class="space-y-5">
          <div v-for="g in slotsByWindow" :key="g.label">
            <p class="text-xs text-muted uppercase tracking-wider mb-2">{{ g.label }}</p>
            <div class="flex flex-wrap gap-2">
              <button v-for="s in g.slots" :key="s.time"
                type="button"
                @click="selectedSlot = s"
                :class="['px-3 py-2 border', selectedSlot?.time === s.time ? 'bg-ink text-canvas border-ink' : 'border-line/20 hover:border-line/40']">
                {{ s.time }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedSlot" class="space-y-4 pt-4 border-t border-line/10">
        <div>
          <label class="block text-sm font-medium mb-1">Nom</label>
          <input v-model="form.clientName" required type="text" class="w-full px-3 py-2 border border-line/20 bg-canvas" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input v-model="form.clientEmail" required type="email" class="w-full px-3 py-2 border border-line/20 bg-canvas" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Téléphone</label>
          <input v-model="form.clientPhone" required type="tel" class="w-full px-3 py-2 border border-line/20 bg-canvas" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Notes (allergies, occasion…)</label>
          <textarea v-model="form.notes" rows="3" class="w-full px-3 py-2 border border-line/20 bg-canvas"></textarea>
        </div>
        <button @click="submit" :disabled="submitting" class="w-full px-6 py-3 bg-ink text-canvas hover:bg-muted transition disabled:opacity-50">
          {{ submitting ? 'Envoi…' : 'Confirmer la réservation' }}
        </button>
        <p v-if="error" class="text-red-700">{{ error }}</p>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <h2 class="font-display text-3xl mb-4 tracking-tight">{{ result.status === 'CONFIRMED' ? 'Votre table est confirmée' : 'Demande reçue' }}</h2>
      <p class="text-muted">{{ result.status === 'CONFIRMED' ? 'Un email de confirmation vient de vous être envoyé.' : 'Nous validons votre demande sous 24h. Vous recevrez un email.' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

const flow = useReservationFlow()
const { partySize, date, slotsByWindow, selectedSlot, loadingSlots, fetchSlots, form, submit, submitting, result, error } = flow
const todayISO = new Date().toISOString().slice(0, 10)

onMounted(fetchSlots)
</script>
