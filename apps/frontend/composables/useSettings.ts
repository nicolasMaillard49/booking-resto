export function useSettings() {
  const { apiFetch } = useAuth()
  const settings = ref<Record<string, string>>({})

  async function load() {
    const r = await apiFetch<Record<string, string>>('/admin/settings')
    settings.value = r
  }

  async function save(payload: Partial<Record<string, string>>) {
    const r = await apiFetch<Record<string, string>>('/admin/settings', {
      method: 'PUT',
      body: payload,
    })
    settings.value = r
  }

  return { settings, load, save }
}
