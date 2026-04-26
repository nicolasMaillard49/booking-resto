<template>
  <section id="contact" class="py-20 px-6 bg-paper">
    <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
      <div>
        <h2 class="font-display text-4xl md:text-5xl mb-8 tracking-tight">Nous trouver</h2>
        <h3 class="font-medium mt-6 mb-3 text-sm uppercase tracking-wider text-muted">Horaires</h3>
        <ScheduleDisplay :windows="windows" />
        <h3 class="font-medium mt-8 mb-3 text-sm uppercase tracking-wider text-muted">Adresse</h3>
        <p>{{ site.contact_address }}</p>
        <p v-if="site.contact_phone" class="mt-1"><a :href="`tel:${site.contact_phone}`" class="hover:text-muted">{{ site.contact_phone }}</a></p>
        <p v-if="site.contact_email"><a :href="`mailto:${site.contact_email}`" class="hover:text-muted">{{ site.contact_email }}</a></p>
        <iframe v-if="site.google_maps_embed_url" :src="site.google_maps_embed_url" class="w-full h-64 mt-6 border border-line/10" loading="lazy"></iframe>
      </div>
      <div>
        <h2 class="font-display text-4xl md:text-5xl mb-8 tracking-tight">Nous écrire</h2>
        <ContactForm />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ site: Record<string, string>; windows: any[] }>()
</script>
