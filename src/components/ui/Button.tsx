import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loading?: boolean;
  children?: ReactNode;
}

const variantClasses = {
  primary: 'border-ink bg-ink text-parchment hover:bg-ink/90 dark:border-gilt dark:bg-gilt dark:text-ink dark:hover:bg-gilt/90',
  secondary: 'border-border bg-transparent text-text-primary hover:border-ink/30 hover:bg-ink/[0.04] dark:hover:border-parchment/30 dark:hover:bg-parchment/[0.08]',
  outline: 'border-border bg-transparent text-text-primary hover:border-ink/30 hover:bg-ink/[0.04] dark:hover:border-parchment/30 dark:hover:bg-parchment/[0.08]',
  ghost: 'border-transparent bg-transparent text-text-primary hover:bg-ink/[0.04] dark:hover:bg-parchment/[0.08]',
  danger: 'border-danger bg-danger text-parchment hover:bg-danger/90',
};

const sizeClasses = {
  sm: 'h-8 rounded-[6px] px-3 text-[13px]',
  md: 'h-11 rounded-[8px] px-5 text-[14px]',
  lg: 'h-[52px] rounded-[8px] px-6 text-[15px]',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const busy = isLoading || loading;

  return (
    <button
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 border font-medium transition-colors duration-150 active:scale-[0.99] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={busy || disabled}
      {...props}
    >
      {busy ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        null
      )}
      {children}
    </button>
  );
};