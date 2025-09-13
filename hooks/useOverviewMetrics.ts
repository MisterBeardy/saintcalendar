import { useState, useEffect } from 'react';

interface OverviewData {
  saintsCount: number;
  locationsCount: number;
  pendingStickersCount: number;
  importsCount: number;
}

interface UseOverviewMetricsReturn {
  data: OverviewData | null;
  loading: boolean;
  error: string | null;
}

export const useOverviewMetrics = (): UseOverviewMetricsReturn => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [saintsRes, locationsRes, stickersRes, importsRes] = await Promise.all([
          fetch('/api/saints/count'),
          fetch('/api/locations/count'),
          fetch('/api/stickers/pending/count'),
          fetch('/api/imports/count'),
        ]);

        if (!saintsRes.ok || !locationsRes.ok || !stickersRes.ok || !importsRes.ok) {
          throw new Error('Failed to fetch some metrics');
        }

        const saintsData = await saintsRes.json();
        const locationsData = await locationsRes.json();
        const stickersData = await stickersRes.json();
        const importsData = await importsRes.json();

        setData({
          saintsCount: saintsData.count,
          locationsCount: locationsData.count,
          pendingStickersCount: stickersData.count,
          importsCount: importsData.count,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return { data, loading, error };
};