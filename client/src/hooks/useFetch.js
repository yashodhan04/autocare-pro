import { useCallback, useEffect, useRef, useState } from 'react';
import { get, parseError } from '../services/api.js';

/**
 * useFetch(url, params) — loads a GET endpoint and tracks loading/error.
 * Pass url = null to skip. `reload()` refetches; stale responses are ignored.
 * Returns { data, pagination, loading, error, reload, setData }.
 */
export function useFetch(url, params) {
  const [state, setState] = useState({ data: null, pagination: null, loading: Boolean(url), error: null });
  const seq = useRef(0);
  const key = JSON.stringify(params ?? {});

  const run = useCallback(() => {
    if (!url) return Promise.resolve();
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    return get(url, params)
      .then((res) => { if (id === seq.current) setState({ data: res.data, pagination: res.pagination ?? null, loading: false, error: null }); })
      .catch((err) => { if (id === seq.current) setState((s) => ({ ...s, loading: false, error: parseError(err).message })); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, key]);

  useEffect(() => { run(); }, [run]);

  const setData = useCallback((fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })), []);
  return { ...state, reload: run, setData };
}
