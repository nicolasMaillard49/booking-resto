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

<script setup lang="ts">
const props = withDefaults(defineProps<{
  src: string
  height?: string
  width?: string
  aspectRatio?: string  // ex: '1 / 1.414' (A4 portrait) — prioritaire sur height
  zoom?: string         // page-fit | page-width | 50 | 75 | 100 | etc.
  toolbar?: boolean
  navpanes?: boolean
}>(), {
  height: '600px',
  width: '100%',
  aspectRatio: '1 / 1.414',
  zoom: 'page-width',
  toolbar: false,
  navpanes: false,
})

const iframeSrc = computed(() => {
  const params = [
    `zoom=${props.zoom}`,
    `toolbar=${props.toolbar ? 1 : 0}`,
    `navpanes=${props.navpanes ? 1 : 0}`,
    'view=FitH',
  ].join('&')
  return `${props.src}#${params}`
})

const containerStyle = computed(() => {
  const base: Record<string, string> = {
    width: props.width,
    overflow: 'hidden',
    position: 'relative',
  }
  if (props.aspectRatio) base.aspectRatio = props.aspectRatio
  else base.height = props.height
  return base
})
</script>

<style scoped>
.pdf-container {
  background: transparent;
  border: none;
}
.pdf-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  background: transparent;
}
.pdf-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999999;
}
</style>
