<template>
  <div class="rt-editor border" style="border-color: #e5e5e5; background-color: #ffffff;">
    <!-- Toolbar -->
    <div class="flex items-center gap-1 px-2 py-1.5 border-b flex-wrap" style="border-color: #e5e5e5; background-color: #fafafa;">
      <button type="button" @mousedown.prevent="exec('bold')" :class="btnClass" title="Gras (Ctrl+B)">
        <strong>B</strong>
      </button>
      <button type="button" @mousedown.prevent="exec('italic')" :class="btnClass" title="Italique (Ctrl+I)">
        <em>I</em>
      </button>
      <button type="button" @mousedown.prevent="exec('underline')" :class="btnClass" title="Souligné (Ctrl+U)">
        <span style="text-decoration: underline;">U</span>
      </button>
      <span class="w-px h-5 bg-neutral-200 mx-1"></span>
      <button type="button" @mousedown.prevent="exec('justifyLeft')" :class="btnClass" title="Aligner à gauche">⫷</button>
      <button type="button" @mousedown.prevent="exec('justifyCenter')" :class="btnClass" title="Centrer">≡</button>
      <button type="button" @mousedown.prevent="exec('justifyRight')" :class="btnClass" title="Aligner à droite">⫸</button>
      <span class="w-px h-5 bg-neutral-200 mx-1"></span>
      <button type="button" @mousedown.prevent="exec('insertUnorderedList')" :class="btnClass" title="Liste à puces">• Liste</button>
      <button type="button" @mousedown.prevent="exec('insertOrderedList')" :class="btnClass" title="Liste numérotée">1. Liste</button>
      <span class="w-px h-5 bg-neutral-200 mx-1"></span>
      <button type="button" @mousedown.prevent="exec('removeFormat')" :class="btnClass" title="Supprimer le formatage">⌫ Format</button>
    </div>

    <!-- Zone éditable -->
    <div
      ref="editorRef"
      contenteditable="true"
      class="rt-content px-3 py-2 outline-none whitespace-pre-wrap leading-relaxed"
      :style="{ minHeight: minHeight, fontSize: '15px', color: '#111111' }"
      @input="onInput"
      @blur="onBlur"
      @paste="onPaste"
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  minHeight?: string
}>(), {
  minHeight: '160px',
})
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

const editorRef = ref<HTMLDivElement | null>(null)
const btnClass = 'px-2.5 py-1 text-sm hover:bg-neutral-200 transition border border-transparent active:bg-neutral-300'

const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'BR', 'P', 'DIV', 'UL', 'OL', 'LI', 'SPAN'])

function sanitize(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  walk(tmp)
  return tmp.innerHTML
}
function walk(node: Node) {
  const children = Array.from(node.childNodes)
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement
      if (!ALLOWED_TAGS.has(el.tagName)) {
        // Garde le texte, supprime la balise
        const parent = el.parentNode!
        while (el.firstChild) parent.insertBefore(el.firstChild, el)
        parent.removeChild(el)
      } else {
        // Strip dangerous attrs ; on garde uniquement text-align et align (justify*)
        for (const attr of Array.from(el.attributes)) {
          if (attr.name === 'style') {
            const m = /text-align\s*:\s*(left|center|right|justify)/i.exec(attr.value)
            if (m) el.setAttribute('style', `text-align: ${m[1].toLowerCase()};`)
            else el.removeAttribute('style')
          } else if (attr.name === 'align') {
            const v = attr.value.toLowerCase()
            if (['left', 'center', 'right', 'justify'].includes(v)) {
              el.setAttribute('style', `text-align: ${v};`)
            }
            el.removeAttribute('align')
          } else if (attr.name.startsWith('on') || attr.name === 'class') {
            el.removeAttribute(attr.name)
          }
        }
        walk(el)
      }
    } else if (child.nodeType === Node.COMMENT_NODE) {
      child.parentNode?.removeChild(child)
    }
  }
}

