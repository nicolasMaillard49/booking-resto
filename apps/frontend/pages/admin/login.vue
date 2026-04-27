<script setup lang="ts">
import { CalendarDays, AlertTriangle } from 'lucide-vue-next'

definePageMeta({ layout: 'admin-auth' })

useSeoMeta({ robots: 'noindex' })

const { login } = useAuth()

const form = reactive({ email: '', password: '' })
const isLoading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  isLoading.value = true
  try {
    await login(form.email, form.password)
    await navigateTo('/admin')
  } catch (error: unknown) {
    errorMsg.value = (error as { data?: { message?: string } })?.data?.message || 'Identifiants invalides'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="bg-white shadow-sm p-8 w-full max-w-sm">
    <div class="text-center mb-8">
      <div class="mx-auto w-12 h-12 bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
        <CalendarDays :size="24" :stroke-width="1.8" />
      </div>
      <h1 class="text-2xl font-bold text-neutral-900">Connexion Admin</h1>
      <p class="text-neutral-400 text-sm mt-1">Booking Pro</p>
    </div>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-1" for="email">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          required
          autocomplete="email"
          placeholder="admin@salon-emma.fr"
          class="w-full border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-1" for="password">Mot de passe</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          required
          autocomplete="current-password"
          placeholder="••••••••"
          class="w-full border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
        />
      </div>

      <div v-if="errorMsg" class="bg-red-50 text-red-600 text-sm px-4 py-3 flex items-center gap-2">
        <AlertTriangle :size="16" class="shrink-0" /> {{ errorMsg }}
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white py-3 font-semibold transition-colors mt-2"
      >
        {{ isLoading ? 'Connexion...' : 'Se connecter' }}
      </button>
    </form>
  </div>
</template>
