// Conversion PDF → PNG côté client (pdfjs-dist)
// Toutes les pages sont rendues puis empilées verticalement dans un seul PNG.
// Évite la barre/letterbox du viewer PDF natif du navigateur.

import * as pdfjs from 'pdfjs-dist'
// @ts-expect-error — worker importé en URL Vite
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = PdfWorker

/**
 * Convertit un fichier PDF en un seul PNG (toutes les pages empilées).
 * @param file Fichier PDF source
 * @param scale Facteur de qualité (1.5 = bon compromis, 2 = HD)
 * @returns File PNG prêt à uploader
 */
export async function pdfToPng(file: File, scale = 1.8): Promise<File> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: buffer }).promise

  // Étape 1 : rendre chaque page sur un canvas individuel
  const pages: HTMLCanvasElement[] = []
  let totalHeight = 0
  let maxWidth = 0

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D non disponible')

    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)

    await page.render({ canvasContext: ctx, viewport, canvas }).promise

    pages.push(canvas)
    totalHeight += canvas.height
    if (canvas.width > maxWidth) maxWidth = canvas.width
  }

  // Étape 2 : composer un canvas final empilé verticalement
  const final = document.createElement('canvas')
  final.width = maxWidth
  final.height = totalHeight
  const fctx = final.getContext('2d')
  if (!fctx) throw new Error('Canvas 2D non disponible')
  fctx.fillStyle = '#ffffff'
  fctx.fillRect(0, 0, final.width, final.height)

  let y = 0
  for (const c of pages) {
    fctx.drawImage(c, Math.floor((maxWidth - c.width) / 2), y)
    y += c.height
  }

  // Étape 3 : exporter en PNG
  const blob: Blob = await new Promise((resolve, reject) => {
    final.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Échec d'export PNG"))),
      'image/png',
    )
  })

  const baseName = file.name.replace(/\.pdf$/i, '')
  return new File([blob], `${baseName}.png`, { type: 'image/png' })
}
