// Queso's water log: one Firestore doc (settings/waterLog) holding every
// reading in a `readings` map keyed by test date ("2026-10-11"). It lives
// under settings/ so the existing Firestore rules already cover it (public
// read, signed-in write). Shared by the public page and the admin editor.

export const WATER_LOG_PATH = '/queso-water-log'
export const WATER_LOG_DOC = ['settings', 'waterLog']

export const TANK = [
  ['Tank', '12×12×16 in, about 10 gal'],
  ['Fish', 'Queso the betta'],
  ['Set up', 'Oct 10, 2026'],
]

// rate(value) -> 'ok' | 'warn' | 'bad'
export const PARAMS = [
  { key: 'ammonia', label: 'Ammonia', unit: 'ppm', target: '0', step: '0.25', rate: v => v === 0 ? 'ok' : v <= 0.25 ? 'warn' : 'bad' },
  { key: 'nitrite', label: 'Nitrite', unit: 'ppm', target: '0', step: '0.25', rate: v => v === 0 ? 'ok' : v <= 0.25 ? 'warn' : 'bad' },
  { key: 'nitrate', label: 'Nitrate', unit: 'ppm', target: '0–20', step: '5', rate: v => v <= 20 ? 'ok' : v <= 40 ? 'warn' : 'bad' },
  { key: 'ph', label: 'pH', unit: '', target: '6.5–7.5', step: '0.1', rate: v => v >= 6.5 && v <= 7.5 ? 'ok' : v >= 6 && v <= 8 ? 'warn' : 'bad' },
  { key: 'kh', label: 'KH', unit: 'dKH', target: '3–8', step: '1', rate: v => v >= 3 && v <= 8 ? 'ok' : v >= 2 && v <= 10 ? 'warn' : 'bad' },
  { key: 'gh', label: 'GH', unit: 'dGH', target: '4–12', step: '1', rate: v => v >= 4 && v <= 12 ? 'ok' : v >= 3 && v <= 15 ? 'warn' : 'bad' },
  { key: 'fe', label: 'Iron', unit: 'ppm', target: '0.1–0.5', step: '0.05', rate: v => v >= 0.1 && v <= 0.5 ? 'ok' : v < 0.1 ? 'warn' : 'bad' },
  { key: 'po4', label: 'Phosphate', unit: 'ppm', target: '0.5–2', step: '0.25', rate: v => v >= 0.5 && v <= 2 ? 'ok' : v <= 5 ? 'warn' : 'bad' },
]

/** settings/waterLog data -> readings array, newest first */
export function readingsFrom(data) {
  return Object.entries(data?.readings ?? {})
    .map(([date, r]) => ({ ...r, date }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function formatTestDate(iso) {
  const d = new Date(`${iso}T12:00:00`)
  return isNaN(d) ? iso : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}
