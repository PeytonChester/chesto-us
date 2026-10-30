// Queso's water log: one Firestore doc (settings/waterLog) holding every
// reading in a `readings` map keyed by test date ("2026-10-11"). It lives
// under settings/ so the existing Firestore rules already cover it (public
// read, signed-in write). Shared by the public page and the admin editor.
// Tank photos uploaded in admin sit in the same doc's `photos` map, keyed by
// id, with the files under settings/water-log/ in Storage.
// The server (api/_waterLog.js) also uses this file to put the whole log in
// the page's HTML and to serve /queso-water-log.json and .md.

export const WATER_LOG_PATH = '/queso-water-log'
export const WATER_LOG_DOC = ['settings', 'waterLog']
export const WATER_LOG_STORAGE_DIR = 'settings/water-log'

export const WATER_LOG_INTRO = "API liquid test results for Queso's planted 10-gallon. Readings turn amber or red when they drift outside the target range, or when pH swings more than 0.3 from the last test."

export const TANK = [
  ['Tank', '12×12×16 in, about 10 gal'],
  ['Fish', 'Queso the betta'],
  ['Set up', 'Oct 10, 2026'],
]

// target / watch / act: the ranges as text, for 'ok' / 'warn' / 'bad'
// band: the target range as numbers, shaded on the charts
// rate(value) -> 'ok' | 'warn' | 'bad'
// swing: [warn, bad] change from the previous test that also flags a reading
export const PARAMS = [
  { key: 'ammonia', label: 'Ammonia', unit: 'ppm', target: '0', watch: '0.25', act: 'above 0.25', band: [0, 0], rate: v => v === 0 ? 'ok' : v <= 0.25 ? 'warn' : 'bad' },
  { key: 'nitrite', label: 'Nitrite', unit: 'ppm', target: '0', watch: '0.25', act: 'above 0.25', band: [0, 0], rate: v => v === 0 ? 'ok' : v <= 0.25 ? 'warn' : 'bad' },
  { key: 'nitrate', label: 'Nitrate', unit: 'ppm', target: '0–20', watch: '20–40', act: 'above 40', band: [0, 20], rate: v => v <= 20 ? 'ok' : v <= 40 ? 'warn' : 'bad' },
  { key: 'ph', label: 'pH', unit: '', target: '6.5–8.2', watch: '6–6.5 or 8.2–8.6, or a swing over 0.3', act: 'outside 6–8.6, or a swing over 0.5', band: [6.5, 8.2], rate: v => v >= 6.5 && v <= 8.2 ? 'ok' : v >= 6 && v <= 8.6 ? 'warn' : 'bad', swing: [0.3, 0.5] },
  { key: 'kh', label: 'KH', unit: 'dKH', target: '2–25', watch: '1–2 or 25–30', act: 'below 1 or above 30', band: [2, 25], rate: v => v >= 2 && v <= 25 ? 'ok' : v >= 1 && v <= 30 ? 'warn' : 'bad' },
  { key: 'gh', label: 'GH', unit: 'dGH', target: '6–16', watch: '3–6 or 16–20', act: 'below 3 or above 20', band: [6, 16], rate: v => v >= 6 && v <= 16 ? 'ok' : v >= 3 && v <= 20 ? 'warn' : 'bad' },
  { key: 'fe', label: 'Iron', unit: 'ppm', target: '0.1–0.5', watch: 'below 0.1', act: 'above 0.5', band: [0.1, 0.5], rate: v => v >= 0.1 && v <= 0.5 ? 'ok' : v < 0.1 ? 'warn' : 'bad' },
  { key: 'po4', label: 'Phosphate', unit: 'ppm', target: '0.5–2', watch: 'below 0.5 or 2–5', act: 'above 5', band: [0.5, 2], rate: v => v >= 0.5 && v <= 2 ? 'ok' : v <= 5 ? 'warn' : 'bad' },
]

const LEVELS = ['ok', 'warn', 'bad']
export const RATING_LABELS = { ok: 'in range', warn: 'keep an eye on', bad: 'act now' }

/** "2026-10-11" -> "October 11, 2026" */
export const formatLongDate = iso =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

// Photos that ship with the site (public/water-log/); uploads are added to these
export const BUNDLED_PHOTOS = [
  {
    date: '2026-10-29', small: '/water-log/tank-2026-10-29-640.webp', url: '/water-log/tank-2026-10-29-full.webp', width: 1929,
    alt: 'Queso, a white betta, at the left of a planted 10-gallon tank with spiderwood, anubias and Amazon swords, under a thick mat of hornwort and floating plants',
  },
  {
    date: '2026-10-23', small: '/water-log/tank-2026-10-23-640.webp', url: '/water-log/tank-2026-10-23-full.webp', width: 1942,
    alt: 'Queso, a white betta, swimming above spiderwood and spotted anubias in a planted 10-gallon tank, with hornwort hanging from the surface',
  },
  {
    date: '2026-10-11', small: '/water-log/tank-2026-10-11-640.webp', url: '/water-log/tank-2026-10-11-full.webp', width: 1966,
    alt: "Queso's planted 10-gallon tank with spiderwood, newly tied-on anubias, Amazon swords and an aquarium thermometer, with Queso near the surface",
  },
].map(p => ({ ...p, id: p.date, thumb: p.small }))

/** Uploaded + bundled photos, newest first, each with a date title and alt text */
export function allPhotos(uploaded = []) {
  return [...uploaded, ...BUNDLED_PHOTOS]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(p => ({ ...p, title: formatLongDate(p.date), alt: p.alt || `Queso's planted 10-gallon tank on ${formatLongDate(p.date)}` }))
}

/** The test just before `date` in a newest-first readings array */
export function previousTest(readings, date) {
  return date ? readings.find(r => r.date < date) : undefined
}

/** A value's rating, made worse by a swing from the previous test's value
 * (skipped when that test didn't record this parameter) */
export function rateReading(param, value, prev) {
  const rating = param.rate(value)
  const before = prev?.[param.key]
  if (!param.swing || typeof before !== 'number') return rating
  const change = Math.round(Math.abs(value - before) * 1000) / 1000 // 7.4 - 7.1 is 0.30000000000000027
  const [warn, bad] = param.swing
  const swing = change > bad ? 'bad' : change > warn ? 'warn' : 'ok'
  return LEVELS[Math.max(LEVELS.indexOf(rating), LEVELS.indexOf(swing))]
}

/** settings/waterLog data -> readings array, newest first */
export function readingsFrom(data) {
  return Object.entries(data?.readings ?? {})
    .map(([date, r]) => ({ ...r, date }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** settings/waterLog data -> uploaded tank photos, newest first */
export function photosFrom(data) {
  return Object.entries(data?.photos ?? {})
    .map(([id, p]) => ({ ...p, id }))
    .filter(p => p.url && p.date)
    .sort((a, b) => b.date.localeCompare(a.date) || (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0))
}

/** "2026-10-11" -> "10/11/26" */
export function formatTestDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '')
  return m ? `${m[2]}/${m[3]}/${m[1].slice(2)}` : iso
}
