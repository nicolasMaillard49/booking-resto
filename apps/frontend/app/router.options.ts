// Custom router scroll behavior
// - Mêmes route → ne scrolle pas (évite le « jump to top » quand on clique
//   sur le brand ou sur un lien du menu de la page courante).
// - Navigation arrière/avant → restaure la position sauvegardée.
// - Ancre #foo → scroll fluide vers l'ancre.
// - Nouvelle route → scroll en haut, fluide.
import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    if (savedPosition) return savedPosition
    if (from && to.path === from.path) return false
    return { top: 0, behavior: 'smooth' }
  },
}
