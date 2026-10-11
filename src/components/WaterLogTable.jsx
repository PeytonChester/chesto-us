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
export default function WaterLogTable({ readings, dark = false, onSelect, selectedDate }) {
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
                  target {p.target}{p.unit && ` ${p.unit}`}
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
              className={`align-top border-b last:border-b-0 ${line} ${onSelect ? 'cursor-pointer hover:bg-chesto-gold/10' : ''} ${selectedDate === r.date ? 'bg-chesto-gold/10' : ''}`}
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
              <td className={`px-3 py-3 min-w-[240px] ${dark ? 'text-chesto-cream/60' : 'text-chesto-charcoal/70'}`}>{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
