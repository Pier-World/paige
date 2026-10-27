import { cn } from '../../lib/utils';

export function Skeleton({
  className,
  shape = 'bar',
}: {
  className?: string;
  shape?: 'bar' | 'circle' | 'block';
}) {
  return (
    <div
      className={cn(
        'skeleton-shimmer',
        shape === 'circle' ? 'rounded-full' : shape === 'block' ? 'rounded-pier-lg' : 'rounded-md',
        className
      )}
    />
  );
}
