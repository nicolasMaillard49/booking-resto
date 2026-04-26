// ── Composable useToast — Notifications globales ───────────

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function add(message: string, type: ToastType = 'info', duration = 4000) {
    const id = Math.random().toString(36).slice(2)
    toasts.value.push({ id, type, message, duration })
    setTimeout(() => remove(id), duration)
  }

  function remove(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts: readonly(toasts),
    success: (msg: string) => add(msg, 'success'),
    error: (msg: string) => add(msg, 'error'),
    info: (msg: string) => add(msg, 'info'),
    warning: (msg: string) => add(msg, 'warning'),
    remove,
  }
}
