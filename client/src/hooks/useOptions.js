import { useMemo } from 'react';
import { useFetch } from './useFetch.js';

/** Load a list endpoint and map it into <option> data. `url = null` skips the request. */
export function useOptions(url, toOption, params = { limit: 100 }) {
  const { data, loading } = useFetch(url, params);
  const options = useMemo(() => (data ?? []).map(toOption), [data]); // eslint-disable-line react-hooks/exhaustive-deps
  return { options, loading, raw: data ?? [] };
}
