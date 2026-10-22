import { useState, useEffect, useRef } from 'react'
import { PARAMS, formatTestDate } from '../lib/waterLog'
import { Chip } from './WaterLogTable'

// One small line chart per parameter (value over test date), shown under the
// table on the public page. Plain SVG, sized to its card with a ResizeObserver.

const H = 200
const PAD = { top: 14, right: 16, bottom: 28, left: 40 }
const DOT = { ok: '#4C7A5A', warn: '#D97706', bad: '#DC2626' }
const STATUS = { ok: 'in range', warn: 'keep an eye on', bad: 'act now' }
const DAY = 86400000

const toTime = iso => Date.parse(`${iso}T00:00:00Z`)
const shortDate = t => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

// ~4 round y ticks covering [lo, hi]
function niceTicks(lo, hi) {
  const span = hi - lo || Math.abs(hi) || 1
  const raw = span / 4
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw)
  const start = Math.floor(lo / step) * step
  const end = Math.ceil(hi / step) * step
  const ticks = []
  for (let v = start; v <= end + step / 2; v += step) ticks.push(+v.toFixed(6))
  return ticks
}

// x ticks picked from the test dates themselves, at least `gap` px apart.
// The newest date always gets a label.
function dateTicks(points, x, gap) {
  const ticks = []
  for (const { t } of [...points].reverse()) {
    if (!ticks.length || x(ticks[ticks.length - 1]) - x(t) >= gap) ticks.push(t)
  }
  return ticks.reverse()
}

function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

function ParamChart({ param, readings }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(null)

  const points = readings
    .filter(r => typeof r[param.key] === 'number')
    .map(r => ({ date: r.date, t: toTime(r.date), v: r[param.key] }))
    .sort((a, b) => a.t - b.t)
  const latest = points[points.length - 1]
  const unit = param.unit ? ` ${param.unit}` : ''

  const [bandLo, bandHi] = param.band
  const vals = points.map(p => p.v)
  const zeroBased = bandLo === 0 || Math.min(...vals) <= 0
  let lo = zeroBased ? 0 : Math.min(...vals, bandLo)
  let hi = Math.max(...vals, bandHi)
  if (!zeroBased) lo -= (hi - lo) * 0.15
  hi += (hi - lo) * 0.1
  const yTicks = niceTicks(lo, hi)
  const y0 = yTicks[0]
  const y1 = yTicks[yTicks.length - 1]

  const tMin = points[0]?.t ?? 0
  const tMax = points.length > 1 ? latest.t : tMin + DAY
  const innerW = Math.max(width - PAD.left - PAD.right, 0)
  const innerH = H - PAD.top - PAD.bottom
  const x = t => PAD.left + (points.length > 1 ? (t - tMin) / (tMax - tMin) * innerW : innerW / 2)
  const y = v => PAD.top + (1 - (v - y0) / (y1 - y0)) * innerH
  const xTicks = dateTicks(points, x, 64)
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join('')

  const onMove = e => {
    const box = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - box.left
    let best = null
    for (const p of points) if (!best || Math.abs(x(p.t) - px) < Math.abs(x(best.t) - px)) best = p
    setHover(best)
  }

  return (
    <figure className="border border-chesto-charcoal/10 bg-white p-4 md:p-5 m-0">
      <figcaption className="flex items-baseline justify-between gap-3 mb-3">
        <span>
          <span className="font-display font-semibold text-lg text-chesto-dark">{param.label}</span>
          <span className="ml-2 font-mono text-[11px] text-chesto-charcoal/50">target {param.target}{unit}</span>
        </span>
        {latest && <Chip rating={param.rate(latest.v)}>{latest.v}{unit}</Chip>}
      </figcaption>
      <div ref={ref} className="relative" style={{ height: H }}>
        {!points.length ? (
          <p className="h-full flex items-center justify-center text-sm text-chesto-charcoal/40">No readings yet</p>
        ) : width > 0 && (
          <>
            <svg
              width={width}
              height={H}
              role="img"
              aria-label={`${param.label} over time, latest ${latest.v}${unit} on ${formatTestDate(latest.date)}`}
              className="block touch-pan-y select-none"
              onPointerMove={onMove}
              onPointerDown={onMove}
              onPointerLeave={() => setHover(null)}
            >
              {bandHi > bandLo && (
                <rect
                  x={PAD.left}
                  width={innerW}
                  y={y(Math.min(bandHi, y1))}
                  height={Math.max(y(Math.max(bandLo, y0)) - y(Math.min(bandHi, y1)), 0)}
                  fill="#4C7A5A"
                  fillOpacity="0.08"
                />
              )}
              {yTicks.map(v => (
                <g key={v}>
                  <line x1={PAD.left} x2={PAD.left + innerW} y1={y(v)} y2={y(v)} stroke="#2e2b27" strokeOpacity={v === y0 ? 0.25 : 0.07} />
                  <text x={PAD.left - 8} y={y(v)} dy="0.32em" textAnchor="end" className="font-mono" fontSize="10" fill="#2e2b27" fillOpacity="0.5">{v}</text>
                </g>
              ))}
              {xTicks.map(t => (
                <text
                  key={t}
                  x={x(t)}
                  y={H - 8}
                  textAnchor={points.length < 2 ? 'middle' : t === tMin ? 'start' : t === tMax ? 'end' : 'middle'}
                  className="font-mono"
                  fontSize="10"
                  fill="#2e2b27"
                  fillOpacity="0.5"
                >
                  {shortDate(t)}
                </text>
              ))}
              {hover && <line x1={x(hover.t)} x2={x(hover.t)} y1={PAD.top} y2={PAD.top + innerH} stroke="#2e2b27" strokeOpacity="0.2" strokeDasharray="3 3" />}
              <path d={path} fill="none" stroke="#2e2b27" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {points.map(p => (
                <circle
                  key={p.date}
                  cx={x(p.t)}
                  cy={y(p.v)}
                  r={hover?.date === p.date ? 6 : 4.5}
                  fill={DOT[param.rate(p.v)]}
                  stroke="#fff"
                  strokeWidth="2"
                />
              ))}
            </svg>
            {hover && (
              <div
                className="pointer-events-none absolute z-10 whitespace-nowrap bg-chesto-dark text-chesto-cream px-2.5 py-1.5 text-xs shadow-lg"
                style={{
                  left: Math.min(Math.max(x(hover.t), 60), width - 60),
                  top: Math.max(y(hover.v) - 12, 0),
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <span className="block font-mono text-[10px] text-chesto-cream/60">{formatTestDate(hover.date)}</span>
                <span className="font-mono">{hover.v}{unit}</span>
                <span className="ml-1.5 text-chesto-cream/60">{STATUS[param.rate(hover.v)]}</span>
              </div>
            )}
          </>
        )}
      </div>
    </figure>
  )
}

export default function WaterLogCharts({ readings }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {PARAMS.map(p => <ParamChart key={p.key} param={p} readings={readings} />)}
    </div>
  )
}
