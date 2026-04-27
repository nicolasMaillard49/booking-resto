<template>
  <!-- Section "Nous trouver" : bg sombre, horaires + adresse + maps + CTA reserver -->
  <section id="contact" class="py-24 lg:py-32 px-8 sm:px-16 lg:px-24 bg-dark text-canvas">
    <div class="max-w-5xl mx-auto">
      <h2 class="font-display text-4xl sm:text-5xl lg:text-6xl mb-16 tracking-extra-wide leading-tight text-canvas text-center">Nous trouver</h2>

      <div class="grid lg:grid-cols-2 gap-16 lg:gap-20 items-start">
        <div>
          <h3 class="font-medium mb-5 text-xs uppercase tracking-mega-wide text-gold">Horaires</h3>
          <div class="text-canvas/80"><ScheduleDisplay :windows="windows" /></div>

          <h3 class="font-medium mt-12 mb-5 text-xs uppercase tracking-mega-wide text-gold">Adresse</h3>
          <p class="text-canvas/80 leading-relaxed">{{ site.contact_address }}</p>
          <p v-if="site.contact_phone" class="mt-3"><a :href="`tel:${site.contact_phone}`" class="text-canvas/80 hover:text-gold transition">{{ site.contact_phone }}</a></p>
          <p v-if="site.contact_email"><a :href="`mailto:${site.contact_email}`" class="text-canvas/80 hover:text-gold transition">{{ site.contact_email }}</a></p>
        </div>

        <!-- Google Maps auto-pin depuis l'adresse -->
        <iframe
          v-if="mapsUrl"
          :src="mapsUrl"
          class="w-full h-72 lg:h-96 border-0"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen
        ></iframe>
        <div v-else class="w-full h-72 lg:h-96 bg-canvas/5 flex items-center justify-center text-canvas/40 tracking-wide">Adresse non renseignée</div>
      </div>

      <div class="mt-16 text-center">
        <NuxtLink to="/reservation" class="inline-block px-12 py-4 bg-gold text-canvas hover:bg-gold/90 transition tracking-wider uppercase text-sm">Réserver une table</NuxtLink>
      </div>
    </div>
  </section>

  <!-- Section "Nous écrire" : bg sombre aussi, formulaire de contact -->
  <section class="py-24 lg:py-32 px-8 sm:px-16 lg:px-24 bg-dark text-canvas border-t border-white/10">
    <div class="max-w-3xl mx-auto">
      <h2 class="font-display text-4xl sm:text-5xl lg:text-6xl mb-16 tracking-extra-wide leading-tight text-canvas text-center">Nous écrire</h2>
      <ContactForm dark />
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ site: Record<string, string>; windows: any[] }>()

const mapsUrl = computed(() => {
  if (props.site.google_maps_embed_url?.trim()) return props.site.google_maps_embed_url
  if (!props.site.contact_address?.trim()) return null
  const q = encodeURIComponent(props.site.contact_address.trim())
  return `https://maps.google.com/maps?q=${q}&output=embed`
})
</script>
