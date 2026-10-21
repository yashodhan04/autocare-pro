import { useState, useEffect } from 'react';

/**
 * useMediaQuery — Reactive media query hook with safe guards.
 *
 * @param {string} query  CSS media query string, e.g. '(max-width: 1023px)'
 * @returns {boolean}     true when the query matches
 */
export function useMediaQuery(query) {
  const getMatch = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    try {
      return Boolean(window.matchMedia(query).matches);
    } catch {
      return false;
    }
  };

  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    try {
      const mql = window.matchMedia(query);
      const handler = (e) => setMatches(Boolean(e.matches));

      if (mql.addEventListener) {
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
      }
      if (mql.addListener) {
        mql.addListener(handler);
        return () => mql.removeListener(handler);
      }
    } catch {
      // Fallback if matchMedia fails
    }
  }, [query]);

  return matches;
}
