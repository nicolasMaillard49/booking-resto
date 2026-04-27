<template>
  <form @submit.prevent="submit" class="space-y-5">
    <div>
      <label :class="labelClass">Nom</label>
      <input v-model="form.name" required type="text" :class="inputClass" />
    </div>
    <div>
      <label :class="labelClass">Email</label>
      <input v-model="form.email" required type="email" :class="inputClass" />
    </div>
    <div>
      <label :class="labelClass">Message</label>
      <textarea v-model="form.message" required rows="5" :class="inputClass"></textarea>
    </div>
    <div v-if="captcha">
      <label :class="labelClass">Pour vérifier : combien font {{ captcha.question }} ?</label>
      <input v-model="form.captchaAnswer" required type="text" :class="['w-32', inputClass]" />
    </div>
    <button type="submit" :disabled="submitting" class="px-12 py-4 bg-gold text-canvas hover:bg-gold/90 transition disabled:opacity-50 tracking-wider uppercase text-sm">
      {{ submitting ? 'Envoi…' : 'Envoyer le message' }}
    </button>
    <p v-if="success" :class="dark ? 'text-green-400 tracking-wide' : 'text-green-700 tracking-wide'">Message envoyé, merci !</p>
    <p v-if="error" :class="dark ? 'text-red-400 tracking-wide' : 'text-red-700 tracking-wide'">{{ error }}</p>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ dark?: boolean }>()
const config = useRuntimeConfig()
const captcha = ref<{ question: string; token: string } | null>(null)
const form = reactive({ name: '', email: '', message: '', captchaAnswer: '' })
const submitting = ref(false)
const success = ref(false)
const error = ref('')

const labelClass = computed(() =>
  props.dark
    ? 'block text-xs uppercase tracking-mega-wide mb-2 text-gold'
    : 'block text-xs uppercase tracking-mega-wide mb-2 text-muted',
)
const inputClass = computed(() =>
  props.dark
    ? 'w-full px-4 py-3 border border-white/20 bg-white/5 text-canvas placeholder-canvas/40 focus:outline-none focus:border-gold tracking-wide'
    : 'w-full px-4 py-3 border border-line bg-canvas text-ink focus:outline-none focus:border-heading tracking-wide',
)

onMounted(async () => { await refreshCaptcha() })

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
