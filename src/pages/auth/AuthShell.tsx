import type { ReactNode } from 'react';
import { CONCIERGE_EMAIL } from '../../lib/conciergeMailto';

export const authLabelClass = 'mb-2 block text-sm font-normal text-slate';
export const authInputClass =
  'w-full rounded-pier-md border border-border bg-surface px-4 py-3.5 text-base text-ink placeholder:text-slate outline-none transition-shadow focus:border-ink/30';
export const authSecondaryClass =
  'text-left text-sm text-slate transition-colors hover:text-ink hover:underline';
export const authOtpClass =
  'h-12 w-11 rounded-pier-md border border-border bg-surface text-center text-lg text-ink outline-none focus:border-ink/30';

export function AuthBrand({ align = 'center' }: { align?: 'center' | 'left' }) {
  return (
    <div className={align === 'left' ? 'text-left' : 'text-center'}>
      <p className="font-display text-4xl font-normal tracking-tight text-ink md:text-5xl">Pier</p>
      <div className={`gilt-rule mt-4 w-12 ${align === 'left' ? '' : 'mx-auto'}`} />
      <p className="mt-3 font-sans text-sm font-light tracking-wide text-slate">Member Portal</p>
    </div>
  );
}

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-pier border border-border bg-card p-8 shadow-card md:p-10">
      {children}
    </div>
  );
}

export function AuthLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment" role="status" aria-live="polite">
      <div className="text-center">
        <p className="font-display text-[40px] leading-none tracking-[-0.02em] text-ink">Pier</p>
        <div className="gilt-rule mx-auto mt-4 w-10" />
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-parchment text-ink">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <aside className="hidden flex-col justify-center border-border px-8 md:flex md:border-r md:px-16 md:py-20 lg:px-20">
          <AuthBrand align="left" />
          <p className="mt-10 max-w-xs text-sm font-light leading-relaxed text-slate">
            Dinners, managers, and allocators — private access for Pier members.
          </p>
        </aside>

        <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 md:px-12 md:py-20">
          <div className="mb-10 md:hidden">
            <AuthBrand />
          </div>
          {children}
          <p className="mt-10 max-w-md text-center text-sm text-slate">
            Need assistance?{' '}
            <a
              href={`mailto:${CONCIERGE_EMAIL}`}
              className="underline decoration-ink/25 underline-offset-2 hover:text-ink"
            >
              {CONCIERGE_EMAIL}
            </a>
          </p>
        </main>
      </div>
    </div>
  );
}
