import { useState, useEffect } from 'react';

export interface ChangeLogEntry {
  id: string;
  timestamp: string;
  status: string;
  action: string;
  section: string;
  target: string;
  changes: string;
  user: string;
  ipAddress: string;
}

interface ChangeLogResponse {
  changelog: ChangeLogEntry[];
  version: string;
}

interface UseChangeLogDataReturn {
  changelog: ChangeLogEntry[];
  version: string;
  loading: boolean;
  error: string | null;
}

export const useChangeLogData = (): UseChangeLogDataReturn => {
  const [changelog, setChangelog] = useState<ChangeLogEntry[]>([]);
  const [version, setVersion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChangeLog = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/changelog');
        if (!response.ok) {
          throw new Error('Failed to fetch changelog');
        }

        const data: ChangeLogResponse = await response.json();
        setChangelog(data.changelog);
        setVersion(data.version);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchChangeLog();
  }, []);

  return {
    changelog,
    version,
    loading,
    error,
  };
};