// ── Middleware d'authentification admin ───────────────────────
// Protège les routes /admin/** sauf /admin/login
// Client-only : la zone admin est rendue en SPA (routeRules)

export default defineNuxtRouteMiddleware((to) => {
  // Login page is public
  if (to.path === '/admin/login') return

  // SPA zone — server-side check is a no-op
  if (import.meta.server) return

  const token = localStorage.getItem('access_token')
  if (!token) {
    return navigateTo('/admin/login')
  }

  // Check JWT expiration (simple base64 decode)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      return navigateTo('/admin/login')
    }
  } catch {
    localStorage.removeItem('access_token')
    return navigateTo('/admin/login')
  }
})
