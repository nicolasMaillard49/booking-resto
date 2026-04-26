<script setup lang="ts">
const route = useRoute()
const cancelToken = route.params.cancelToken as string
const config = useRuntimeConfig()
const baseUrl = config.public.apiUrl

useSeoMeta({ title: 'Annuler mon rendez-vous', robots: 'noindex' })

const status = ref<'idle' | 'loading' | 'cancelled' | 'already_cancelled' | 'error'>('idle')
const errorMessage = ref('')

async function confirmCancel() {
  status.value = 'loading'
  try {
    const result = await $fetch<{ status: string }>(`${baseUrl}/bookings/${cancelToken}/cancel`)
    status.value = result.status === 'already_cancelled' ? 'already_cancelled' : 'cancelled'
  } catch (error: unknown) {
    status.value = 'error'
    errorMessage.value = (error as { data?: { message?: string } })?.data?.message || 'Une erreur est survenue'
  }
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">

      <div v-if="status === 'idle'">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span class="text-3xl">⚠️</span>
        </div>
        <h1 class="text-2xl font-bold text-neutral-900 mb-3">Annuler le rendez-vous ?</h1>
        <p class="text-neutral-600 mb-8">Cette action est irréversible. Souhaitez-vous vraiment annuler ?</p>
        <div class="space-y-3">
          <button
            @click="confirmCancel"
            class="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors"
          >
            Oui, annuler le rendez-vous
          </button>
          <NuxtLink to="/" class="block text-neutral-600 hover:text-neutral-900 text-sm">
            Non, garder mon rendez-vous
          </NuxtLink>
        </div>
      </div>

      <div v-else-if="status === 'loading'" class="py-8">
        <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-neutral-500">Annulation en cours...</p>
      </div>

      <div v-else-if="status === 'cancelled'">
        <div class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span class="text-3xl">✓</span>
        </div>
        <h1 class="text-2xl font-bold text-neutral-900 mb-3">Rendez-vous annulé</h1>
        <p class="text-neutral-600 mb-6">Votre rendez-vous a bien été annulé. Vous recevrez une confirmation par email.</p>
        <NuxtLink to="/reservation" class="block w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-medium transition-colors">
          Reprendre rendez-vous
        </NuxtLink>
      </div>

      <div v-else-if="status === 'already_cancelled'">
        <p class="text-neutral-600">Ce rendez-vous a déjà été annulé.</p>
        <NuxtLink to="/" class="block mt-4 text-primary-600 hover:underline">Retour à l'accueil</NuxtLink>
      </div>

      <div v-else>
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span class="text-3xl">✕</span>
        </div>
        <h1 class="text-2xl font-bold text-neutral-900 mb-3">Impossible d'annuler</h1>
        <p class="text-red-600 mb-6">{{ errorMessage }}</p>
        <NuxtLink to="/" class="block w-full bg-primary-600 text-white py-3 rounded-xl font-medium">
          Retour à l'accueil
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
