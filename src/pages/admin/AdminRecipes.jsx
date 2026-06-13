import { Link } from 'react-router-dom'
import { deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCollection } from '../../hooks/useCollection'

export default function AdminRecipes() {
  const { docs: recipes, loading } = useCollection('recipes', 'createdAt', 'desc')

  const handleDelete = async (recipe) => {
    if (!window.confirm(`Delete "${recipe.title}"?`)) return
    await deleteDoc(doc(db, 'recipes', recipe.id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-semibold text-3xl text-chesto-cream mb-1">Recipes</h1>
          <p className="text-chesto-cream/40 text-sm">{recipes.length} recipes</p>
        </div>
        <Link to="/admin/recipes/new" className="btn-gold">+ New Recipe</Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-chesto-charcoal/20 animate-pulse" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center gap-4 border border-chesto-cream/10">
          <p className="text-chesto-cream/20 text-sm tracking-wider">No recipes yet</p>
          <Link to="/admin/recipes/new" className="btn-gold text-xs">Add your first recipe</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {recipes.map(recipe => (
            <div key={recipe.id} className="flex items-center gap-4 bg-chesto-charcoal/20 px-4 py-3 group hover:bg-chesto-charcoal/30 transition-colors">
              {recipe.imageUrl && (
                <img src={recipe.imageUrl} alt={recipe.title} className="w-12 h-12 object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-chesto-cream font-body font-medium truncate">{recipe.title}</p>
                <p className="text-chesto-cream/40 text-xs">{recipe.category} · {recipe.prepTime || '—'}</p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link to={`/admin/recipes/${recipe.id}/edit`} className="text-xs text-chesto-gold hover:text-chesto-gold-light px-3 py-1.5 border border-chesto-gold/30 hover:border-chesto-gold transition-colors">
                  Edit
                </Link>
                <button onClick={() => handleDelete(recipe)} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-500/30 hover:border-red-400 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
