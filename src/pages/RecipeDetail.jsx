import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '../firebase'
import PageMeta from '../components/PageMeta'

function parseFraction(val) {
  if (val === null || val === undefined || val === '') return null
  const s = String(val).trim()
  if (!isNaN(Number(s))) return Number(s)
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3])
  const frac = s.match(/^(\d+)\/(\d+)$/)
  if (frac) return Number(frac[1]) / Number(frac[2])
  return null
}

function formatFraction(num) {
  const whole = Math.floor(num)
  const dec = num - whole
  const candidates = [
    [0, ''], [1/8, '1/8'], [1/4, '1/4'], [1/3, '1/3'], [3/8, '3/8'],
    [1/2, '1/2'], [5/8, '5/8'], [2/3, '2/3'], [3/4, '3/4'], [7/8, '7/8'],
  ]
  let bestStr = '', bestDist = Infinity
  for (const [v, s] of candidates) {
    const d = Math.abs(dec - v)
    if (d < bestDist) { bestDist = d; bestStr = s }
  }
  if (Math.abs(dec - 1) < bestDist) return String(whole + 1)
  if (!bestStr) return String(whole)
  return whole ? `${whole} ${bestStr}` : bestStr
}

export default function RecipeDetail() {
  const { slug } = useParams()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [servings, setServings] = useState(null)
  const [checked, setChecked] = useState({})

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, 'recipes'), where('slug', '==', slug), limit(1))
      const snap = await getDocs(q)
      if (!snap.empty) {
        const data = { id: snap.docs[0].id, ...snap.docs[0].data() }
        setRecipe(data)
        setServings(data.servings || 4)
      }
      setLoading(false)
    }
    fetch()
  }, [slug])

  const toggle = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }))

  const scale = (amount) => {
    if (!recipe?.servings || !amount) return amount
    const parsed = parseFraction(amount)
    if (parsed === null) return amount
    const scaled = (parsed / recipe.servings) * servings
    return formatFraction(Math.round(scaled * 1000) / 1000)
  }

  if (loading) return (
    <div className="pt-16 max-w-3xl mx-auto px-6 md:px-10 py-24 animate-pulse space-y-6">
      <div className="h-4 bg-chesto-charcoal/10 w-24" />
      <div className="h-10 bg-chesto-charcoal/10 w-2/3" />
      <div className="h-64 bg-chesto-charcoal/10 w-full" />
    </div>
  )

  if (!recipe) return (
    <div className="pt-16 max-w-3xl mx-auto px-6 md:px-10 py-24 text-center">
      <p className="text-chesto-charcoal/40 text-sm tracking-widest uppercase">Recipe not found</p>
      <Link to="/recipes" className="btn-ghost mt-6 inline-flex">← Back to Recipes</Link>
    </div>
  )

  const rawNotes = recipe.notes
  const filledNotes = (Array.isArray(rawNotes) ? rawNotes : (rawNotes ? [rawNotes] : [])).filter(Boolean)

  return (
    <article className="pt-16">
      <PageMeta title={recipe.title} description={recipe.excerpt} image={recipe.imageUrl} />
      {/* Hero image */}
      {recipe.imageUrl && (
        <div className="w-full h-[50vh] md:h-[65vh] overflow-hidden">
          <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 md:px-10 py-14">
        <Link to="/recipes" className="section-label text-chesto-charcoal/50 hover:text-chesto-gold transition-colors mb-6 inline-block">
          ← Recipes
        </Link>

        <p className="section-label mb-3">{recipe.category}</p>
        <h1 className="display-heading text-4xl md:text-6xl mb-4 leading-tight">{recipe.title}</h1>
        <p className="text-chesto-charcoal/60 font-body text-lg leading-relaxed mb-8">{recipe.excerpt}</p>

        {/* Meta row */}
        <div className="flex flex-wrap gap-6 py-6 border-y border-chesto-charcoal/10 mb-12 font-mono text-sm">
          {recipe.prepTime && <div><span className="text-chesto-charcoal/40 block text-xs mb-0.5 uppercase tracking-wider">Prep</span>{recipe.prepTime}</div>}
          {recipe.cookTime && <div><span className="text-chesto-charcoal/40 block text-xs mb-0.5 uppercase tracking-wider">Cook</span>{recipe.cookTime}</div>}
          {recipe.difficulty && <div><span className="text-chesto-charcoal/40 block text-xs mb-0.5 uppercase tracking-wider">Difficulty</span>{recipe.difficulty}</div>}
        </div>

        {/* Servings scaler */}
        {recipe.servings && (
          <div className="bg-chesto-charcoal/5 px-6 py-5 mb-10 flex items-center gap-6">
            <span className="text-sm font-body text-chesto-charcoal/60 tracking-wider uppercase text-xs">Servings</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setServings(s => Math.max(1, s - 1))} className="w-8 h-8 flex items-center justify-center border border-chesto-charcoal/20 hover:border-chesto-dark transition-colors text-lg leading-none">−</button>
              <span className="font-display font-semibold text-2xl w-10 text-center">{servings}</span>
              <button onClick={() => setServings(s => s + 1)} className="w-8 h-8 flex items-center justify-center border border-chesto-charcoal/20 hover:border-chesto-dark transition-colors text-lg leading-none">+</button>
            </div>
          </div>
        )}

        {/* Ingredients + Notes */}
        <div className="grid md:grid-cols-12 gap-10 mb-12">
          {recipe.ingredients?.length > 0 && (
            <section className={filledNotes.length ? 'md:col-span-8' : 'md:col-span-12'}>
              <h2 className="display-heading text-2xl mb-6">Ingredients</h2>
              <ul className="space-y-3">
                {recipe.ingredients.map((ing, i) => {
                  const key = `ing-${i}`
                  return (
                    <li
                      key={key}
                      onClick={() => toggle(key)}
                      className={`flex items-start gap-3 cursor-pointer group transition-opacity duration-200 ${checked[key] ? 'opacity-40' : ''}`}
                    >
                      <span className={`mt-1 w-4 h-4 flex-shrink-0 border transition-colors duration-200 ${checked[key] ? 'bg-chesto-gold border-chesto-gold' : 'border-chesto-charcoal/30 group-hover:border-chesto-dark'}`} />
                      <span className={`font-body text-base ${checked[key] ? 'line-through' : ''}`}>
                        {ing.amount && <strong className="font-medium">{scale(ing.amount)}{ing.unit ? ` ${ing.unit}` : ''} </strong>}
                        {ing.name}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {filledNotes.length > 0 && (
            <section className="md:col-span-4 border-l-2 border-chesto-gold pl-6 py-2">
              <h3 className="section-label mb-4">Notes</h3>
              <ul className="space-y-3">
                {filledNotes.map((note, i) => (
                  <li key={i} className="flex gap-3 font-body text-sm text-chesto-charcoal/70 leading-relaxed">
                    <span className="text-chesto-gold flex-shrink-0">—</span>
                    {note}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Instructions */}
        {recipe.instructions?.length > 0 && (
          <section className="mb-12">
            <h2 className="display-heading text-2xl mb-6">Instructions</h2>
            <ol className="space-y-8">
              {recipe.instructions.map((step, i) => {
                const text = typeof step === 'string' ? step : step.text
                const substeps = typeof step === 'string' ? [] : (step.substeps || [])
                return (
                  <li key={i}>
                    <div className="flex gap-6">
                      <span className="font-display font-semibold text-3xl text-chesto-gold/40 leading-none mt-1 flex-shrink-0 w-8">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p className="font-body text-base leading-relaxed text-chesto-charcoal/80 pt-1">{text}</p>
                    </div>
                    {substeps.length > 0 && (
                      <ol className="mt-4 ml-8 md:ml-14 space-y-3">
                        {substeps.map((sub, j) => (
                          <li key={j} className="flex gap-4">
                            <span className="font-mono text-xs text-chesto-gold/40 leading-none mt-1 flex-shrink-0 w-6">
                              {i + 1}{String.fromCharCode(97 + j)}
                            </span>
                            <p className="font-body text-sm leading-relaxed text-chesto-charcoal/60">{sub}</p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                )
              })}
            </ol>
          </section>
        )}

      </div>
    </article>
  )
}
