// Parses links (or pasted embed codes) from YouTube, TikTok, Instagram and
// Twitter/X into a normalized embed description. Only the canonical URL is
// ever stored in post HTML; iframe src values are always rebuilt from the
// validated IDs here, never taken from stored content.

const YT_ID = /^[\w-]{11}$/
const NUMERIC_ID = /^\d{1,25}$/
const IG_CODE = /^[\w-]{5,40}$/

export const PROVIDER_LABELS = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  twitter: 'X / Twitter',
}

function hostIs(host, ...domains) {
  return domains.some(d => host === d || host.endsWith(`.${d}`))
}

// "90", "90s", "1m30s", "1h2m3s" -> seconds
function parseTime(t) {
  if (!t) return 0
  if (/^\d+$/.test(t)) return Number(t)
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
  if (!m) return 0
  return (Number(m[1] || 0) * 3600) + (Number(m[2] || 0) * 60) + Number(m[3] || 0)
}

function parseYouTube(url, host, parts) {
  let id = null
  let vertical = false
  if (host === 'youtu.be') {
    id = parts[0]
  } else if (parts[0] === 'watch') {
    id = url.searchParams.get('v')
  } else if (parts[0] === 'shorts') {
    id = parts[1]
    vertical = true
  } else if (['embed', 'live', 'v'].includes(parts[0])) {
    id = parts[1]
  } else if (parts[0] === 'clip') {
    return { error: 'YouTube clip links can’t be embedded directly. Open the clip, click Share → Embed, and paste that embed code instead.' }
  }
  if (!id || !YT_ID.test(id)) return null

  const start = parseTime(url.searchParams.get('t') || url.searchParams.get('start'))
  const clip = url.searchParams.get('clip')
  const clipt = url.searchParams.get('clipt')
  const isClip = Boolean(clip && clipt && /^[\w-]+$/.test(clip) && /^[\w-]+$/.test(clipt))

  let canonical
  const embedParams = new URLSearchParams({ rel: '0' })
  if (isClip) {
    // Clips only exist as embed URLs carrying clip/clipt tokens
    canonical = `https://www.youtube.com/embed/${id}?clip=${clip}&clipt=${clipt}`
    embedParams.set('clip', clip)
    embedParams.set('clipt', clipt)
  } else if (vertical) {
    canonical = `https://www.youtube.com/shorts/${id}`
  } else {
    canonical = `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}s` : ''}`
    if (start) embedParams.set('start', String(start))
  }

  const embedHost = isClip ? 'www.youtube.com' : 'www.youtube-nocookie.com'
  return {
    provider: 'youtube',
    id,
    url: canonical,
    src: `https://${embedHost}/embed/${id}?${embedParams}`,
    layout: vertical ? 'vertical' : 'video',
  }
}

function parseTikTok(host, parts) {
  if (host.startsWith('vm.') || host.startsWith('vt.') || parts[0] === 't') {
    return { error: 'TikTok short links can’t be embedded. Open the link in your browser and paste the full tiktok.com/@user/video/… address instead.' }
  }
  let id = null
  let user = null
  if (parts[0]?.startsWith('@') && parts[1] === 'video') {
    user = parts[0].slice(1)
    id = parts[2]
  } else if (parts[0] === 'embed') {
    id = parts[1] === 'v2' ? parts[2] : parts[1]
  } else if (parts[0] === 'player' && parts[1] === 'v1') {
    id = parts[2]
  } else if (parts[0] === 'v') {
    id = parts[1]?.replace(/\.html$/, '')
  }
  if (!id || !NUMERIC_ID.test(id)) return null
  const safeUser = user && /^[\w.]+$/.test(user) ? user : ''
  return {
    provider: 'tiktok',
    id,
    url: `https://www.tiktok.com/@${safeUser}/video/${id}`,
    src: `https://www.tiktok.com/player/v1/${id}?description=1&music_info=1&rel=0`,
    layout: 'vertical',
  }
}

function parseInstagram(parts) {
  // /p/CODE, /reel/CODE, /reels/CODE, /tv/CODE, optionally after /username/
  const i = parts.findIndex(p => ['p', 'reel', 'reels', 'tv'].includes(p))
  const code = i >= 0 ? parts[i + 1] : null
  if (!code || !IG_CODE.test(code)) return null
  const kind = parts[i] === 'reels' ? 'reel' : parts[i]
  return {
    provider: 'instagram',
    id: code,
    url: `https://www.instagram.com/${kind}/${code}/`,
    src: `https://www.instagram.com/p/${code}/embed/captioned/`,
    layout: 'card',
    initialHeight: 720,
  }
}

function parseTwitter(url, host, parts) {
  let id = null
  if (host === 'platform.twitter.com') {
    id = url.searchParams.get('id')
  } else {
    const i = parts.findIndex(p => p === 'status' || p === 'statuses')
    if (i >= 0) id = parts[i + 1]
  }
  if (!id || !NUMERIC_ID.test(id)) return null
  return {
    provider: 'twitter',
    id,
    url: `https://x.com/i/status/${id}`,
    src: `https://platform.twitter.com/embed/Tweet.html?id=${id}&dnt=true&theme=light`,
    layout: 'card',
    initialHeight: 560,
  }
}

function parseUrl(raw) {
  let url
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  } catch {
    return null
  }
  if (!/^https?:$/.test(url.protocol)) return null
  const host = url.hostname.toLowerCase()
  const parts = url.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be' || hostIs(host, 'youtube.com', 'youtube-nocookie.com')) return parseYouTube(url, host, parts)
  if (hostIs(host, 'tiktok.com')) return parseTikTok(host, parts)
  if (hostIs(host, 'instagram.com')) return parseInstagram(parts)
  if (hostIs(host, 'twitter.com', 'x.com')) return parseTwitter(url, host, parts)
  return null
}

/**
 * Accepts a plain link or a full embed code copied from the platform's
 * Share → Embed option. Returns an embed description, `{ error }` with a
 * user-facing hint for known-but-unembeddable links, or null.
 */
export function parseEmbed(input) {
  const text = (input || '').trim().replace(/&amp;/g, '&')
  if (!text) return null

  const candidates = /^\S+$/.test(text)
    ? [text]
    : text.match(/https?:\/\/[^\s"'<>]+/gi) || []

  let firstError = null
  for (const candidate of candidates) {
    const result = parseUrl(candidate)
    if (result && !result.error) return result
    if (result?.error && !firstError) firstError = result
  }
  return firstError
}
