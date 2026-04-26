<script setup lang="ts">
const config = useRuntimeConfig()
const baseUrl = config.public.apiUrl
const toast = useToast()

useSeoMeta({ title: 'Laisser un avis', robots: 'noindex' })

const form = reactive({
  author: '',
  rating: 5,
  comment: '',
})
const isSubmitting = ref(false)
const submitted = ref(false)

async function submitReview() {
  isSubmitting.value = true
  try {
    await $fetch(`${baseUrl}/reviews`, {
      method: 'POST',
      body: { ...form },
    })
    submitted.value = true
  } catch {
    toast.error('Erreur lors de l\'envoi. Réessayez.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full">

      <div v-if="submitted" class="text-center">
        <div class="text-4xl mb-4">🙏</div>
        <h1 class="text-2xl font-bold text-neutral-900 mb-3">Merci pour votre avis !</h1>
        <p class="text-neutral-600 mb-6">Il sera publié après modération.</p>
        <NuxtLink to="/" class="text-primary-600 hover:underline">Retour à l'accueil</NuxtLink>
      </div>

      <form v-else @submit.prevent="submitReview">
        <h1 class="text-2xl font-bold text-neutral-900 mb-6">Laisser un avis</h1>

        <div class="mb-4">
          <label class="block text-sm font-medium text-neutral-700 mb-1">Note *</label>
          <div class="flex gap-2">
            <button
              v-for="i in 5"
              :key="i"
              type="button"
              @click="form.rating = i"
              :class="['text-2xl transition-transform hover:scale-110', i <= form.rating ? 'opacity-100' : 'opacity-30']"
            >⭐</button>
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-neutral-700 mb-1" for="author">Votre prénom *</label>
          <input
            id="author"
            v-model="form.author"
            type="text"
            required
            maxlength="50"
            class="w-full border border-neutral-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-neutral-700 mb-1" for="comment">Votre avis</label>
          <textarea
            id="comment"
            v-model="form.comment"
            rows="4"
            maxlength="1000"
            placeholder="Partagez votre expérience..."
            class="w-full border border-neutral-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white py-3 rounded-xl font-medium transition-colors"
        >
          {{ isSubmitting ? 'Envoi...' : 'Publier mon avis' }}
        </button>
      </form>
    </div>
    <ToastContainer />
  </div>
</template>
