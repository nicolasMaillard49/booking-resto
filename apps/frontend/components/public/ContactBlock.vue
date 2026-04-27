<template>
  <!-- Section parent : image de fond + filtre sombre + 2 cards par-dessus -->
  <section
    id="contact"
    class="relative py-20 lg:py-28 px-6 sm:px-10 lg:px-16 overflow-hidden"
    :style="bgStyle"
  >
    <!-- Filtre sombre par dessus l'image (visible uniquement si image présente) -->
    <div v-if="bgImageUrl" class="absolute inset-0" style="background-color: rgba(0,0,0,0.65);"></div>

    <div class="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-6 lg:gap-8">

      <!-- Card 1 : Nous trouver -->
      <div class="p-8 sm:p-10 lg:p-12 flex flex-col" style="background-color: #1f1f1f;">
        <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl mb-10 tracking-extra-wide leading-tight text-center" style="color: #f5f5f5;">Nous trouver</h2>

        <div class="space-y-8 flex-1">
          <div>
            <h3 class="font-medium mb-3 text-xs uppercase tracking-mega-wide" style="color: #c39d63;">Horaires</h3>
            <div style="color: #cccccc;"><ScheduleDisplay :windows="windows" dark /></div>
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
            class="w-full h-64 lg:h-72 border-0"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
          ></iframe>
        </div>

        <div class="mt-10 text-center">
          <NuxtLink to="/reservation" class="inline-block px-10 py-3.5 transition tracking-wider uppercase text-sm" style="background-color: #c39d63; color: #ffffff;">Réserver une table</NuxtLink>
        </div>
      </div>

      <!-- Card 2 : Nous écrire -->
      <div class="p-8 sm:p-10 lg:p-12 flex flex-col" style="background-color: #1f1f1f;">
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
const config = useRuntimeConfig()

const bgImageUrl = computed(() =>
  props.site.contact_bg_image_id
    ? `${config.public.apiUrl}/images/${props.site.contact_bg_image_id}`
    : null,
)

const bgStyle = computed(() =>
  bgImageUrl.value
    ? `background-image: url('${bgImageUrl.value}'); background-size: cover; background-position: center;`
    : 'background-color: #f5f5f5;',
)

const mapsUrl = computed(() => {
  if (props.site.google_maps_embed_url?.trim()) return props.site.google_maps_embed_url
  if (!props.site.contact_address?.trim()) return null
  const q = encodeURIComponent(props.site.contact_address.trim())
  return `https://maps.google.com/maps?q=${q}&z=17&t=m&output=embed`
})
</script>
