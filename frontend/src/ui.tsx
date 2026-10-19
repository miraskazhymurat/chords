import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  const styles = {
    primary: 'bg-amber-500 text-neutral-950 hover:bg-amber-400 font-semibold',
    secondary: 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700',
    ghost: 'text-neutral-300 hover:bg-neutral-800',
  }[variant]
  return (
    <button
      className={`min-h-12 rounded-xl px-4 text-base transition-colors disabled:opacity-50 ${styles} ${className}`}
      {...props}
    />
  )
}

export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-neutral-400">{label}</span>
      <input
        className="min-h-12 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 text-lg text-neutral-100 outline-none focus:border-amber-500"
        {...props}
      />
    </label>
  )
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6">
      {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-300">{children}</p>
}

export function SuccessText({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="rounded-lg bg-emerald-950/60 px-3 py-2 text-sm text-emerald-300">{children}</p>
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Что-то пошло не так'
}
