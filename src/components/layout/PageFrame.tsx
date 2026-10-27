import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function PageFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('page-frame', className)}>{children}</div>;
}
