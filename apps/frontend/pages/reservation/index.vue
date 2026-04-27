<template>
  <div class="max-w-2xl mx-auto px-6 pt-32 lg:pt-40 pb-16" style="color: #333333;">
    <h1 class="font-display text-4xl md:text-5xl text-center mb-12 tracking-tight" style="color: #333333;">Réserver une table</h1>

    <div v-if="!result" class="space-y-10">
      <div>
        <label class="block text-sm font-medium mb-3" style="color: #333333;">Nombre de couverts</label>
        <div class="flex gap-2 flex-wrap">
          <button v-for="n in [1,2,3,4,5,6,7]" :key="n"
            type="button"
            @click="partySize = n"
            :class="['px-4 py-2 border', partySize === n ? 'border-transparent' : 'hover:border-neutral-400']"
            :style="partySize === n ? 'background-color: #333333; color: #ffffff;' : 'border-color: #cccccc; color: #333333;'">
            {{ n }}
          </button>
          <input v-model.number="partySize" type="number" min="8" max="50" class="px-3 py-2 border w-24" style="border-color: #cccccc; color: #333333; background-color: #ffffff;" placeholder="8+" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-3" style="color: #333333;">Date</label>
        <div class="max-w-sm">
          <DatePicker v-model="date" :min="todayISO" placeholder="Choisir une date" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-3" style="color: #333333;">Créneau</label>
        <div v-if="loadingSlots" style="color: #666666;">Chargement…</div>
        <div v-else-if="!slotsByWindow.length" style="color: #666666;">Pas de créneaux disponibles à cette date.</div>
        <div v-else class="space-y-5">
          <div v-for="g in slotsByWindow" :key="g.label">
            <p class="text-xs uppercase tracking-wider mb-2" style="color: #666666;">{{ g.label }}</p>
            <div class="flex flex-wrap gap-2">
              <button v-for="s in g.slots" :key="s.time"
                type="button"
                @click="selectedSlot = s"
                :class="['px-3 py-2 border', selectedSlot?.time === s.time ? 'border-transparent' : 'hover:border-neutral-400']"
                :style="selectedSlot?.time === s.time ? 'background-color: #333333; color: #ffffff;' : 'border-color: #cccccc; color: #333333;'">
                {{ s.time }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedSlot" class="space-y-4 pt-4 border-t" style="border-color: #e5e5e5;">
        <div>
          <label class="block text-sm font-medium mb-1" style="color: #333333;">Nom</label>
          <input v-model="form.clientName" required type="text" class="w-full px-3 py-2 border" style="border-color: #cccccc; color: #333333; background-color: #ffffff;" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style="color: #333333;">Email</label>
          <input v-model="form.clientEmail" required type="email" class="w-full px-3 py-2 border" style="border-color: #cccccc; color: #333333; background-color: #ffffff;" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style="color: #333333;">Téléphone</label>
          <input v-model="form.clientPhone" required type="tel" class="w-full px-3 py-2 border" style="border-color: #cccccc; color: #333333; background-color: #ffffff;" />
        </div>
        <div class="border-l-4 p-4" style="border-color: #c39d63; background-color: rgba(195,157,99,0.08);">
          <label class="block text-sm font-semibold mb-2 uppercase tracking-wider" style="color: #c39d63;">Allergies, intolérances & régimes</label>
          <p class="text-sm mb-3" style="color: #333333;">
            Pour une expérience parfaite, indiquez ici toute <strong>allergie</strong>, <strong>intolérance</strong> (gluten, lactose, fruits à coque…), régime particulier (végétarien, végan…) ou occasion spéciale (anniversaire…). Notre chef adapte chaque assiette.
          </p>
          <textarea v-model="form.notes" rows="4" placeholder="Ex : allergie aux fruits à coque, sans gluten, anniversaire…" class="w-full px-3 py-2 border" style="border-color: #cccccc; color: #333333; background-color: #ffffff;"></textarea>
        </div>
        <button @click="submit" :disabled="submitting" class="w-full px-6 py-3 transition disabled:opacity-50 uppercase tracking-wider text-sm font-display" style="background-color: #c39d63; color: #ffffff;">
          {{ submitting ? 'Envoi…' : 'Confirmer la réservation' }}
        </button>
        <p v-if="error" style="color: #b91c1c;">{{ error }}</p>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <h2 class="font-display text-3xl mb-4 tracking-tight" style="color: #333333;">{{ result.status === 'CONFIRMED' ? 'Votre table est confirmée' : 'Demande reçue' }}</h2>
      <p style="color: #666666;">{{ result.status === 'CONFIRMED' ? 'Un email de confirmation vient de vous être envoyé.' : 'Nous validons votre demande sous 24h. Vous recevrez un email.' }}</p>
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
