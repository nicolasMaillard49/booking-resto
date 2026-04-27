<template>
  <section id="contact" class="py-24 lg:py-32 px-8 sm:px-16 lg:px-24 bg-paper">
    <div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24">
      <div>
        <h2 class="font-display text-4xl sm:text-5xl lg:text-6xl mb-12 tracking-extra-wide leading-tight text-heading">Nous trouver</h2>

        <h3 class="font-medium mt-8 mb-4 text-xs uppercase tracking-mega-wide text-muted">Horaires</h3>
        <div class="text-ink"><ScheduleDisplay :windows="windows" /></div>

        <h3 class="font-medium mt-12 mb-4 text-xs uppercase tracking-mega-wide text-muted">Adresse</h3>
        <p class="text-ink leading-relaxed">{{ site.contact_address }}</p>
        <p v-if="site.contact_phone" class="mt-2"><a :href="`tel:${site.contact_phone}`" class="text-ink hover:text-heading">{{ site.contact_phone }}</a></p>
        <p v-if="site.contact_email"><a :href="`mailto:${site.contact_email}`" class="text-ink hover:text-heading">{{ site.contact_email }}</a></p>
        <iframe v-if="site.google_maps_embed_url" :src="site.google_maps_embed_url" class="w-full h-72 mt-8 border border-line" loading="lazy"></iframe>
      </div>
      <div>
        <h2 class="font-display text-4xl sm:text-5xl lg:text-6xl mb-12 tracking-extra-wide leading-tight text-heading">Nous écrire</h2>
        <ContactForm />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ site: Record<string, string>; windows: any[] }>()
</script>
