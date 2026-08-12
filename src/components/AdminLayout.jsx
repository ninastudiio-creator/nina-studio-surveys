import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png'

export default function AdminLayout({ children }) {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.2em 1.5em',
        background: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="Nina Studio" className="logo-header" />
        </Link>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          התנתקות
        </button>
      </header>
      <main className="container">{children}</main>
    </div>
  )
}
