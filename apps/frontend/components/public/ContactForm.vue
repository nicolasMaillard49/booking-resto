<template>
  <form @submit.prevent="submit" class="space-y-5">
    <div>
      <label :class="labelClass" :style="dark ? 'color: #c39d63;' : ''">Nom</label>
      <input v-model="form.name" required type="text" :class="inputClass" :style="dark ? darkInputStyle : ''" />
    </div>
    <div>
      <label :class="labelClass" :style="dark ? 'color: #c39d63;' : ''">Email</label>
      <input v-model="form.email" required type="email" :class="inputClass" :style="dark ? darkInputStyle : ''" />
    </div>
    <div>
      <label :class="labelClass" :style="dark ? 'color: #c39d63;' : ''">Message</label>
      <textarea v-model="form.message" required rows="5" :class="inputClass" :style="dark ? darkInputStyle : ''"></textarea>
    </div>
    <div v-if="captcha">
      <label :class="labelClass" :style="dark ? 'color: #c39d63;' : ''">Pour vérifier : combien font {{ captcha.question }} ?</label>
      <input v-model="form.captchaAnswer" required type="text" :class="['w-32', inputClass]" :style="dark ? darkInputStyle : ''" />
    </div>
    <button type="submit" :disabled="submitting" class="px-12 py-4 transition disabled:opacity-50 tracking-wider uppercase text-sm" style="background-color: #c39d63; color: #f5f5f5;">
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

const labelClass = computed(() => 'block text-xs uppercase tracking-mega-wide mb-2 ' + (props.dark ? '' : 'text-muted'))
const inputClass = computed(() =>
  props.dark
    ? 'w-full px-4 py-3 border focus:outline-none tracking-wide'
    : 'w-full px-4 py-3 border border-line bg-canvas text-ink focus:outline-none focus:border-heading tracking-wide',
)
const darkInputStyle = 'background-color: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2); color: #f5f5f5;'

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
