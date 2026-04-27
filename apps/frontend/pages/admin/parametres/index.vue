<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
const { settings, load, save } = useSettings()
const { success: showToast, error: showError } = useToast()
const local = reactive<Record<string, string>>({})
const loaded = ref(false)
const saving = ref(false)

onMounted(async () => {
  await load()
  Object.assign(local, settings.value)
  loaded.value = true
})

async function onSave() {
  saving.value = true
  try {
    await save(local)
    showToast('Paramètres enregistrés')
  } catch (e) {
    showError(extractError(e))
  } finally {
    saving.value = false
  }
}

function extractError(e: unknown): string {
  if (e && typeof e === 'object' && 'data' in e) {
    const data = (e as { data?: { message?: string; details?: Array<{ message: string }> } }).data
    if (data?.details?.length) {
      return data.details.map(d => d.message).join(' · ')
    }
    return data?.message ?? 'Erreur'
  }
  return e instanceof Error ? e.message : 'Erreur inconnue'
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-neutral-900 mb-6">Paramètres</h1>

    <div v-if="loaded" class="space-y-6 max-w-2xl">
      <section class="bg-white border border-neutral-100 p-5 sm:p-6 space-y-4">
        <h2 class="text-lg font-semibold mb-2">Réservations</h2>
        <div><label class="block text-sm mb-1">Capacité max simultanée (couverts)</label>
          <input v-model="local.capacity_max" type="number" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">Durée moyenne d'un repas (min)</label>
          <input v-model="local.default_meal_duration_min" type="number" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">Seuil auto-confirm (couverts)</label>
          <input v-model="local.auto_confirm_threshold" type="number" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">Réservation au plus tôt (jours)</label>
          <input v-model="local.lookahead_days" type="number" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">Délai minimum avant créneau (heures)</label>
          <input v-model="local.cutoff_hours" type="number" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">Intervalle entre créneaux (min)</label>
          <input v-model="local.slot_interval_min" type="number" class="w-full px-3 py-2 border border-neutral-200" /></div>
      </section>

      <section class="bg-white border border-neutral-100 p-5 sm:p-6 space-y-4">
        <h2 class="text-lg font-semibold mb-2">Page d'accueil</h2>
        <div><label class="block text-sm mb-1">Titre du hero</label>
          <input v-model="local.hero_title" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">Sous-titre du hero</label>
          <input v-model="local.hero_subtitle" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-2">Image du hero</label>
          <AdminImagePicker v-model="local.hero_image_id" section="HERO" /></div>
      </section>

      <section class="bg-white border border-neutral-100 p-5 sm:p-6 space-y-4">
        <h2 class="text-lg font-semibold mb-2">Contact</h2>
        <div><label class="block text-sm mb-1">Nom de l'établissement</label>
          <input v-model="local.brand_name" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">Adresse</label>
          <input v-model="local.contact_address" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">Téléphone</label>
          <input v-model="local.contact_phone" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">Email</label>
          <input v-model="local.contact_email" type="email" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">Lien Google Maps (src embed)</label>
          <input v-model="local.google_maps_embed_url" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">Instagram URL</label>
          <input v-model="local.instagram_url" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-2">Image de fond de la section contact <span class="text-xs text-neutral-400">(optionnel, filtre sombre auto)</span></label>
          <AdminImagePicker v-model="local.contact_bg_image_id" section="OTHER" /></div>
      </section>

      <section class="bg-white border border-neutral-100 p-5 sm:p-6 space-y-4">
        <h2 class="text-lg font-semibold mb-2">SEO</h2>
        <div><label class="block text-sm mb-1">Titre meta accueil</label>
          <input v-model="local.seo_home_title" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">Description meta accueil</label>
          <input v-model="local.seo_home_description" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">Titre meta menu</label>
          <input v-model="local.seo_menu_title" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">Description meta menu</label>
          <input v-model="local.seo_menu_description" class="w-full px-3 py-2 border border-neutral-200" /></div>
      </section>

      <button @click="onSave" :disabled="saving" class="px-6 py-3 bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
        {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
    </div>
  </div>
</template>
