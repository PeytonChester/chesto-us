import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { PARAMS, formatTestDate } from '../lib/waterLog'

const CHIP = {
  ok: 'bg-chesto-sage/15 text-chesto-sage',
  warn: 'bg-amber-100 text-amber-800',
  bad: 'bg-red-100 text-red-700',
}
const CHIP_DARK = {
  ok: 'bg-chesto-sage/25 text-green-300',
  warn: 'bg-amber-500/15 text-amber-300',
  bad: 'bg-red-500/15 text-red-300',
}

export function Chip({ rating, dark, children }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full font-mono text-xs tabular-nums whitespace-nowrap ${(dark ? CHIP_DARK : CHIP)[rating]}`}>
      {children}
    </span>
  )
}

// The readings table, used on the public page (light) and in the admin (dark).
// Scrolls sideways on narrow screens. onSelect makes rows clickable.
// Notes stay out of the table (so rows stay short); their button opens them in a lightbox.
export default function WaterLogTable({ readings, dark = false, onSelect, selectedDate }) {
  const [notesFor, setNotesFor] = useState(null) // the reading whose notes are open
  const line = dark ? 'border-chesto-cream/10' : 'border-chesto-charcoal/10'
  const muted = dark ? 'text-chesto-cream/40' : 'text-chesto-charcoal/50'
  return (
    <div className={`overflow-x-auto border ${line} ${dark ? 'bg-chesto-charcoal/40' : 'bg-white'}`}>
      <table className="w-full min-w-[860px] border-collapse text-sm">
        <thead>
          <tr>
            <th className={`px-3 py-3 text-left text-xs font-medium tracking-wider uppercase border-b ${line} ${muted}`}>Date</th>
            {PARAMS.map(p => (
              <th key={p.key} className={`px-3 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap ${p.key === 'ph' ? '' : 'uppercase'} border-b ${line} ${muted}`}>
                {p.label}
                <small className="block normal-case tracking-normal font-mono font-normal text-[11px]">
                  {p.target}{p.unit && ` ${p.unit}`}
                </small>
              </th>
            ))}
            <th className={`px-3 py-3 text-left text-xs font-medium tracking-wider uppercase border-b ${line} ${muted}`}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {readings.map(r => (
            <tr
              key={r.date}
              onClick={onSelect ? () => onSelect(r) : undefined}
              className={`align-middle border-b last:border-b-0 ${line} ${onSelect ? 'cursor-pointer hover:bg-chesto-gold/10' : ''} ${selectedDate === r.date ? 'bg-chesto-gold/10' : ''}`}
            >
              <td className={`px-3 py-3 font-mono text-xs whitespace-nowrap ${dark ? 'text-chesto-cream' : ''}`}>{formatTestDate(r.date)}</td>
              {PARAMS.map(p => {
                const v = r[p.key]
                return (
                  <td key={p.key} className="px-3 py-3">
                    {typeof v === 'number'
                      ? <Chip rating={p.rate(v)} dark={dark}>{v}</Chip>
                      : <span className={muted}>—</span>}
                  </td>
                )
              })}
              <td className="px-3 py-3">
                {r.notes ? (
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={e => { e.stopPropagation(); setNotesFor(r) }}
                    className={`whitespace-nowrap text-xs font-medium tracking-wider uppercase transition-colors ${dark ? 'text-chesto-gold hover:text-chesto-gold-light' : 'text-chesto-charcoal/60 hover:text-chesto-dark'}`}
                  >
                    View
                  </button>
                ) : (
                  <span className={muted}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {notesFor && <NotesLightbox reading={notesFor} onClose={() => setNotesFor(null)} />}
    </div>
  )
}

function NotesLightbox({ reading, onClose }) {
  const closeRef = useRef(null)

  // Esc closes; the page behind doesn't scroll while it's open
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-chesto-dark/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wl-notes-title"
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-chesto-cream text-chesto-dark p-6 md:p-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close notes"
          className="absolute top-3 right-3 h-9 w-9 flex items-center justify-center text-2xl leading-none text-chesto-charcoal/50 hover:text-chesto-dark"
        >
          ×
        </button>
        <p className="section-label mb-2">Notes</p>
        <h2 id="wl-notes-title" className="font-display font-semibold text-2xl mb-4">{formatTestDate(reading.date)}</h2>
        <p className="font-body text-sm leading-relaxed text-chesto-charcoal/80 whitespace-pre-line">{reading.notes}</p>
      </div>
    </div>,
    document.body
  )
}
