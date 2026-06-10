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
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          {subtitle && <p className="mt-0.5 text-gray-500">{subtitle}</p>}
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
      <span className="mb-1 block text-base font-semibold text-gray-700">{label}</span>
      <select
        {...props}
        className="w-full appearance-none rounded-xl border-2 border-[var(--color-mint-border)] bg-white bg-[right_0.75rem_center] bg-no-repeat px-4 py-3 text-lg outline-none focus:border-[var(--color-leaf)]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='%231B5E20' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
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
    <div className={`rounded-2xl border-2 border-[var(--color-mint-border)] bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
