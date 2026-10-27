import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

function scrollShellToTop() {
  const main = document.querySelector('main');
  if (main) main.scrollTop = 0;
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    // Hash targets (events, profile sections) handle their own scroll.
    if (hash) return;
    scrollShellToTop();
  }, [pathname, hash]);

  return null;
};
