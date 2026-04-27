<template>
  <form @submit.prevent="submit" class="space-y-5">
    <div>
      <label class="block text-xs uppercase tracking-mega-wide mb-2 text-muted">Nom</label>
      <input v-model="form.name" required type="text" class="w-full px-4 py-3 border border-line bg-canvas text-ink focus:outline-none focus:border-heading tracking-wide" />
    </div>
    <div>
      <label class="block text-xs uppercase tracking-mega-wide mb-2 text-muted">Email</label>
      <input v-model="form.email" required type="email" class="w-full px-4 py-3 border border-line bg-canvas text-ink focus:outline-none focus:border-heading tracking-wide" />
    </div>
    <div>
      <label class="block text-xs uppercase tracking-mega-wide mb-2 text-muted">Message</label>
      <textarea v-model="form.message" required rows="5" class="w-full px-4 py-3 border border-line bg-canvas text-ink focus:outline-none focus:border-heading tracking-wide"></textarea>
    </div>
    <div v-if="captcha">
      <label class="block text-xs uppercase tracking-mega-wide mb-2 text-muted">Pour vérifier : combien font {{ captcha.question }} ?</label>
      <input v-model="form.captchaAnswer" required type="text" class="w-32 px-4 py-3 border border-line bg-canvas text-ink focus:outline-none focus:border-heading tracking-wide" />
    </div>
    <button type="submit" :disabled="submitting" class="px-10 py-4 bg-heading text-canvas hover:bg-ink transition disabled:opacity-50 tracking-wider">
      {{ submitting ? 'Envoi…' : 'Envoyer' }}
    </button>
    <p v-if="success" class="text-green-700 tracking-wide">Message envoyé, merci !</p>
    <p v-if="error" class="text-red-700 tracking-wide">{{ error }}</p>
  </form>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const captcha = ref<{ question: string; token: string } | null>(null)
const form = reactive({ name: '', email: '', message: '', captchaAnswer: '' })
const submitting = ref(false)
const success = ref(false)
const error = ref('')

onMounted(async () => {
  await refreshCaptcha()
})

async function refreshCaptcha() {
  try {
    captcha.value = await $fetch<{ question: string; token: string }>(`${config.public.apiUrl}/contact-messages/captcha`)
  } catch { /* silent */ }
}

async function submit() {
  if (!captcha.value) return
  submitting.value = true; error.value = ''; success.value = false
  try {
    await $fetch(`${config.public.apiUrl}/contact-messages`, {
      method: 'POST',
      body: { ...form, captchaToken: captcha.value.token },
    })
    success.value = true
    Object.assign(form, { name: '', email: '', message: '', captchaAnswer: '' })
  } catch (e) {
    const data = (e as { data?: { message?: string } }).data
    error.value = data?.message ?? "Erreur d'envoi"
  } finally {
    await refreshCaptcha()
    submitting.value = false
  }
}
</script>
