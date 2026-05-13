/**
 * Recover from stale cached HTML referencing removed Vite chunks (SPA fallback
 * returns index.html as text/html for missing /assets/* — pair with Netlify
 * Cache-Control on index vs hashed assets).
 */
const CHUNK_RELOAD_SESSION_KEY = '__pier_chunk_reload_attempted';

export function isChunkLoadError(error: unknown): boolean {
  if (error == null) return false;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string'
        ? (error as { message: string }).message
        : String(error);
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Unable to preload CSS')
  );
}

export function importWithChunkReloadOnce<T>(importer: () => Promise<T>): Promise<T> {
  return importer()
    .then((mod) => {
      try {
        sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
      } catch {
        // ignore private mode / blocked storage
      }
      return mod;
    })
    .catch((error: unknown) => {
      if (!isChunkLoadError(error)) {
        throw error;
      }
      try {
        if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
          throw error;
        }
        sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, '1');
      } catch {
        // storage unavailable — still try one reload
      }
      window.location.reload();
      return new Promise(() => {});
    });
}
