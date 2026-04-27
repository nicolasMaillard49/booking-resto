export function useSettings() {
  const { apiFetch } = useAuth()
  const settings = ref<Record<string, string>>({})

  async function load() {
    const r = await apiFetch<Record<string, string>>('/admin/settings')
    settings.value = r
  }

  async function save(payload: Partial<Record<string, string>>) {
    // Spread pour éviter de passer le proxy reactive qui peut perdre des champs en JSON.stringify
    const body = { ...payload }
    const r = await apiFetch<Record<string, string>>('/admin/settings', {
      method: 'PUT',
      body,
    })
    settings.value = r
    // Invalide le cache useFetch des pages publiques pour qu'elles re-fetchent /public/site
    if (typeof window !== 'undefined') {
      try { await refreshNuxtData(['public-site', 'public-home-sections', 'public-schedule', 'public-menu']) }
      catch { /* refreshNuxtData peut ne pas exister hors contexte */ }
    }
  }

  return { settings, load, save }
}
