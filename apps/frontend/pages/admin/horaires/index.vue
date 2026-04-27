<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
const { apiFetch } = useAuth()
const { success: showToast } = useToast()

const windows = ref<any[]>([])
const exceptions = ref<any[]>([])

const windowModal = reactive({ open: false, editing: null as any, form: { label: '', daysOfWeek: [] as number[], startTime: '12:00', endTime: '14:00', isActive: true } })
const exceptionModal = reactive({ open: false, form: { startDate: '', endDate: '', reason: '' } })

const DAY_NAMES = ['', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

onMounted(fetchAll)
async function fetchAll() {
  const [w, e] = await Promise.all([
    apiFetch<any[]>('/service-windows'),
    apiFetch<any[]>('/schedule-exceptions'),
  ])
  windows.value = w
  exceptions.value = e
}

function openWindowModal(w?: any) {
  if (w) {
    windowModal.editing = w
    Object.assign(windowModal.form, { label: w.label, daysOfWeek: [...w.daysOfWeek], startTime: w.startTime, endTime: w.endTime, isActive: w.isActive })
  } else {
    windowModal.editing = null
    Object.assign(windowModal.form, { label: '', daysOfWeek: [], startTime: '12:00', endTime: '14:00', isActive: true })
  }
  windowModal.open = true
}

function toggleDay(d: number) {
  const i = windowModal.form.daysOfWeek.indexOf(d)
  if (i >= 0) windowModal.form.daysOfWeek.splice(i, 1)
  else windowModal.form.daysOfWeek.push(d)
}

async function submitWindow() {
  if (!windowModal.form.daysOfWeek.length) { alert('Sélectionner au moins un jour'); return }
  const body = JSON.stringify(windowModal.form)
  if (windowModal.editing) {
    await apiFetch(`/service-windows/${windowModal.editing.id}`, { method: 'PATCH', body } as any)
  } else {
    await apiFetch('/service-windows', { method: 'POST', body } as any)
  }
  windowModal.open = false
  showToast('Plage enregistrée')
  await fetchAll()
}

async function deleteWindow(id: string) {
  if (!confirm('Supprimer cette plage ?')) return
  await apiFetch(`/service-windows/${id}`, { method: 'DELETE' } as any)
  await fetchAll()
}

function openExceptionModal() {
  Object.assign(exceptionModal.form, { startDate: '', endDate: '', reason: '' })
  exceptionModal.open = true
}

async function submitException() {
  await apiFetch('/schedule-exceptions', { method: 'POST', body: JSON.stringify(exceptionModal.form) } as any)
  exceptionModal.open = false
  showToast('Fermeture ajoutée')
  await fetchAll()
}

async function deleteException(id: string) {
  if (!confirm('Supprimer ?')) return
  await apiFetch(`/schedule-exceptions/${id}`, { method: 'DELETE' } as any)
  await fetchAll()
}

function formatDays(d: number[]) { return d.map(i => DAY_NAMES[i]).join(' ') }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString('fr-FR') }
</script>

