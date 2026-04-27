export function useImageUpload() {
  const { apiFetch, getAuthHeader } = useAuth()
  const config = useRuntimeConfig()

  const MAX_SIZE = 10 * 1024 * 1024
  const MAX_DIMENSION = 2000
  const QUALITY = 0.85

  async function resizeImage(file: File): Promise<{ blob: Blob; width: number; height: number; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(blob => {
          if (!blob) return reject(new Error('Conversion image échouée'))
          resolve({ blob, width, height, mimeType: 'image/jpeg' })
        }, 'image/jpeg', QUALITY)
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  async function upload(
    file: File,
    section: string,
    options?: { caption?: string; convertPdf?: boolean },
  ): Promise<{ id: string; mimeType: string; size: number }> {
    if (file.size > MAX_SIZE) throw new Error('Fichier trop volumineux (max 10 Mo)')

    const isPdf = file.type === 'application/pdf'
    const convert = options?.convertPdf !== false // défaut : true

    // PDF → conversion en PNG si activée, sinon upload tel quel
    let workFile = file
    let convertedToPng = false
    if (isPdf && convert) {
      const { pdfToPng } = await import('~/utils/pdfToPng')
      workFile = await pdfToPng(file)
      convertedToPng = true
    }

    let blob: Blob; let mimeType: string
    let width: number | undefined; let height: number | undefined
    let outName: string
    if (isPdf && !convert) {
      blob = workFile
      mimeType = 'application/pdf'
      outName = workFile.name
    } else if (convertedToPng) {
      blob = workFile
      mimeType = 'image/png'
      outName = workFile.name
    } else {
      const r = await resizeImage(workFile)
      blob = r.blob; width = r.width; height = r.height; mimeType = r.mimeType
      outName = workFile.name.replace(/\.[^.]+$/, '.jpg')
    }

    const fd = new FormData()
    fd.append('file', new File([blob], outName, { type: mimeType }))
    fd.append('section', section)
    if (options?.caption) fd.append('caption', options.caption)
    if (width)  fd.append('width', String(width))
    if (height) fd.append('height', String(height))

    return $fetch(`${config.public.apiUrl}/admin/images`, {
      method: 'POST',
      body: fd,
      headers: getAuthHeader(),
    })
  }

  return { upload }
}
