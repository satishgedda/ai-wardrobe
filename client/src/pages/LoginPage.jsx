import { useState } from 'react'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { getApiError } from '../lib/api-client'
import { useAuthStore } from '../store/auth-store'

function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!form.email || !form.password) return setError('Enter your email and password.')

    setIsSubmitting(true)
    try {
      await login(form)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to log in right now.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">AI Wardrobe</p>
        <h1>Welcome back.</h1>
        <p className="auth-intro">Your wardrobe, considered.</p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label>
            Email address
            <input type="email" value={form.email} autoComplete="email" onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label>
            Password
            <span className="password-field">
              <input type={showPassword ? 'text' : 'password'} value={form.password} autoComplete="current-password" onChange={(event) => setForm({ ...form, password: event.target.value })} />
              <button type="button" className="icon-button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'} <ArrowRight size={17} />
          </button>
        </form>
        <p className="auth-switch">New here? <Link to="/register">Create an account</Link></p>
      </section>
    </main>
  )
}

export default LoginPage