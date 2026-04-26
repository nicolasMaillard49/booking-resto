<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next'

defineEmits<{ click: [] }>()

const isScrolled = ref(false)

onMounted(() => {
  window.addEventListener('scroll', () => {
    isScrolled.value = window.scrollY > 200
  }, { passive: true })
})
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="isScrolled"
      class="fixed bottom-4 left-4 right-4 z-50 sm:hidden"
    >
      <button
        @click="$emit('click')"
        class="group w-full bg-primary-600 text-canvas border-2 border-primary-600 py-4 font-medium text-base tracking-tight shadow-paper hover:bg-primary-700 hover:border-primary-700 transition-colors active:scale-[0.98] flex items-center justify-center gap-2.5"
      >
        <CalendarDays :size="18" :stroke-width="2" />
        Prendre rendez-vous
        <span class="transition-transform group-hover:translate-x-0.5">→</span>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
