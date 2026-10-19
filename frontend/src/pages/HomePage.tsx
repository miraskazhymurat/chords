import { useAuth } from '../auth'

export function HomePage() {
  const { user } = useAuth()
  return (
    <div className="py-10 text-center">
      <h1 className="text-2xl font-semibold">Привет, {user?.username}!</h1>
      <p className="mt-3 text-neutral-500">Песни появятся здесь совсем скоро.</p>
    </div>
  )
}
