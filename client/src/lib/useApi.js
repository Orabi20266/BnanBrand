import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';

export function useApi(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      const d = await api.get(path);
      setData(d);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
