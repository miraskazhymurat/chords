import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover font-semibold',
  secondary: 'bg-raised text-fg hover:bg-raised-hover',
  ghost: 'text-fg hover:bg-raised',
}

/** Классы кнопки — и для <button>, и для ссылки, которая выглядит как кнопка. */
export function buttonClass(variant: ButtonVariant = 'primary', className = ''): string {
  return `inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-base transition-colors disabled:opacity-50 ${buttonStyles[variant]} ${className}`
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={buttonClass(variant, className)} {...props} />
}

export const inputClass =
  'w-full rounded-xl border border-line bg-surface px-4 text-lg text-fg outline-none focus:border-accent'

export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-fg-muted">{label}</span>
      <input className={`min-h-12 ${inputClass}`} {...props} />
    </label>
  )
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface/60 p-4 sm:p-6">
      {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="rounded-lg bg-danger-bg/60 px-3 py-2 text-sm text-danger-fg">{children}</p>
}

export function SuccessText({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="rounded-lg bg-success-bg/60 px-3 py-2 text-sm text-success-fg">{children}</p>
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Что-то пошло не так'
}
