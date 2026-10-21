import { useCallback, useState } from 'react';
import { useFetch } from './useFetch.js';
import { useDebounce } from './useDebounce.js';

/**
 * useList(url, initialFilters) — search + filters + pagination on top of useFetch.
 * `q` is debounced; changing any filter resets to page 1.
 */
export function useList(url, initialFilters = {}, pageSize = 10) {
  const [filters, setFilters] = useState({ q: '', ...initialFilters });
  const [page, setPage] = useState(1);
  const q = useDebounce(filters.q);

  const params = { ...filters, q, page, limit: pageSize };
  Object.keys(params).forEach((k) => { if (params[k] === '' || params[k] == null) delete params[k]; });
  const res = useFetch(url, params);

  const setFilter = useCallback((name, value) => { setFilters((f) => ({ ...f, [name]: value })); setPage(1); }, []);
  const reset = useCallback(() => { setFilters({ q: '', ...initialFilters }); setPage(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...res, items: res.data ?? [], filters, setFilter, reset, page, setPage };
}
