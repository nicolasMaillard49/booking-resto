<template>
  <!-- Section "Nous trouver" : bg sombre, horaires + adresse + maps + CTA reserver -->
  <section id="contact" class="py-24 lg:py-32 px-8 sm:px-16 lg:px-24" style="background-color: #1f1f1f;">
    <div class="max-w-5xl mx-auto" style="color: #f5f5f5;">
      <h2 class="font-display text-4xl sm:text-5xl lg:text-6xl mb-16 tracking-extra-wide leading-tight text-center" style="color: #f5f5f5;">Nous trouver</h2>

      <div class="grid lg:grid-cols-2 gap-16 lg:gap-20 items-start">
        <div>
          <h3 class="font-medium mb-5 text-xs uppercase tracking-mega-wide" style="color: #c39d63;">Horaires</h3>
          <div style="color: #cccccc;"><ScheduleDisplay :windows="windows" /></div>

          <h3 class="font-medium mt-12 mb-5 text-xs uppercase tracking-mega-wide" style="color: #c39d63;">Adresse</h3>
          <p class="leading-relaxed" style="color: #cccccc;">{{ site.contact_address }}</p>
          <p v-if="site.contact_phone" class="mt-3"><a :href="`tel:${site.contact_phone}`" class="hover:opacity-80 transition" style="color: #cccccc;">{{ site.contact_phone }}</a></p>
          <p v-if="site.contact_email"><a :href="`mailto:${site.contact_email}`" class="hover:opacity-80 transition" style="color: #cccccc;">{{ site.contact_email }}</a></p>
        </div>

        <!-- Google Maps auto-pin depuis l'adresse, zoom rapproché -->
        <iframe
          v-if="mapsUrl"
          :src="mapsUrl"
          class="w-full h-72 lg:h-96 border-0"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen
        ></iframe>
        <div v-else class="w-full h-72 lg:h-96 flex items-center justify-center tracking-wide" style="background-color: rgba(255,255,255,0.05); color: rgba(245,245,245,0.4);">Adresse non renseignée</div>
      </div>

      <div class="mt-16 text-center">
        <NuxtLink to="/reservation" class="inline-block px-12 py-4 transition tracking-wider uppercase text-sm" style="background-color: #c39d63; color: #f5f5f5;">Réserver une table</NuxtLink>
      </div>
    </div>
  </section>

  <!-- Section "Nous écrire" : bg sombre aussi, formulaire de contact -->
  <section class="py-24 lg:py-32 px-8 sm:px-16 lg:px-24 border-t" style="background-color: #1f1f1f; border-color: rgba(255,255,255,0.1);">
    <div class="max-w-3xl mx-auto" style="color: #f5f5f5;">
      <h2 class="font-display text-4xl sm:text-5xl lg:text-6xl mb-16 tracking-extra-wide leading-tight text-center" style="color: #f5f5f5;">Nous écrire</h2>
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
  return `https://maps.google.com/maps?q=${q}&z=17&t=m&output=embed`
})
</script>