function exec(cmd: string) {
  editorRef.value?.focus()
  // Force CSS inline (text-align: ...) plutôt que l'attribut <p align="..."> deprecated.
  // Sans ça, certains navigateurs (Chrome) suppriment juste l'alignement courant
  // et le bloc retombe sur l'héritage parent (text-center) → tout reste centré.
  try { document.execCommand('styleWithCSS', false, 'true') } catch { /* ignore */ }
  document.execCommand(cmd, false)

  // Sécurité supplémentaire pour les alignements : applique l'inline style sur le bloc parent
  // de chaque ligne sélectionnée pour qu'elle override l'héritage CSS parent.
  if (cmd === 'justifyLeft' || cmd === 'justifyCenter' || cmd === 'justifyRight') {
    const align = cmd.replace('justify', '').toLowerCase()
    forceAlignOnSelection(align)
  }

  emitChange()
}

function forceAlignOnSelection(align: string) {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  const root = editorRef.value
  if (!root) return

  // Récupère tous les blocs (p, div, li, h*) dans la sélection
  const blocks = new Set<HTMLElement>()
  const isBlock = (n: Node | null): n is HTMLElement =>
    n != null && n.nodeType === Node.ELEMENT_NODE &&
    ['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes((n as HTMLElement).tagName)

  // Trouve le bloc ancêtre d'un noeud
  const findBlock = (n: Node | null): HTMLElement | null => {
    while (n && n !== root) {
      if (isBlock(n)) return n as HTMLElement
      n = n.parentNode
    }
    return null
  }

  // Cas simple : sélection unique → un seul bloc
  const startBlock = findBlock(range.startContainer)
  const endBlock = findBlock(range.endContainer)
  if (startBlock) blocks.add(startBlock)
  if (endBlock) blocks.add(endBlock)

  // Multi-bloc : itère sur tous les <p>, <div>, etc. intersectés par la range
  const all = root.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6')
  all.forEach((el) => {
    if (range.intersectsNode(el)) blocks.add(el as HTMLElement)
  })

  blocks.forEach((b) => { b.style.textAlign = align })
}

function onInput() { emitChange() }
function onBlur() { emitChange() }

function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const cd = e.clipboardData
  if (!cd) return

  const html = cd.getData('text/html')
  if (html && html.trim()) {
    // Sanitise le HTML collé (garde gras/italique/listes/sauts) puis l'insère
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    walk(tmp)
    document.execCommand('insertHTML', false, tmp.innerHTML)
    return
  }

  // Fallback : texte brut, conversion des sauts de ligne en <br>
  const text = cd.getData('text/plain') ?? ''
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n|\r/g, '\n')
    .split('\n\n')
    .map(p => p.replace(/\n/g, '<br>'))
    .map(p => `<p>${p}</p>`)
    .join('')
  document.execCommand('insertHTML', false, escaped)
}

function emitChange() {
  if (!editorRef.value) return
  const clean = sanitize(editorRef.value.innerHTML)
  emit('update:modelValue', clean)
}

// Sync externe → editor
watch(() => props.modelValue, (v) => {
  if (!editorRef.value) return
  if (editorRef.value.innerHTML !== (v ?? '')) {
    editorRef.value.innerHTML = v ?? ''
  }
}, { immediate: false })

onMounted(() => {
  if (editorRef.value && props.modelValue) {
    editorRef.value.innerHTML = props.modelValue
  }
})
</script>

<style scoped>
.rt-content :deep(p) { margin: 0 0 0.5em; }
.rt-content :deep(ul), .rt-content :deep(ol) { padding-left: 1.5em; margin: 0.25em 0; }
.rt-content :deep(b), .rt-content :deep(strong) { font-weight: 700; }
.rt-content[contenteditable="true"]:empty::before {
  content: attr(data-placeholder);
  color: #999999;
}
</style>
