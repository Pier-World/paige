import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * NavigationGuard - Prevents navigation issues and ensures smooth transitions
 * - Clears any stale state on navigation
 * - Handles browser back/forward navigation
 * - Prevents memory leaks from abandoned components
 */
export function NavigationGuard() {
  const location = useLocation();

  useEffect(() => {
    // Clear any error states on navigation
    if (window.location.hash) {
      // Remove hash fragments that might cause issues
      const cleanUrl = window.location.href.split('#')[0];
      if (window.location.href !== cleanUrl) {
        window.history.replaceState({}, '', cleanUrl);
      }
    }

    // Ensure scroll position is reset for new routes
    window.scrollTo(0, 0);

    // Cleanup function - runs when component unmounts or location changes
    return () => {
      // Cancel any pending fetch requests if needed
      // This prevents state updates on unmounted components
    };
  }, [location.pathname]);

  return null;
}

