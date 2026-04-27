<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
const { settings, load, save } = useSettings()
const { success: showToast, error: showError } = useToast()
const local = reactive<Record<string, string>>({})
const loaded = ref(false)
const saving = ref(false)

// Modals : confirmation avant + succès après
const confirmOpen = ref(false)
const successOpen = ref(false)

onMounted(async () => {
  await load()
  Object.assign(local, settings.value)
  loaded.value = true
})

function askConfirm() { confirmOpen.value = true }
function cancelConfirm() { confirmOpen.value = false }

async function confirmSave() {
  confirmOpen.value = false
  saving.value = true
  try {
    await save(local)
    successOpen.value = true
    showToast('Paramètres enregistrés')
    setTimeout(() => { successOpen.value = false }, 2500)
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
        <div><label class="block text-sm mb-1">URL Google « Laisser un avis » <span class="text-xs text-neutral-400">(envoyée 3h après chaque réservation + bouton public)</span></label>
          <input v-model="local.google_review_url" placeholder="https://g.page/r/…/review" class="w-full px-3 py-2 border border-neutral-200" />
          <p class="text-xs text-neutral-400 mt-1">Récupère cette URL dans <strong>Google Business Profile → Demander des avis</strong>. Si vide, aucun email d'avis ne sera envoyé et le bouton public sera masqué.</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">Note (étoiles)</label>
            <input v-model="local.rating_value" type="number" step="0.1" min="0" max="5" class="w-full px-3 py-2 border border-neutral-200" />
          </div>
          <div>
            <label class="block text-sm mb-1">Nombre d'avis</label>
            <input v-model="local.rating_count" type="number" min="0" class="w-full px-3 py-2 border border-neutral-200" />
          </div>
        </div>
        <div><label class="block text-sm mb-1">Instagram URL</label>
          <input v-model="local.instagram_url" placeholder="https://instagram.com/…" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">Facebook URL</label>
          <input v-model="local.facebook_url" placeholder="https://facebook.com/…" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">TikTok URL</label>
          <input v-model="local.tiktok_url" placeholder="https://tiktok.com/@…" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">X (Twitter) URL</label>
          <input v-model="local.twitter_url" placeholder="https://x.com/…" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">YouTube URL</label>
          <input v-model="local.youtube_url" placeholder="https://youtube.com/@…" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">TripAdvisor URL</label>
          <input v-model="local.tripadvisor_url" placeholder="https://tripadvisor.com/…" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">TheFork URL</label>
          <input v-model="local.thefork_url" placeholder="https://thefork.com/…" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-2">Image de fond de la section contact <span class="text-xs text-neutral-400">(optionnel, filtre sombre auto)</span></label>
          <AdminImagePicker v-model="local.contact_bg_image_id" section="OTHER" /></div>
      </section>

      <section class="bg-white border border-neutral-100 p-5 sm:p-6 space-y-4">
        <h2 class="text-lg font-semibold mb-2">Traduction automatique</h2>
        <div>
          <label class="block text-sm mb-1">Clé API DeepL <span class="text-xs text-neutral-400">(optionnel — auto-traduit FR → EN/ES/IT/DE à chaque enregistrement de section)</span></label>
          <input v-model="local.deepl_api_key" type="password" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx" class="w-full px-3 py-2 border border-neutral-200 font-mono text-sm" />
          <p class="text-xs text-neutral-400 mt-1">
            Crée un compte gratuit sur <a href="https://www.deepl.com/pro-api" target="_blank" rel="noopener" class="underline hover:text-primary-600">deepl.com/pro-api</a> (500 000 caractères / mois offerts).
            Si la clé se termine par <code class="bg-neutral-100 px-1">:fx</code>, c'est une clé Free.
            Tant qu'aucune clé n'est saisie, les traductions doivent être renseignées manuellement.
          </p>
        </div>
      </section>

      <section class="bg-white border border-neutral-100 p-5 sm:p-6 space-y-4">
        <h2 class="text-lg font-semibold mb-2">Page menu</h2>
        <div><label class="block text-sm mb-1">Titre de la page</label>
          <input v-model="local.menu_page_title" class="w-full px-3 py-2 border border-neutral-200" /></div>
        <div><label class="block text-sm mb-1">Description (gras, italique, listes…)</label>
          <AdminRichTextEditor v-model="local.menu_page_description" min-height="120px" /></div>
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

      <button @click="askConfirm" :disabled="saving" class="px-6 py-3 bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
        {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
    </div>

    <!-- Modal de confirmation avant enregistrement -->
    <Teleport to="body">
      <div v-if="confirmOpen" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" @click.self="cancelConfirm">
        <div class="bg-white p-8 max-w-md w-full">
          <h3 class="text-lg font-semibold text-neutral-900 mb-3">Enregistrer les paramètres ?</h3>
          <p class="text-sm text-neutral-600 mb-6">Les modifications seront appliquées immédiatement sur le site public.</p>
          <div class="flex gap-3 justify-end">
            <button type="button" @click="cancelConfirm" class="px-5 py-2.5 border border-neutral-200 text-neutral-700 hover:bg-neutral-50">Annuler</button>
            <button type="button" @click="confirmSave" :disabled="saving" class="px-5 py-2.5 bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">Confirmer</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal de succès après enregistrement -->
    <Teleport to="body">
      <div v-if="successOpen" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" @click.self="successOpen = false">
        <div class="bg-white p-8 max-w-sm w-full text-center">
          <div class="text-5xl mb-3">✓</div>
          <h3 class="text-lg font-semibold text-neutral-900 mb-2">Paramètres enregistrés</h3>
          <p class="text-sm text-neutral-600 mb-6">Les modifications sont en ligne.</p>
          <button type="button" @click="successOpen = false" class="px-5 py-2.5 bg-primary-600 text-white hover:bg-primary-700">Fermer</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
