// Vercel Image Optimization: resizes Firebase Storage images and serves
// AVIF/WebP from Vercel's edge cache. Widths must match `images.sizes` in
// vercel.json, and only hosts listed in `images.remotePatterns` are allowed.
export const IMAGE_WIDTHS = [128, 384, 640, 1080, 1920, 2560, 3840]

const OPTIMIZABLE_HOSTS = ['firebasestorage.googleapis.com']

function canOptimize(src) {
  // /_vercel/image only exists on Vercel deployments, not the Vite dev server
  if (!src || import.meta.env.DEV) return false
  try {
    return OPTIMIZABLE_HOSTS.includes(new URL(src).hostname)
  } catch {
    return false
  }
}

// Smallest allowed width that is at least `width`
function snapWidth(width) {
  return IMAGE_WIDTHS.find(w => w >= width) ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1]
}

export function optimizedUrl(src, width, quality = 75) {
  if (!canOptimize(src)) return src
  return `/_vercel/image?url=${encodeURIComponent(src)}&w=${snapWidth(width)}&q=${quality}`
}

/**
 * Props for a responsive <img>: `sizes` describes how wide the image is
 * displayed (e.g. "(max-width: 768px) 100vw, 33vw") so the browser can pick
 * the smallest adequate file. `maxWidth` caps the largest candidate.
 */
export function responsiveImage(src, sizes, { maxWidth = 1920, quality } = {}) {
  if (!canOptimize(src)) return { src }
  const widths = IMAGE_WIDTHS.filter(w => w >= 384 && w <= maxWidth)
  return {
    src: optimizedUrl(src, Math.min(1080, maxWidth), quality),
    srcSet: widths.map(w => `${optimizedUrl(src, w, quality)} ${w}w`).join(', '),
    sizes,
    onError: fallbackToOriginal(src),
  }
}

/** Props for a fixed-size <img> (thumbnails, covers) */
export function fixedImage(src, width, quality) {
  if (!canOptimize(src)) return { src }
  return { src: optimizedUrl(src, width, quality), onError: fallbackToOriginal(src) }
}

// If the optimizer rejects an image (e.g. usage limit reached), show the original
export function fallbackToOriginal(src) {
  return (e) => {
    const img = e.currentTarget
    if (img.dataset.fallback) return
    img.dataset.fallback = '1'
    img.removeAttribute('srcset')
    img.src = src
  }
}
