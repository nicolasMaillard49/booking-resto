---
name: media-display
description: >
  Skill spécialisé dans l'affichage et l'intégration de fichiers médias dans des interfaces web :
  images (PNG, JPG, WebP, SVG) et PDF. Utilise ce skill dès que l'utilisateur veut afficher,
  intégrer, redimensionner, zoomer/dézoomer un PDF ou une image dans une page web, un composant
  Vue/Nuxt, ou un artifact HTML. Déclenche aussi quand l'utilisateur dit "le PDF déborde",
  "l'image ne prend pas la bonne taille", "je veux afficher un PDF sans scroll", "PDF trop grand",
  "image qui dépasse son conteneur", "afficher un PDF dézoomé", ou toute problématique d'import
  et rendu visuel de fichier dans une interface. Couvre : object-fit, aspect-ratio, PDF embed via
  iframe/object/canvas, scroll contain, zoom CSS, et intégration Vue/Nuxt avec composants réutilisables.
---

# SKILL : Media Display — Images & PDF

## Identité & posture

Expert frontend spécialisé dans le rendu fidèle de médias dans les interfaces web.
Stack : Vue 3 / Nuxt 3, HTML/CSS vanilla, Tailwind CSS.
Principe directeur : **le média s'adapte à son conteneur, jamais l'inverse**.
Chaque solution est directement intégrable, sans dépendance externe inutile.

---

## Règle critique

> Ne jamais laisser un PDF ou une image déborder de son conteneur parent.
> Toujours contraindre avec `max-width: 100%`, `max-height: 100%` ou équivalent Tailwind.
> Pour les PDF : préférer `<iframe>` avec paramètre `#zoom=page-fit` ou `scale=page-width`.

---

## MODE IMAGE — Affichage correct d'une image

### Problème : image trop grande / déborde

```css
/* CSS vanilla */
img {
  width: 100%;
  height: 100%;
  object-fit: contain; /* ou cover selon le besoin */
  max-width: 100%;
  max-height: 100%;
  display: block;
}
```

```html
<!-- Tailwind -->
<img src="..." class="w-full h-full object-contain max-w-full max-h-full block" />
```

### Patterns courants

| Besoin | object-fit | Effet |
|---|---|---|
| Image entière visible, ratio respecté | `contain` | Letterbox si ratio différent |
| Remplir le conteneur, recadrer | `cover` | Crop centré auto |
| Étirer sans recadre | `fill` | Déforme l'image |
| Taille originale | `none` | Déborde si trop grande |

### Composant Vue — ImageDisplay

```vue
<template>
  <div class="image-wrapper" :style="wrapperStyle">
    <img
      :src="src"
      :alt="alt"
      class="media-img"
      :style="imgStyle"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  src: String,
  alt: { type: String, default: '' },
  fit: { type: String, default: 'contain' }, // contain | cover | fill
  width: { type: String, default: '100%' },
  height: { type: String, default: '400px' },
})

const wrapperStyle = computed(() => ({
  width: props.width,
  height: props.height,
  overflow: 'hidden',
  position: 'relative',
}))

const imgStyle = computed(() => ({
  width: '100%',
  height: '100%',
  objectFit: props.fit,
  display: 'block',
}))
</script>
```

---

## MODE PDF — Affichage sans débordement

### Problème principal : PDF trop grand, ne rentre pas dans son conteneur

Le problème vient du fait que `<iframe>` et `<object>` affichent le PDF à sa taille native.
La solution est de combiner les paramètres URL du viewer natif + contraintes CSS.

### Solution 1 — iframe avec paramètres de zoom (recommandée)

```html
<!-- HTML vanilla -->
<div style="width: 100%; height: 600px; overflow: hidden;">
  <iframe
    src="/mon-fichier.pdf#zoom=page-fit&toolbar=0&navpanes=0"
    style="width: 100%; height: 100%; border: none;"
    title="PDF Viewer"
  ></iframe>
</div>
```

**Paramètres URL PDF viewer :**
| Paramètre | Effet |
|---|---|
| `#zoom=page-fit` | Zoom auto pour que la page tienne en largeur ET hauteur |
| `#zoom=page-width` | Zoom auto largeur uniquement (scroll vertical possible) |
| `#zoom=50` | Zoom fixe à 50% |
| `#toolbar=0` | Masque la barre d'outils |
| `#navpanes=0` | Masque le panneau de navigation |
| `#scrollbar=0` | Masque la scrollbar |
| `#view=FitH` | Fit horizontal (comme page-width) |
| `#view=Fit` | Fit complet (comme page-fit) |

