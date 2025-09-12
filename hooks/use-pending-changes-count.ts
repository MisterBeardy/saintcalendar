import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export function usePendingChangesCount() {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    if (!session) {
      setCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/pending-changes?status=PENDING&limit=1');
      if (!response.ok) {
        throw new Error('Failed to fetch pending changes count');
      }
      const data = await response.json();
      setCount(data.pagination.total);
    } catch (error) {
      console.error('Error fetching pending changes count:', error);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  return { count, loading, refetch: fetchCount };
}