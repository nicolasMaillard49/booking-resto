<script setup lang="ts">
useSeoMeta({
  title: 'Réservation confirmée',
  robots: 'noindex',
})
</script>

<template>
  <div class="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span class="text-3xl">✓</span>
      </div>

      <h1 class="text-2xl font-bold text-neutral-900 mb-3">Réservation confirmée !</h1>
      <p class="text-neutral-600 mb-6">
        Un email de confirmation a été envoyé à votre adresse.
        Vous pouvez annuler votre rendez-vous jusqu'à 2 heures avant via le lien dans l'email.
      </p>

      <NuxtLink
        to="/"
        class="block w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-medium transition-colors"
      >
        Retour à l'accueil
      </NuxtLink>

      <NuxtLink
        to="/reservation"
        class="block w-full mt-3 text-primary-600 hover:underline text-sm"
      >
        Prendre un autre rendez-vous
      </NuxtLink>
    </div>
  </div>
</template>
