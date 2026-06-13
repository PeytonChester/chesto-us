import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebase'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/admin')
    } catch (err) {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-chesto-dark flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <span className="font-display font-semibold text-2xl text-chesto-cream">
            Chesto<span className="text-chesto-gold">.</span>us
          </span>
          <p className="text-chesto-cream/40 text-xs tracking-widest uppercase mt-2">Admin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label text-chesto-cream/50">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream placeholder-chesto-cream/20 focus:border-chesto-gold"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="field-label text-chesto-cream/50">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream placeholder-chesto-cream/20 focus:border-chesto-gold"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm font-body">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gold justify-center mt-2 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