> ⚠️ Ces paramètres fonctionnent avec le viewer natif Chrome/Firefox/Edge.
> Sur Safari, `page-fit` est moins fiable → fallback avec `view=Fit`.

### Solution 2 — object tag (fallback crossbrowser)

```html
<div style="width: 100%; height: 600px; overflow: hidden; position: relative;">
  <object
    data="/mon-fichier.pdf#zoom=page-fit"
    type="application/pdf"
    style="width: 100%; height: 100%;"
  >
    <p>PDF non supporté. <a href="/mon-fichier.pdf">Télécharger</a></p>
  </object>
</div>
```

### Solution 3 — Composant Vue PdfViewer

```vue
<template>
  <div class="pdf-container" :style="containerStyle">
    <iframe
      v-if="src"
      :src="iframeSrc"
      class="pdf-frame"
      title="PDF Viewer"
      frameborder="0"
    />
    <div v-else class="pdf-placeholder">
      <slot>Aucun PDF chargé</slot>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  src: { type: String, required: true },
  height: { type: String, default: '600px' },
  width: { type: String, default: '100%' },
  zoom: { type: String, default: 'page-fit' }, // page-fit | page-width | 75 | etc.
  toolbar: { type: Boolean, default: false },
  navpanes: { type: Boolean, default: false },
})

const iframeSrc = computed(() => {
  const params = [
    `zoom=${props.zoom}`,
    `toolbar=${props.toolbar ? 1 : 0}`,
    `navpanes=${props.navpanes ? 1 : 0}`,
  ].join('&')
  return `${props.src}#${params}`
})

const containerStyle = computed(() => ({
  width: props.width,
  height: props.height,
  overflow: 'hidden',
  position: 'relative',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
}))
</script>

<style scoped>
.pdf-container {
  background: #f9fafb;
}
.pdf-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
.pdf-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}
</style>
```

**Usage :**
```vue
<!-- PDF qui prend toute la hauteur disponible, dézoomé automatiquement -->
<PdfViewer src="/menu.pdf" height="500px" zoom="page-fit" />

<!-- PDF en largeur, scroll vertical possible -->
<PdfViewer src="/document.pdf" height="800px" zoom="page-width" :toolbar="true" />

<!-- PDF figé à 75% -->
<PdfViewer src="/contrat.pdf" height="600px" zoom="75" />
```

---

## MODE IMPORT — Gestion des uploads

### Input file image avec preview Vue

```vue
<template>
  <div>
    <input type="file" accept="image/*,.pdf" @change="onFileChange" />
    
    <!-- Preview image -->
    <div v-if="fileType === 'image'" class="preview-wrapper">
      <img :src="previewUrl" class="preview-img" alt="Preview" />
    </div>
    
    <!-- Preview PDF -->
    <div v-if="fileType === 'pdf'" class="preview-wrapper">
      <iframe :src="previewUrl + '#zoom=page-fit&toolbar=0'" class="preview-pdf" />
    </div>
  </div>
</template>

<script setup>
const previewUrl = ref(null)
const fileType = ref(null)

function onFileChange(event) {
  const file = event.target.files[0]
  if (!file) return
  
  fileType.value = file.type === 'application/pdf' ? 'pdf' : 'image'
  
  // Révoquer l'ancienne URL pour éviter les fuites mémoire
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(file)
}

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<style scoped>
.preview-wrapper {
  width: 100%;
  height: 500px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.preview-pdf {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
```

---

## Checklist de debug — PDF qui déborde

```
□ Le conteneur parent a-t-il une height définie ? (pas auto)
□ L'iframe/object a-t-il width: 100% et height: 100% ?
□ overflow: hidden est-il sur le conteneur wrapper ?
□ Le paramètre #zoom=page-fit est-il dans l'URL src ?
□ Si toujours problème : tester #view=Fit à la place
□ Sur mobile : height fixe en px conseillée (pas vh seul)
```

---

## Décision rapide

```
Afficher un fichier ?
├── C'est une image → <img> avec object-fit: contain + max-width/height: 100%
├── C'est un PDF statique → <iframe src="fichier.pdf#zoom=page-fit">
├── C'est un PDF uploadé dynamiquement → URL.createObjectURL() + même iframe
└── Besoin d'un composant Vue réutilisable → utiliser PdfViewer.vue ci-dessus
```
