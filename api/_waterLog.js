import { SITE, getDoc, fromFields, shareImage, escapeHtml } from './_seo.js'
import {
  PARAMS, TANK, RATING_LABELS, WATER_LOG_DOC, WATER_LOG_INTRO, WATER_LOG_PATH,
  readingsFrom, photosFrom, allPhotos, rateReading, formatLongDate,
} from '../src/lib/waterLog.js'

// Queso's water log for clients that don't run JS: a plain-HTML copy for the
// page's #root (via pageMeta) and the /queso-water-log.json and .md files
// (api/water-log.js). The page itself stays noindex.

const TITLE = "Queso's Water Log"

/** settings/waterLog -> { readings (newest first), photos (uploaded + bundled) }. Throws if Firestore fails. */
export async function loadWaterLog() {
  const data = fromFields((await getDoc(WATER_LOG_DOC.join('/')))?.fields)
  return { readings: readingsFrom(data), photos: allPhotos(photosFrom(data)) }
}

const withUnit = (p, v) => `${v}${p.unit ? ` ${p.unit}` : ''}`
const photoUrl = p => p.url.startsWith('/') ? `${SITE}${p.url}` : p.url

/** Each reading's tested values with their rating (range plus pH swing) */
function results(readings) {
  return readings.map((r, i) => ({
    ...r,
    results: PARAMS.filter(p => typeof r[p.key] === 'number')
      .map(p => ({ param: p, value: r[p.key], rating: rateReading(p, r[p.key], readings[i + 1]) })),
  }))
}

export function waterLogHtml({ readings, photos }) {
  const tested = results(readings)
  return [
    `<h1>${escapeHtml(TITLE)}</h1>`,
    `<p>${escapeHtml(WATER_LOG_INTRO)}</p>`,
    `<ul>${TANK.map(([k, v]) => `<li><b>${escapeHtml(k)}</b> ${escapeHtml(v)}</li>`).join('')}</ul>`,
    `<p>The full log is also available as <a href="${WATER_LOG_PATH}.json">JSON</a> and <a href="${WATER_LOG_PATH}.md">Markdown</a>.</p>`,
    '<h2>Target ranges</h2>',
    '<table><thead><tr><th>Test</th><th>Healthy</th><th>Keep an eye on</th><th>Act now</th></tr></thead><tbody>',
    ...PARAMS.map(p => `<tr><td>${escapeHtml(p.label)}${p.unit ? ` (${p.unit})` : ''}</td><td>${escapeHtml(p.target)}</td><td>${escapeHtml(p.watch)}</td><td>${escapeHtml(p.act)}</td></tr>`),
    '</tbody></table>',
    '<h2>Readings</h2>',
    tested.length ? '' : '<p>No readings yet.</p>',
    ...tested.map(r =>
      `<section><h3><time datetime="${r.date}">${formatLongDate(r.date)}</time></h3>` +
      `<ul>${r.results.map(x => `<li>${escapeHtml(x.param.label)}: ${escapeHtml(withUnit(x.param, x.value))} (${RATING_LABELS[x.rating]})</li>`).join('')}</ul>` +
      (r.notes ? `<p>Notes: ${escapeHtml(r.notes)}</p>` : '') +
      '</section>'),
    '<h2>Tank photos</h2>',
    ...photos.map(p =>
      `<figure><img src="${escapeHtml(p.small ? `${SITE}${p.small}` : shareImage(p.url))}" alt="${escapeHtml(p.alt)}" loading="lazy" width="640" />` +
      `<figcaption>${escapeHtml(p.title)}: ${escapeHtml(p.alt)}</figcaption></figure>`),
  ].join('')
}

export function waterLogJson({ readings, photos }) {
  return {
    title: TITLE,
    url: `${SITE}${WATER_LOG_PATH}`,
    description: WATER_LOG_INTRO,
    tank: Object.fromEntries(TANK),
    ranges: PARAMS.map(p => ({ test: p.label, unit: p.unit || null, healthy: p.target, keepAnEyeOn: p.watch, actNow: p.act })),
    readings: results(readings).map(r => ({
      date: r.date,
      results: Object.fromEntries(r.results.map(x => [x.param.label, { value: x.value, unit: x.param.unit || null, status: RATING_LABELS[x.rating] }])),
      notes: r.notes || null,
    })),
    photos: photos.map(p => ({ date: p.date, url: photoUrl(p), description: p.alt })),
  }
}

// Image alt text can't contain brackets or line breaks
const mdAlt = s => String(s).replace(/[[\]\n]+/g, ' ')

export function waterLogMarkdown({ readings, photos }) {
  return [
    `# ${TITLE}`,
    '',
    WATER_LOG_INTRO,
    '',
    ...TANK.map(([k, v]) => `- **${k}:** ${v}`),
    '',
    `Page: ${SITE}${WATER_LOG_PATH}`,
    '',
    '## Target ranges',
    '',
    '| Test | Healthy | Keep an eye on | Act now |',
    '| --- | --- | --- | --- |',
    ...PARAMS.map(p => `| ${p.label}${p.unit ? ` (${p.unit})` : ''} | ${p.target} | ${p.watch} | ${p.act} |`),
    '',
    '## Readings',
    '',
    ...(readings.length ? [] : ['No readings yet.', '']),
    ...results(readings).flatMap(r => [
      `### ${formatLongDate(r.date)}`,
      '',
      ...r.results.map(x => `- ${x.param.label}: ${withUnit(x.param, x.value)} (${RATING_LABELS[x.rating]})`),
      ...(r.notes ? ['', `Notes: ${r.notes}`] : []),
      '',
    ]),
    '## Tank photos',
    '',
    ...photos.map(p => `- ${p.title}: ![${mdAlt(p.alt)}](${photoUrl(p)})`),
    '',
  ].join('\n')
}
