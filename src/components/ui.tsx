import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/** Shared UI primitives — large tap targets & readable text (PRD §2). */

export function Screen({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-full bg-[var(--color-mint)] pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-[var(--color-leaf)] px-4 py-4 text-white shadow">
        <button
          onClick={() => navigate('/')}
          aria-label="Back to home"
          className="rounded-full p-2 hover:bg-white/15"
        >
          <ArrowLeft size={26} />
        </button>
        <h1 className="text-xl font-bold">{title}</h1>
      </header>
      <main className="mx-auto max-w-xl px-4 py-4">{children}</main>
    </div>
  );
}

export function PrimaryButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full rounded-2xl bg-[var(--color-leaf)] px-5 py-4 text-lg font-bold text-white shadow-md transition active:scale-[0.98] disabled:opacity-50 ${props.className ?? ''}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-base font-semibold text-gray-700">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border-2 border-[var(--color-mint-border)] bg-white px-4 py-3 text-lg outline-none focus:border-[var(--color-leaf)]"
      />
    </label>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border-2 border-[var(--color-mint-border)] bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
