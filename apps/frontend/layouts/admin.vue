<script setup lang="ts">
import {
  LayoutDashboard,
  CalendarDays,
  CalendarClock,
  Scissors,
  Clock,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-vue-next'

const { currentUser, logout } = useAuth()
const route = useRoute()

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/reservations', icon: CalendarDays, label: 'Réservations' },
  { path: '/admin/agenda', icon: CalendarClock, label: 'Agenda' },
  { path: '/admin/services', icon: Scissors, label: 'Services' },
  { path: '/admin/horaires', icon: Clock, label: 'Horaires' },
  { path: '/admin/avis', icon: Star, label: 'Avis' },
  { path: '/admin/parametres', icon: Settings, label: 'Paramètres' },
]

const mobileOpen = ref(false)

function isActive(path: string): boolean {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}

// Fermer le drawer quand on navigue
watch(() => route.path, () => {
  mobileOpen.value = false
})
</script>

<template>
  <div class="min-h-screen bg-neutral-50">
    <!-- ═══ Overlay mobile ═══ -->
    <Transition name="fade">
      <div
        v-if="mobileOpen"
        class="fixed inset-0 bg-ink/40 backdrop-blur-sm z-40 lg:hidden"
        @click="mobileOpen = false"
      />
    </Transition>

    <!-- ═══ Sidebar (desktop fixe + drawer mobile) ═══ -->
    <aside
      :class="[
        'fixed top-0 left-0 h-full w-72 bg-white border-r border-neutral-100 z-50 flex flex-col transition-transform duration-300 ease-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <!-- Header sidebar -->
      <div class="px-5 py-5 border-b border-neutral-100 flex items-center justify-between">
        <div class="min-w-0">
          <p class="font-bold text-neutral-900 text-base">Booking Pro</p>
          <p class="text-xs text-neutral-400 truncate">{{ currentUser?.email }}</p>
        </div>
        <button
          class="lg:hidden p-1.5 -mr-1 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          @click="mobileOpen = false"
          aria-label="Fermer le menu"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group',
            isActive(item.path)
              ? 'bg-primary-50 text-primary-700 font-semibold'
              : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
          ]"
        >
          <component
            :is="item.icon"
            :size="18"
            :stroke-width="isActive(item.path) ? 2.2 : 1.8"
            :class="[
              'shrink-0 transition-colors',
              isActive(item.path) ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-600'
            ]"
          />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Logout -->
      <div class="px-3 py-4 border-t border-neutral-100">
        <button
          @click="logout"
          class="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors group"
        >
          <LogOut :size="18" :stroke-width="1.8" class="shrink-0 text-neutral-400 group-hover:text-red-500 transition-colors" />
          Déconnexion
        </button>
      </div>
    </aside>

    <!-- ═══ Main content ═══ -->
    <div class="lg:ml-72 min-h-screen flex flex-col">
      <!-- Mobile header -->
      <header class="lg:hidden bg-white border-b border-neutral-100 sticky top-0 z-30 px-4 h-14 flex items-center justify-between">
        <button
          class="p-2 -ml-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
          @click="mobileOpen = true"
          aria-label="Ouvrir le menu"
        >
          <Menu :size="22" />
        </button>
        <p class="font-bold text-neutral-900 text-sm">Booking Pro</p>
        <div class="w-10" />
      </header>

      <!-- Page content -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8">
        <slot />
      </main>

      <!-- ═══ Bottom nav mobile (5 items clés) ═══ -->
      <nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-30 safe-area-bottom">
        <div class="grid grid-cols-5 h-16">
          <NuxtLink
            v-for="item in navItems.slice(0, 5)"
            :key="item.path"
            :to="item.path"
            :class="[
              'flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors',
              isActive(item.path)
                ? 'text-primary-600 font-semibold'
                : 'text-neutral-400'
            ]"
          >
            <component
              :is="item.icon"
              :size="20"
              :stroke-width="isActive(item.path) ? 2.2 : 1.6"
            />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </div>
      </nav>

      <!-- Spacer for bottom nav on mobile -->
      <div class="lg:hidden h-16" />
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Safe area for iOS notch/home bar */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
