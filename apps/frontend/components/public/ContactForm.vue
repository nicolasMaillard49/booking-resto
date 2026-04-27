<template>
  <form @submit.prevent="submit" class="space-y-4">
    <input v-model="form.name" required type="text" placeholder="Nom" :class="inputClass" :style="dark ? darkInputStyle : ''" />
    <input v-model="form.email" required type="email" placeholder="Email" :class="inputClass" :style="dark ? darkInputStyle : ''" />
    <textarea v-model="form.message" required rows="5" placeholder="Votre message" :class="inputClass" :style="dark ? darkInputStyle : ''"></textarea>
    <input
      v-if="captcha"
      v-model="form.captchaAnswer"
      required type="text"
      :placeholder="`Combien font ${captcha.question} ?`"
      :class="['w-full', inputClass]"
      :style="dark ? darkInputStyle : ''"
    />
    <button type="submit" :disabled="submitting" class="px-12 py-4 transition disabled:opacity-50 tracking-wider uppercase text-sm" style="background-color: #c39d63; color: #ffffff;">
      {{ submitting ? 'Envoi…' : 'Envoyer le message' }}
    </button>
    <p v-if="success" class="tracking-wide" :style="dark ? 'color: #4ade80;' : 'color: #15803d;'">Message envoyé, merci !</p>
    <p v-if="error" class="tracking-wide" :style="dark ? 'color: #f87171;' : 'color: #b91c1c;'">{{ error }}</p>
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

const inputClass = computed(() =>
  props.dark
    ? 'w-full px-4 py-3 border focus:outline-none tracking-wide text-base'
    : 'w-full px-4 py-3 border border-line bg-canvas text-ink focus:outline-none focus:border-heading tracking-wide placeholder:text-muted',
)
const darkInputStyle = 'background-color: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2); color: #ffffff;'

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

<style scoped>
input::placeholder, textarea::placeholder {
  color: rgba(245, 245, 245, 0.5);
}
</style>
