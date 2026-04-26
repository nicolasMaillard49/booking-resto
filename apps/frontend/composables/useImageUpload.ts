export function useImageUpload() {
  const { apiFetch, getAuthHeader } = useAuth()
  const config = useRuntimeConfig()

  const MAX_SIZE = 5 * 1024 * 1024
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

  async function upload(file: File, section: string, caption?: string): Promise<{ id: string; mimeType: string; size: number }> {
    if (file.size > MAX_SIZE) throw new Error('Fichier trop volumineux (max 5 Mo)')

    const isPdf = file.type === 'application/pdf'
    let blob: Blob; let width: number | undefined; let height: number | undefined; let mimeType: string

    if (isPdf) {
      blob = file
      mimeType = 'application/pdf'
    } else {
      const r = await resizeImage(file)
      blob = r.blob; width = r.width; height = r.height; mimeType = r.mimeType
    }

    const fd = new FormData()
    fd.append('file', new File([blob], file.name, { type: mimeType }))
    fd.append('section', section)
    if (caption) fd.append('caption', caption)
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
