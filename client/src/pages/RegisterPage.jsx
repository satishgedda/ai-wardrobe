import { useState } from 'react'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getApiError } from '../lib/api-client'
import { useAuthStore } from '../store/auth-store'

function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, user } = useAuthStore()
  const navigate = useNavigate()

  if (user) return <Navigate to="/" replace />

  function updateField(field, value) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (form.name.trim().length < 2) return setError('Name must be at least 2 characters.')
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a valid email address.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')

    setIsSubmitting(true)
    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to create your account right now.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">AI Wardrobe</p>
        <h1>Make room for better days.</h1>
        <p className="auth-intro">Begin with what you already own.</p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label>
            Your name
            <input value={form.name} autoComplete="name" onChange={(event) => updateField('name', event.target.value)} />
          </label>
          <label>
            Email address
            <input type="email" value={form.email} autoComplete="email" onChange={(event) => updateField('email', event.target.value)} />
          </label>
          <label>
            Password
            <span className="password-field">
              <input type={showPassword ? 'text' : 'password'} value={form.password} autoComplete="new-password" onChange={(event) => updateField('password', event.target.value)} />
              <button type="button" className="icon-button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'} <ArrowRight size={17} />
          </button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </section>
    </main>
  )
}

export default RegisterPage