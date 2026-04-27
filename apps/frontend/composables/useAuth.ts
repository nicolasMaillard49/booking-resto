// ============================================================
// Composable useAuth — Authentification (JWT via localStorage)
// ============================================================

interface TokenPair {
  accessToken: string
  refreshToken: string
}

interface JwtPayload {
  sub: string
  email: string
  role: string
  exp: number
}

export function useAuth() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiUrl

  const isAuthenticated = computed(() => {
    if (import.meta.server) return false
    return !!localStorage.getItem('access_token')
  })

  const currentUser = computed<JwtPayload | null>(() => {
    if (import.meta.server) return null
    const token = localStorage.getItem('access_token')
    if (!token) return null
    try {
      return JSON.parse(atob(token.split('.')[1])) as JwtPayload
    } catch {
      return null
    }
  })

  async function login(email: string, password: string): Promise<void> {
    const result = await $fetch<TokenPair>(`${baseUrl}/auth/login`, {
      method: 'POST',
      body: { email, password },
    })
    localStorage.setItem('access_token', result.accessToken)
    localStorage.setItem('refresh_token', result.refreshToken)
  }

  async function logout(): Promise<void> {
    try {
      const token = localStorage.getItem('access_token')
      if (token) {
        await $fetch(`${baseUrl}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      await navigateTo('/admin/login')
    }
  }

  function getAuthHeader(): Record<string, string> {
    if (import.meta.server) return {}
    const token = localStorage.getItem('access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  type ApiFetchOptions = {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
    body?: unknown
    params?: Record<string, unknown>
    headers?: Record<string, string>
  }

  async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
    const { params, body, ...rest } = options
    const url = new URL(`${baseUrl}${path}`)

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          url.searchParams.set(k, String(v))
        }
      })
    }

    return $fetch<T>(url.toString(), {
      ...rest,
      // ofetch sérialise automatiquement les objets ; ne définir Content-Type que si body présent
      body: body as Record<string, unknown> | undefined,
      headers: {
        ...getAuthHeader(),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(rest.headers || {}),
      },
    })
  }

  return { isAuthenticated, currentUser, login, logout, apiFetch, getAuthHeader }
}
