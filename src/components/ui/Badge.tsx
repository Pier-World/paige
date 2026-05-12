import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant =
  | 'default'
  | 'members'
  | 'open'
  | 'closing'
  | 'closed'
  | 'pending'
  | 'muted'
  | 'danger';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-ink text-parchment',
  members: 'bg-gilt text-ink',
  open: 'bg-ledger text-parchment',
  closing: 'bg-gilt text-ink',
  closed: 'bg-ink/10 text-slate',
  pending: 'bg-midnight text-parchment',
  muted: 'bg-border text-slate',
  danger: 'bg-danger/10 text-danger',
};

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[2px] px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em]',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusDot({ status }: { status: 'active' | 'pending' | 'inactive' | 'closed' }) {
  const colors = {
    active: 'bg-ledger',
    pending: 'bg-gilt',
    inactive: 'bg-slate',
    closed: 'bg-danger',
  };

  return <span className={cn('inline-block h-1.5 w-1.5 rounded-full', colors[status])} />;
}
