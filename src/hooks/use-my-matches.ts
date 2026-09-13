import { useEffect, useState } from 'react';
import { hasSupabaseConfig } from '@/lib/env';
import { fetchMyMatches, type MatchSummaryRow } from '@/services/matches';

export function useMyMatches() {
  const [rows, setRows] = useState<MatchSummaryRow[]>([]);
  const [loading, setLoading] = useState(hasSupabaseConfig);
  const [usingDemo, setUsingDemo] = useState(!hasSupabaseConfig);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setUsingDemo(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchMyMatches()
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setUsingDemo(false);
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        setUsingDemo(false);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, loading, usingDemo };
}
