import { useCallback, useEffect, useRef, useState } from 'react';
import { describeCapitalLoadFailure } from './async';

const cache = new Map<string, unknown>();

type Bucket<T> = {
  key: string;
  nonce: number;
  data: T | undefined;
  loading: boolean;
  error: string | null;
};

function readCache<T>(key: string): T | undefined {
  return cache.has(key) ? (cache.get(key) as T) : undefined;
}

function initialBucket<T>(key: string, nonce: number): Bucket<T> {
  const data = readCache<T>(key);
  return {
    key,
    nonce,
    data,
    loading: data === undefined,
    error: null,
  };
}

/**
 * Loads capital-markets data once per key and keeps the last result so
 * navigating back does not blank the page. A failed refresh keeps the
 * cached result on screen.
 */
export function useCapitalLoad<T>(key: string, load: () => Promise<T>, fallback: string) {
  const loadRef = useRef(load);
  loadRef.current = load;
  const [nonce, setNonce] = useState(0);
  const [bucket, setBucket] = useState<Bucket<T>>(() => initialBucket(key, 0));

  if (bucket.key !== key || bucket.nonce !== nonce) {
    setBucket(initialBucket(key, nonce));
  }

  useEffect(() => {
    let ignore = false;

    loadRef
      .current()
      .then((value) => {
        if (ignore) return;
        cache.set(key, value);
        setBucket((current) => {
          if (current.key !== key || current.nonce !== nonce) return current;
          return { ...current, data: value, loading: false, error: null };
        });
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setBucket((current) => {
          if (current.key !== key || current.nonce !== nonce) return current;
          if (current.data !== undefined) return { ...current, loading: false };
          return {
            ...current,
            loading: false,
            error: describeCapitalLoadFailure(err, fallback),
          };
        });
      });

    return () => {
      ignore = true;
    };
  }, [key, nonce, fallback]);

  const reload = useCallback(() => {
    cache.delete(key);
    setNonce((current) => current + 1);
  }, [key]);

  const replace = useCallback(
    (value: T) => {
      cache.set(key, value);
      setBucket((current) => {
        if (current.key !== key) return current;
        return { ...current, data: value, loading: false, error: null };
      });
    },
    [key]
  );

  return {
    data: bucket.key === key ? bucket.data : readCache<T>(key),
    loading: bucket.key === key ? bucket.loading && bucket.data === undefined : !cache.has(key),
    error: bucket.key === key && bucket.data === undefined ? bucket.error : null,
    reload,
    replace,
  };
}
