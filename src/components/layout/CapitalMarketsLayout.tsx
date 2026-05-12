import type { ReactNode } from 'react';
import { CapitalMarketsSidebar } from './CapitalMarketsSidebar';

interface CapitalMarketsLayoutProps {
  children: ReactNode;
}

export function CapitalMarketsLayout({ children }: CapitalMarketsLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-parchment">
      <CapitalMarketsSidebar />
      <main className="flex flex-1 flex-col overflow-y-auto pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
