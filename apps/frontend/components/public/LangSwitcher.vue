<template>
  <div class="relative" ref="rootRef">
    <button
      type="button"
      @click="open = !open"
      class="flex items-center gap-1.5 px-3 py-1.5 text-sm uppercase tracking-wider hover:opacity-70 transition-opacity"
      style="color: #111111;"
      :aria-label="$t('lang.label')"
    >
      <span class="font-bold">{{ locale.toUpperCase() }}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
    <Transition name="lang-fade">
      <ul
        v-if="open"
        class="absolute right-0 top-full mt-1 min-w-[140px] z-50 bg-paper border border-line shadow-lg"
      >
        <li v-for="l in locales" :key="l.code">
          <NuxtLink
            :to="switchLocalePath(l.code)"
            @click="open = false"
            class="block px-4 py-2.5 text-sm tracking-wider hover:bg-canvas transition"
            :class="{ 'font-semibold': l.code === locale }"
            :style="{ color: l.code === locale ? '#c39d63' : '#111111' }"
          >
            {{ l.name }}
          </NuxtLink>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

if (typeof window !== 'undefined') {
  onMounted(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.value && !rootRef.value.contains(e.target as Node)) open.value = false
    }
    document.addEventListener('click', onClick)
    onBeforeUnmount(() => document.removeEventListener('click', onClick))
  })
}
</script>

<style scoped>
.lang-fade-enter-active, .lang-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.lang-fade-enter-from, .lang-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
