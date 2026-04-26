// ============================================================
// Composable useApi — Wrapper autour de $fetch pour l'API
// ============================================================

export function useApi() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiUrl

  async function get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return $fetch<T>(`${baseUrl}${path}`, {
      method: 'GET',
      params,
    })
  }

  async function post<T>(path: string, body: unknown): Promise<T> {
    return $fetch<T>(`${baseUrl}${path}`, {
      method: 'POST',
      body,
    })
  }

  async function patch<T>(path: string, body: unknown): Promise<T> {
    return $fetch<T>(`${baseUrl}${path}`, {
      method: 'PATCH',
      body,
    })
  }

  return { get, post, patch }
}