<template>
  <div class="space-y-12">
    <h1 class="text-2xl font-bold text-neutral-900">Horaires & Fermetures</h1>

    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-neutral-900">Plages de service</h2>
        <button @click="openWindowModal()" class="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">+ Ajouter</button>
      </div>
      <div class="space-y-2">
        <div v-for="w in windows" :key="w.id" class="bg-white border border-neutral-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p class="font-medium">{{ w.label }} <span v-if="!w.isActive" class="text-xs text-neutral-400">(inactive)</span></p>
            <p class="text-sm text-neutral-500">{{ formatDays(w.daysOfWeek) }} · {{ w.startTime }} → {{ w.endTime }}</p>
          </div>
          <div class="space-x-3">
            <button @click="openWindowModal(w)" class="text-sm hover:text-primary-600">Modifier</button>
            <button @click="deleteWindow(w.id)" class="text-sm text-red-700 hover:underline">Supprimer</button>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-neutral-900">Fermetures exceptionnelles</h2>
        <button @click="openExceptionModal()" class="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">+ Ajouter</button>
      </div>
      <div class="bg-white border border-neutral-100 rounded-xl overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-neutral-50 text-left text-neutral-500">
            <tr><th class="p-3">Du</th><th class="p-3">Au</th><th class="p-3">Raison</th><th class="p-3"></th></tr>
          </thead>
          <tbody>
            <tr v-for="e in exceptions" :key="e.id" class="border-t border-neutral-100">
              <td class="p-3">{{ formatDate(e.startDate) }}</td>
              <td class="p-3">{{ formatDate(e.endDate) }}</td>
              <td class="p-3">{{ e.reason || '—' }}</td>
              <td class="p-3 text-right"><button @click="deleteException(e.id)" class="text-red-700 text-sm hover:underline">Supprimer</button></td>
            </tr>
          </tbody>
        </table>
        <p v-if="!exceptions.length" class="p-6 text-center text-neutral-400">Aucune fermeture</p>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="windowModal.open" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
        <div class="bg-white rounded-xl p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold mb-4">{{ windowModal.editing ? 'Modifier' : 'Ajouter' }} une plage</h3>
          <form @submit.prevent="submitWindow" class="space-y-4">
            <div>
              <label class="block text-sm mb-1">Libellé</label>
              <input v-model="windowModal.form.label" required class="w-full px-3 py-2 border border-neutral-200 rounded-lg" />
            </div>
            <div>
              <label class="block text-sm mb-2">Jours</label>
              <div class="flex gap-2">
                <button v-for="i in 7" :key="i" type="button" @click="toggleDay(i)"
                  :class="['w-12 py-2 border rounded-lg text-sm', windowModal.form.daysOfWeek.includes(i) ? 'bg-primary-600 text-white border-primary-600' : 'border-neutral-200']">
                  {{ DAY_NAMES[i] }}
                </button>
              </div>
            </div>
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block text-sm mb-1">Début</label>
                <input v-model="windowModal.form.startTime" required pattern="[0-2][0-9]:[0-5][0-9]" class="w-full px-3 py-2 border border-neutral-200 rounded-lg" />
              </div>
              <div class="flex-1">
                <label class="block text-sm mb-1">Fin</label>
                <input v-model="windowModal.form.endTime" required pattern="[0-2][0-9]:[0-5][0-9]" class="w-full px-3 py-2 border border-neutral-200 rounded-lg" />
              </div>
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="windowModal.form.isActive" type="checkbox" /> Active
            </label>
            <div class="flex gap-2 justify-end">
              <button type="button" @click="windowModal.open = false" class="px-4 py-2 border border-neutral-200 rounded-lg">Annuler</button>
              <button type="submit" class="px-4 py-2 bg-primary-600 text-white rounded-lg">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="exceptionModal.open" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
        <div class="bg-white rounded-xl p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold mb-4">Ajouter une fermeture</h3>
          <form @submit.prevent="submitException" class="space-y-4">
            <div><label class="block text-sm mb-1">Date début</label>
              <input v-model="exceptionModal.form.startDate" required type="date" class="w-full px-3 py-2 border border-neutral-200 rounded-lg" /></div>
            <div><label class="block text-sm mb-1">Date fin</label>
              <input v-model="exceptionModal.form.endDate" required type="date" class="w-full px-3 py-2 border border-neutral-200 rounded-lg" /></div>
            <div><label class="block text-sm mb-1">Raison (optionnel)</label>
              <input v-model="exceptionModal.form.reason" class="w-full px-3 py-2 border border-neutral-200 rounded-lg" /></div>
            <div class="flex gap-2 justify-end">
              <button type="button" @click="exceptionModal.open = false" class="px-4 py-2 border border-neutral-200 rounded-lg">Annuler</button>
              <button type="submit" class="px-4 py-2 bg-primary-600 text-white rounded-lg">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
