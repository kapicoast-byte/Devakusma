import { X } from 'lucide-react';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';

/** Shared UI primitives — large tap targets & readable text (PRD §2). */

export function Screen({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-[15px] text-gray-500">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
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
      className={`w-full rounded-xl bg-[var(--color-leaf)] px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[var(--color-leaf-strong)] active:scale-[0.99] disabled:opacity-50 ${props.className ?? ''}`}
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
      <span className="mb-1.5 block text-sm font-medium text-gray-600">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2.5 text-base text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[var(--color-leaf)] focus:ring-4 focus:ring-[var(--color-leaf)]/10"
      />
    </label>
  );
}

export function Select({
  label,
  options,
  placeholder,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-sm font-medium text-gray-600">{label}</span>
      <select
        {...props}
        className="w-full appearance-none rounded-xl border border-[var(--border)] bg-white bg-[right_0.75rem_center] bg-no-repeat px-3.5 py-2.5 text-base text-gray-900 shadow-sm outline-none transition focus:border-[var(--color-leaf)] focus:ring-4 focus:ring-[var(--color-leaf)]/10"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/** Brief confirmation toast pinned to the bottom of the screen. */
export function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-5 py-3 font-semibold text-white shadow-lg">
      {message}
    </div>
  );
}

/** Centered modal on desktop, bottom sheet on mobile. */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/50 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-[var(--border)] bg-white p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
