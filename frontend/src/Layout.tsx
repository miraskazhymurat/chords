import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from './auth'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 ${isActive ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:text-neutral-100'}`

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-neutral-900 bg-neutral-950/90 px-4 py-2 backdrop-blur">
        <NavLink to="/" className="mr-auto py-2 text-lg font-bold text-amber-500">
          Аккорды
        </NavLink>
        <NavLink to="/profile" className={linkClass}>
          {user?.username}
        </NavLink>
        {user?.role === 'ADMIN' && (
          <NavLink to="/admin" className={linkClass}>
            Админка
          </NavLink>
        )}
        <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-neutral-400 hover:text-neutral-100">
          Выйти
        </button>
      </header>
      <main className="flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

/** Центрированная колонка для страниц входа/регистрации. */
export function AuthLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-3xl font-bold text-amber-500">{title}</h1>
        {children}
      </div>
    </div>
  )
}
