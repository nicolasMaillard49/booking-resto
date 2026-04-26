<template>
  <div class="max-w-xl mx-auto px-6 py-16 text-center">
    <h1 class="font-display text-4xl mb-6 tracking-tight">Confirmation de réservation</h1>
    <p v-if="loading" class="text-muted">Confirmation en cours…</p>
    <p v-else-if="error" class="text-red-700">{{ error }}</p>
    <p v-else class="text-green-700">Votre réservation est confirmée. À très bientôt !</p>
    <NuxtLink to="/" class="inline-block mt-8 text-sm text-muted hover:text-ink underline">Retour à l'accueil</NuxtLink>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })
const route = useRoute()
const config = useRuntimeConfig()
const loading = ref(true); const error = ref('')
onMounted(async () => {
  try { await $fetch(`${config.public.apiUrl}/bookings/${route.params.token}/confirm`) }
  catch (e: any) { error.value = e?.data?.message ?? 'Lien invalide' }
  finally { loading.value = false }
})
</script>
