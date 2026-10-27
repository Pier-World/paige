import { useEffect, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { CapitalMarketsSidebar } from './CapitalMarketsSidebar';
import { LoadingState } from '../../pages/capital-markets/PageStates';

function warmCapitalRoutes() {
  void import('../../pages/capital-markets/DashboardPage');
  void import('../../pages/capital-markets/DealsPage');
  void import('../../pages/capital-markets/DealDetailPage');
  void import('../../pages/capital-markets/CapitalMarketsEventsPage');
  void import('../../pages/capital-markets/PartnersPage');
  void import('../../pages/capital-markets/CapitalProfilePage');
}

export function CapitalMarketsLayout() {
  useEffect(() => {
    const idleId = window.requestIdleCallback?.(warmCapitalRoutes);
    const timerId = idleId === undefined ? window.setTimeout(warmCapitalRoutes, 250) : undefined;
    return () => {
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-parchment">
      <CapitalMarketsSidebar />
      <main className="flex flex-1 flex-col overflow-y-auto pt-14 lg:pt-0">
        <Suspense
          fallback={
            <div className="page-frame">
              <div className="mb-10 space-y-3">
                <div className="skeleton-shimmer h-3 w-20 rounded-md" />
                <div className="skeleton-shimmer h-8 w-64 max-w-full rounded-md" />
                <div className="gilt-rule mt-6 w-12" />
              </div>
              <LoadingState label="Loading page" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
