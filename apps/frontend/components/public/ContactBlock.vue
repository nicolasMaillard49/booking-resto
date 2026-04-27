<template>
  <!-- Une grande section sombre divisée en 2 cards côte à côte avec gap -->
  <section id="contact" class="py-20 lg:py-28 px-6 sm:px-10 lg:px-16" style="background-color: #1a1a1a;">
    <div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6 lg:gap-8">

      <!-- Card 1 : Nous trouver -->
      <div class="rounded-xl p-8 sm:p-10 lg:p-12 flex flex-col" style="background-color: #1f1f1f; border: 1px solid rgba(255,255,255,0.06);">
        <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl mb-10 tracking-extra-wide leading-tight text-center" style="color: #f5f5f5;">Nous trouver</h2>

        <div class="space-y-8 flex-1">
          <div>
            <h3 class="font-medium mb-3 text-xs uppercase tracking-mega-wide" style="color: #c39d63;">Horaires</h3>
            <div style="color: #cccccc;"><ScheduleDisplay :windows="windows" /></div>
          </div>

          <div>
            <h3 class="font-medium mb-3 text-xs uppercase tracking-mega-wide" style="color: #c39d63;">Adresse</h3>
            <p class="leading-relaxed" style="color: #cccccc;">{{ site.contact_address }}</p>
            <p v-if="site.contact_phone" class="mt-2"><a :href="`tel:${site.contact_phone}`" class="hover:opacity-80 transition" style="color: #cccccc;">{{ site.contact_phone }}</a></p>
            <p v-if="site.contact_email"><a :href="`mailto:${site.contact_email}`" class="hover:opacity-80 transition" style="color: #cccccc;">{{ site.contact_email }}</a></p>
          </div>

          <iframe
            v-if="mapsUrl"
            :src="mapsUrl"
            class="w-full h-64 lg:h-72 border-0 rounded"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
          ></iframe>
        </div>

        <div class="mt-10 text-center">
          <NuxtLink to="/reservation" class="inline-block px-10 py-3.5 transition tracking-wider uppercase text-sm rounded" style="background-color: #c39d63; color: #1a1a1a;">Réserver une table</NuxtLink>
        </div>
      </div>

      <!-- Card 2 : Nous écrire -->
      <div class="rounded-xl p-8 sm:p-10 lg:p-12 flex flex-col" style="background-color: #1f1f1f; border: 1px solid rgba(255,255,255,0.06);">
        <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl mb-10 tracking-extra-wide leading-tight text-center" style="color: #f5f5f5;">Nous écrire</h2>
        <div class="flex-1">
          <ContactForm dark />
        </div>
      </div>

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
