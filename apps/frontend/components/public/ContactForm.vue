<template>
  <form @submit.prevent="submit" class="space-y-4">
    <div>
      <label class="block text-sm mb-1">Nom</label>
      <input v-model="form.name" required type="text" class="w-full px-3 py-2 border border-line/20 bg-canvas focus:outline-none focus:border-line" />
    </div>
    <div>
      <label class="block text-sm mb-1">Email</label>
      <input v-model="form.email" required type="email" class="w-full px-3 py-2 border border-line/20 bg-canvas focus:outline-none focus:border-line" />
    </div>
    <div>
      <label class="block text-sm mb-1">Message</label>
      <textarea v-model="form.message" required rows="4" class="w-full px-3 py-2 border border-line/20 bg-canvas focus:outline-none focus:border-line"></textarea>
    </div>
    <div v-if="captcha">
      <label class="block text-sm mb-1">Pour vérifier : combien font {{ captcha.question }} ?</label>
      <input v-model="form.captchaAnswer" required type="text" class="w-32 px-3 py-2 border border-line/20 bg-canvas focus:outline-none focus:border-line" />
    </div>
    <button type="submit" :disabled="submitting" class="px-6 py-3 bg-ink text-canvas hover:bg-muted transition disabled:opacity-50">
      {{ submitting ? 'Envoi…' : 'Envoyer' }}
    </button>
    <p v-if="success" class="text-green-700">Message envoyé, merci !</p>
    <p v-if="error" class="text-red-700">{{ error }}</p>
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
  try {
    const r = await $fetch<any>(`${config.public.apiUrl}/contact-messages/captcha`)
    captcha.value = r
  } catch { /* silent */ }
})

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
    // Renouvelle le captcha pour permettre un autre envoi
    const r = await $fetch<any>(`${config.public.apiUrl}/contact-messages/captcha`)
    captcha.value = r
  } catch (e: any) {
    error.value = e?.data?.message ?? "Erreur d'envoi"
  } finally {
    submitting.value = false
  }
}
</script>
