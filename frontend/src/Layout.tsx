import { Suspense } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from './auth'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 ${isActive ? 'bg-raised text-fg' : 'text-fg-muted hover:text-fg'}`

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-line bg-canvas/90 px-4 py-2 backdrop-blur">
        <NavLink to="/" className="mr-auto py-2 text-lg font-bold text-accent">
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
        <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-fg-muted hover:text-fg">
          Выйти
        </button>
      </header>
      <main className="flex-1 px-4 py-6">
        {/* ленивые страницы: пока грузится чанк, шапка остаётся на месте */}
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

/** Центрированная колонка для страниц входа/регистрации. */
export function AuthLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-3xl font-bold text-accent">{title}</h1>
        {children}
      </div>
    </div>
  )
}
