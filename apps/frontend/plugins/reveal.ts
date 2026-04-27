// Directive globale v-reveal : fait apparaître l'élément en fade + slide-up
// quand il entre dans le viewport. Utilisée sur les sections d'accueil pour
// animer leur arrivée au scroll. Ne tourne que côté client.

import { defineNuxtPlugin } from '#app'

interface RevealOptions {
  delay?: number      // ms avant déclenchement (échelonner les enfants)
  threshold?: number  // 0..1, % de l'élément visible avant trigger
  duration?: number   // ms de la transition
  distance?: number   // px de translation initiale (slide-up)
}

export default defineNuxtPlugin((nuxt) => {
  // La directive doit être enregistrée des deux côtés (SSR + client) sinon
  // Vue plante avec "Cannot read properties of undefined (reading 'getSSRProps')".
  // L'observation IntersectionObserver ne tourne qu'au `mounted` (client only).
  const observers = new WeakMap<HTMLElement, IntersectionObserver>()

  nuxt.vueApp.directive<HTMLElement, RevealOptions | number | undefined>('reveal', {
    getSSRProps() { return {} },
    mounted(el, binding) {
      if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return
      const opts: RevealOptions = typeof binding.value === 'number'
        ? { delay: binding.value }
        : (binding.value ?? {})
      const delay = opts.delay ?? 0
      const threshold = opts.threshold ?? 0.15
      const duration = opts.duration ?? 700
      const distance = opts.distance ?? 32

      el.style.opacity = '0'
      el.style.transform = `translate3d(0, ${distance}px, 0)`
      el.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`
      el.style.willChange = 'opacity, transform'

      const obs = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setTimeout(() => {
              el.style.opacity = '1'
              el.style.transform = 'translate3d(0, 0, 0)'
            }, delay)
            obs.unobserve(el)
            observers.delete(el)
          }
        }
      }, { threshold })

      obs.observe(el)
      observers.set(el, obs)
    },
    unmounted(el) {
      observers.get(el)?.disconnect()
      observers.delete(el)
    },
  })
})
