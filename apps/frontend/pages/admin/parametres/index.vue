<script setup lang="ts">
import { siteConfig } from '@booking-pro/shared'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-neutral-900 mb-6">Paramètres</h1>

    <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-900">
      <p class="font-medium mb-1">Configuration mono-tenant</p>
      <p>
        Les paramètres du site (nom, contact, branding) sont définis dans le fichier
        <code class="bg-yellow-100 px-1.5 py-0.5 rounded text-xs">packages/shared/src/site.ts</code>.
        Modifier ce fichier et relancer un déploiement pour changer ces valeurs.
      </p>
    </div>

    <div class="bg-white rounded-xl border border-neutral-100 p-6 space-y-6 max-w-2xl">
      <div>
        <h2 class="font-semibold text-neutral-900 mb-3">Identité</h2>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-neutral-500">Nom</dt>
            <dd class="font-medium text-neutral-800">{{ siteConfig.name }}</dd>
          </div>
          <div>
            <dt class="text-neutral-500">Type</dt>
            <dd class="font-medium text-neutral-800 capitalize">{{ siteConfig.type }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-neutral-500">Description</dt>
            <dd class="font-medium text-neutral-800">{{ siteConfig.description }}</dd>
          </div>
        </dl>
      </div>

      <hr class="border-neutral-100" />

      <div>
        <h2 class="font-semibold text-neutral-900 mb-3">Contact</h2>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-neutral-500">Téléphone</dt>
            <dd class="font-medium text-neutral-800">{{ siteConfig.contact.phone }}</dd>
          </div>
          <div>
            <dt class="text-neutral-500">Email</dt>
            <dd class="font-medium text-neutral-800">{{ siteConfig.contact.email }}</dd>
          </div>
          <div>
            <dt class="text-neutral-500">Adresse</dt>
            <dd class="font-medium text-neutral-800">{{ siteConfig.contact.address }}</dd>
          </div>
          <div>
            <dt class="text-neutral-500">Ville / CP</dt>
            <dd class="font-medium text-neutral-800">
              {{ siteConfig.contact.postalCode }} {{ siteConfig.contact.city }}
            </dd>
          </div>
        </dl>
      </div>

      <hr class="border-neutral-100" />

      <div>
        <h2 class="font-semibold text-neutral-900 mb-3">Branding</h2>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-neutral-500">Couleur primaire</dt>
            <dd class="flex items-center gap-2">
              <div :style="{ background: siteConfig.branding.primaryColor }" class="w-6 h-6 rounded border border-neutral-200" />
              <span class="font-mono text-neutral-800">{{ siteConfig.branding.primaryColor }}</span>
            </dd>
          </div>
          <div>
            <dt class="text-neutral-500">Logo</dt>
            <dd class="font-mono text-xs text-neutral-800">{{ siteConfig.branding.logo }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <ToastContainer />
  </div>
</template>
