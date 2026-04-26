<script setup lang="ts">
const { toasts, remove } = useToast()

const typeClasses: Record<string, string> = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-neutral-800 text-white',
}

const typeIcons: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}
</script>

<template>
  <div
    aria-live="polite"
    aria-label="Notifications"
    class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
  >
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto',
          typeClasses[toast.type] || 'bg-neutral-800 text-white'
        ]"
        role="alert"
      >
        <span class="font-bold shrink-0">{{ typeIcons[toast.type] }}</span>
        <p class="text-sm flex-1">{{ toast.message }}</p>
        <button
          @click="remove(toast.id)"
          class="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          :aria-label="`Fermer la notification`"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
