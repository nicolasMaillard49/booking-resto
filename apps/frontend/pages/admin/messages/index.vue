<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
const { apiFetch } = useAuth()
const { success: showToast, error: showError } = useToast()
const items = ref<any[]>([])
const selected = ref<any>(null)

onMounted(fetch)
async function fetch() {
  const r = await apiFetch<{ items: any[] }>('/admin/contact-messages?page=1&pageSize=50')
  items.value = r.items
}

async function open(m: any) {
  selected.value = m
  if (!m.isRead) {
    await apiFetch(`/admin/contact-messages/${m.id}`, { method: 'PATCH', body: { isRead: true } })
    m.isRead = true
  }
}

async function toggleRead() {
  selected.value.isRead = !selected.value.isRead
  try {
    await apiFetch(`/admin/contact-messages/${selected.value.id}`, { method: 'PATCH', body: { isRead: selected.value.isRead } })
    showToast(selected.value.isRead ? 'Marqué comme lu' : 'Marqué comme non lu')
  } catch (e) {
    selected.value.isRead = !selected.value.isRead
    showError(e instanceof Error ? e.message : 'Erreur')
  }
}

async function del() {
  if (!confirm('Supprimer ce message ?')) return
  try {
    await apiFetch(`/admin/contact-messages/${selected.value.id}`, { method: 'DELETE' })
    selected.value = null
    await fetch()
    showToast('Message supprimé')
  } catch (e) { showError(e instanceof Error ? e.message : 'Erreur') }
}

function formatDate(iso: string) { return new Date(iso).toLocaleString('fr-FR') }
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-neutral-900 mb-6">Messages</h1>
    <div class="bg-white border border-neutral-100 overflow-hidden">
      <ul>
        <li v-for="m in items" :key="m.id"
          @click="open(m)"
          :class="['p-4 border-b border-neutral-100 cursor-pointer hover:bg-neutral-50', m.isRead ? '' : 'font-semibold']">
          <div class="flex justify-between text-sm">
            <span>{{ m.name }} &lt;{{ m.email }}&gt;</span>
            <span class="text-neutral-400">{{ formatDate(m.createdAt) }}</span>
          </div>
          <p class="text-sm text-neutral-500 truncate mt-1">{{ m.message }}</p>
        </li>
      </ul>
      <p v-if="!items.length" class="p-6 text-center text-neutral-400">Aucun message</p>
    </div>

    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-end" @click.self="selected = null">
        <div class="bg-white w-full max-w-md h-full p-6 overflow-y-auto">
          <h3 class="text-lg font-semibold mb-2">{{ selected.name }}</h3>
          <p class="text-sm text-neutral-500 mb-4"><a :href="`mailto:${selected.email}`" class="hover:text-primary-600">{{ selected.email }}</a></p>
          <p class="text-xs text-neutral-400 mb-4">{{ formatDate(selected.createdAt) }}</p>
          <p class="whitespace-pre-line">{{ selected.message }}</p>
          <div class="mt-6 flex gap-2 flex-wrap">
            <button @click="toggleRead" class="px-3 py-2 border border-neutral-200 text-sm">{{ selected.isRead ? 'Marquer non lu' : 'Marquer lu' }}</button>
            <button @click="del" class="px-3 py-2 border border-red-700 text-red-700 text-sm hover:bg-red-700 hover:text-white">Supprimer</button>
            <button @click="selected = null" class="ml-auto px-3 py-2 border border-neutral-200 text-sm">Fermer</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
