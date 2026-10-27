import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  children: ReactNode;
};

export function Chip({ active = false, className, children, type = 'button', ...props }: ChipProps) {
  return (
    <button
      type={type}
      className={cn('chip', active && 'chip-active', className)}
      {...props}
    >
      {children}
    </button>
  );
}
