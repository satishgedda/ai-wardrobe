import { BookHeart, Shirt, Sparkles, UserRound, WandSparkles } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth-store'

const links = [
  { to: '/', label: 'Overview', icon: Sparkles },
  { to: '/wardrobe', label: 'Wardrobe', icon: Shirt },
  { to: '/recommendations', label: "Today's outfit", icon: WandSparkles },
  { to: '/stylist', label: 'AI stylist', icon: BookHeart },
  { to: '/outfits', label: 'Saved outfits', icon: BookHeart },
]

function AppShell({ children }) {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <NavLink className="brand-mark" to="/"><span>AW</span><strong>AI Wardrobe</strong></NavLink>
        <nav className="app-nav" aria-label="Main navigation">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `app-nav-link ${isActive ? 'app-nav-link-active' : ''}`}><Icon size={17} /><span>{label}</span></NavLink>)}</nav>
        <div className="sidebar-footer"><NavLink className="profile-link" to="/profile"><span className="avatar-mark">{user?.name?.slice(0, 1).toUpperCase()}</span><span><strong>{user?.name || 'Your profile'}</strong><small>Preferences</small></span><UserRound size={15} /></NavLink><button className="sidebar-logout" type="button" onClick={handleLogout}>Sign out</button></div>
      </aside>
      <div className="app-main"><header className="mobile-header"><NavLink className="brand-mark" to="/"><span>AW</span><strong>AI Wardrobe</strong></NavLink><NavLink className="mobile-profile" to="/profile"><UserRound size={18} /></NavLink></header><nav className="mobile-nav" aria-label="Mobile navigation">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`}><Icon size={16} /><span>{label}</span></NavLink>)}</nav>{children}</div>
    </div>
  )
}

export default AppShell
