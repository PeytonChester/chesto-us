import { useState } from 'react'
import { doc, setDoc, updateDoc, deleteField, FieldPath } from 'firebase/firestore'
import { db } from '../../firebase'
import { useWaterLog } from '../../hooks/useWaterLog'
import WaterLogTable from '../../components/WaterLogTable'
import { PARAMS, WATER_LOG_DOC, WATER_LOG_PATH, formatTestDate } from '../../lib/waterLog'

const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD, local time

const emptyForm = () => ({ date: today(), notes: '', ...Object.fromEntries(PARAMS.map(p => [p.key, ''])) })

const toForm = r => ({
  date: r.date,
  notes: r.notes ?? '',
  ...Object.fromEntries(PARAMS.map(p => [p.key, typeof r[p.key] === 'number' ? String(r[p.key]) : ''])),
})

const INPUT = 'field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream'

export default function AdminWaterLog() {
  const { readings, loading } = useWaterLog()
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null) // date of the reading loaded into the form
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  const ref = doc(db, ...WATER_LOG_DOC)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const edit = r => {
    setForm(toForm(r))
    setEditing(r.date)
    setStatus(`Editing ${formatTestDate(r.date)}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clear = () => {
    setForm(emptyForm())
    setEditing(null)
    setStatus('')
  }

  const save = async e => {
    e.preventDefault()
    const { date } = form
    if (!date) return setStatus('Pick a date first.')
    if (date !== editing && readings.some(r => r.date === date)
      && !window.confirm(`There's already a reading for ${formatTestDate(date)}. Replace it?`)) return

    const reading = {}
    PARAMS.forEach(p => {
      const v = form[p.key].trim()
      if (v !== '' && Number.isFinite(Number(v))) reading[p.key] = Number(v)
    })
    if (form.notes.trim()) reading.notes = form.notes.trim()

    setSaving(true)
    setStatus('Saving…')
    try {
      // mergeFields replaces this one reading (so cleared values go away) and leaves the rest
      const field = new FieldPath('readings', date)
      await setDoc(ref, { readings: { [date]: reading } }, { mergeFields: [field] })
      if (editing && editing !== date) await updateDoc(ref, new FieldPath('readings', editing), deleteField())
      setEditing(date)
      setStatus(`Saved ${formatTestDate(date)}.`)
    } catch (err) {
      setStatus('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`Delete the reading for ${formatTestDate(editing)}?`)) return
    try {
      await updateDoc(ref, new FieldPath('readings', editing), deleteField())
      clear()
      setStatus('Deleted.')
    } catch (err) {
      setStatus('Delete failed: ' + err.message)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-2">
        <h1 className="font-display font-semibold text-3xl text-chesto-cream">Queso's Water Log</h1>
        <a href={WATER_LOG_PATH} target="_blank" rel="noreferrer" className="text-chesto-gold text-sm font-mono hover:underline">
          chesto.us{WATER_LOG_PATH} ↗
        </a>
      </div>
      <p className="text-chesto-cream/40 text-sm mb-8">
        Not linked anywhere on the site. Click a reading below to edit it.
      </p>

      <form onSubmit={save} className="bg-chesto-charcoal/40 border border-chesto-cream/10 p-5 md:p-6 space-y-5 mb-10">
        <h2 className="text-chesto-cream/50 text-xs tracking-widest uppercase">
          {editing ? `Editing ${formatTestDate(editing)}` : 'Add a test'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label htmlFor="wl-date" className="field-label text-chesto-cream/50">Date</label>
            <input id="wl-date" type="date" required className={`${INPUT} font-mono`} value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          {PARAMS.map(p => (
            <div key={p.key}>
              <label htmlFor={`wl-${p.key}`} className="field-label text-chesto-cream/50">
                {p.label} <span className="normal-case tracking-normal text-chesto-cream/30">{p.unit} · {p.target}</span>
              </label>
              <input
                id={`wl-${p.key}`}
                type="number"
                inputMode="decimal"
                step={p.step}
                min="0"
                className={`${INPUT} font-mono`}
                value={form[p.key]}
                onChange={e => set(p.key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div>
          <label htmlFor="wl-notes" className="field-label text-chesto-cream/50">Notes</label>
          <textarea
            id="wl-notes"
            rows={3}
            className={`${INPUT} resize-y`}
            placeholder="Water clarity, Queso's behavior, water change, ferts dosed…"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className="btn-gold text-xs disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Reading'}
          </button>
          <button type="button" onClick={clear} className="px-4 py-3 text-xs tracking-wider uppercase text-chesto-cream/60 hover:text-chesto-cream border border-chesto-cream/15">
            {editing ? 'New Reading' : 'Clear'}
          </button>
          {editing && (
            <button type="button" onClick={remove} className="px-4 py-3 text-xs tracking-wider uppercase text-red-400 hover:text-red-300">
              Delete
            </button>
          )}
          <span role="status" className="text-chesto-cream/50 text-xs">{status}</span>
        </div>
      </form>

      {loading ? (
        <p className="text-chesto-cream/40 text-sm animate-pulse">Loading…</p>
      ) : readings.length ? (
        <WaterLogTable readings={readings} dark onSelect={edit} selectedDate={editing} />
      ) : (
        <p className="text-chesto-cream/40 text-sm">No readings yet. Add the first one above.</p>
      )}
    </div>
  )
}
