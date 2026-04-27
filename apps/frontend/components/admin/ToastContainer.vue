<script setup lang="ts">
// Réutilise le même composable que le frontend
// Copier le fichier ou créer un package partagé

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration: number
}

const toasts = ref<Toast[]>([])

// Expose globally via provide/inject si besoin
function useToast() {
  function add(message: string, type: ToastType = 'info', duration = 4000) {
    const id = Math.random().toString(36).slice(2)
    toasts.value.push({ id, type, message, duration })
    setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, duration)
  }
  return {
    toasts: readonly(toasts),
    success: (msg: string) => add(msg, 'success'),
    error: (msg: string) => add(msg, 'error'),
    remove: (id: string) => { toasts.value = toasts.value.filter(t => t.id !== id) },
  }
}

const { remove } = useToast()

const typeClasses: Record<string, string> = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-neutral-800 text-white',
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['flex items-center gap-3 px-4 py-3 shadow-lg pointer-events-auto', typeClasses[toast.type]]"
        role="alert"
      >
        <p class="text-sm flex-1">{{ toast.message }}</p>
        <button @click="remove(toast.id)" class="opacity-70 hover:opacity-100 shrink-0">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(100%); }
</style>
