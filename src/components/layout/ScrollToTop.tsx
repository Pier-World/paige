import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  // Use useLayoutEffect to prevent scroll BEFORE render
  useLayoutEffect(() => {
    // Disable browser scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // Force scroll to top immediately when route changes
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  // Also use useEffect as backup
  useEffect(() => {
    // Ensure we're at top after route change
    const timeouts = [
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 0),
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 50),
    ];
    
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [pathname]);

  return null;
};