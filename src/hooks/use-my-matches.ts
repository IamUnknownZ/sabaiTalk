import { useEffect, useState } from 'react';
import { fetchMyMatches, type MatchSummaryRow } from '@/services/matches';

export function useMyMatches() {
  const [rows, setRows] = useState<MatchSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMyMatches()
      .then((data) => {
        if (cancelled) return;
        setRows(data);
      })
      .catch((cause) => {
        if (cancelled) return;
        setRows([]);
        setError(cause instanceof Error ? cause.message : 'Could not load matches.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, loading, error };
}
