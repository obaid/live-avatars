export const MODELS = Object.freeze({
  image: 'fal-ai/nano-banana-2/edit',
  video: 'minimax/h3-max-turbo/image-to-video',
})

export function validateRequest(body) {
  if (!body || typeof body !== 'object') throw Error('Invalid request.')
  const { kind, prompt, reference } = body
  if (!Object.hasOwn(MODELS,kind)) throw Error('Choose image or video generation.')
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 3000) throw Error('Prompt must be 1–3000 characters.')
  if (typeof reference !== 'string' || reference.length > 11_000_000 || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(reference)) throw Error('Upload a PNG, JPEG, or WebP image under 8 MB.')
  return { kind, prompt: prompt.trim(), reference }
}

export function inputFor({ kind, prompt, reference }) {
  if (kind === 'image') return { prompt, image_urls: [reference], num_images: 1, aspect_ratio: '1:1', resolution: '1K', output_format: 'png', limit_generations: true }
  return { prompt, image_url: reference, end_image_url: reference, duration: 5, resolution: '480P', prompt_expansion_mode: 'disabled', enable_safety_checker: true }
}

export function queueUrl(value) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.hostname !== 'queue.fal.run' || url.username || url.password) throw Error('Unexpected fal queue URL.')
  return url.href
}

export function mediaUrl(value) {
  const url = new URL(value)
  const host = url.hostname.toLowerCase()
  if (url.protocol !== 'https:' || url.username || url.password || !(host === 'storage.googleapis.com' || host === 'fal.media' || host.endsWith('.fal.media') || host === 'fal.ai' || host.endsWith('.fal.ai'))) throw Error('Unexpected media host in fal result.')
  return url.href
}

export function resultMedia(kind, result) {
  const data = result?.data ?? result
  const file = kind === 'image' ? data?.images?.[0] : data?.video
  if (!file || typeof file.url !== 'string') throw Error('fal returned no usable media.')
  return mediaUrl(file.url)
}
