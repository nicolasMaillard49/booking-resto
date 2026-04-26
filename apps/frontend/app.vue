<script setup lang="ts">
// Applique la couleur primaire depuis la config Business dès le chargement
const business = useState('business')

watchEffect(() => {
  if (business.value?.config?.couleur) {
    applyPrimaryColor(business.value.config.couleur)
  }
})

function applyPrimaryColor(hex: string) {
  // Convertit hex en RGB et injecte dans les CSS variables
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  
  const root = document.documentElement
  root.style.setProperty('--color-primary-500', `${r} ${g} ${b}`)
  // Versions plus claires/foncées approximatives
  root.style.setProperty('--color-primary-600', `${Math.max(0, r - 20)} ${Math.max(0, g - 20)} ${Math.max(0, b - 20)}`)
  root.style.setProperty('--color-primary-100', `${Math.min(255, r + 120)} ${Math.min(255, g + 120)} ${Math.min(255, b + 120)}`)
  root.style.setProperty('--color-primary-50', `${Math.min(255, r + 150)} ${Math.min(255, g + 150)} ${Math.min(255, b + 150)}`)
}
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
