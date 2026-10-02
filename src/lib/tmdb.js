// TMDB serves every image at fixed widths (https://image.tmdb.org/t/p/<size>/<file>).
// Reviews store a single URL (posters/cast at w500, backdrops at "original",
// which can be ~4000px and several MB); these helpers swap in the size each
// spot actually needs.
const TMDB_IMAGE = /^(https:\/\/image\.tmdb\.org\/t\/p\/)[^/]+(\/.+)$/

const WIDTHS = {
  poster: [92, 154, 185, 342, 500, 780],
  backdrop: [300, 780, 1280],
  profile: [45, 185],
}

function sized(url, width) {
  const m = url?.match(TMDB_IMAGE)
  return m ? `${m[1]}w${width}${m[2]}` : url
}

/** One TMDB image at the smallest available width >= `width` */
export function tmdbUrl(url, kind, width) {
  const widths = WIDTHS[kind]
  return sized(url, widths.find(w => w >= width) ?? widths[widths.length - 1])
}

/** Props for a responsive TMDB <img>; non-TMDB URLs are passed through */
export function tmdbImage(url, kind, sizes, { maxWidth = Infinity } = {}) {
  if (!url || !TMDB_IMAGE.test(url)) return { src: url }
  const widths = WIDTHS[kind].filter((w, i) => w <= maxWidth || i === 0)
  return {
    src: sized(url, widths[Math.min(widths.length - 1, 3)]),
    srcSet: widths.map(w => `${sized(url, w)} ${w}w`).join(', '),
    sizes,
  }
}
