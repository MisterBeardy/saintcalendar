import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface PendingChange {
  id: string;
  entityType: string;
  entityId: string;
  changes: Record<string, any>;
  requestedBy: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export function usePendingChangesByEntity(entityType: string) {
  const { data: session } = useSession();
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingChanges = useCallback(async () => {
    if (!session) {
      setPendingChanges([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/pending-changes?entityType=${entityType}&status=PENDING`);
      if (!response.ok) {
        throw new Error('Failed to fetch pending changes');
      }
      const data = await response.json();
      setPendingChanges(data.pendingChanges || []);
    } catch (error) {
      console.error('Error fetching pending changes:', error);
      setPendingChanges([]);
    } finally {
      setLoading(false);
    }
  }, [session, entityType]);

  useEffect(() => {
    fetchPendingChanges();
  }, [fetchPendingChanges]);

  // Listen for pending-changes-updated event to refresh data
  useEffect(() => {
    const handlePendingChangesUpdate = () => {
      fetchPendingChanges();
    };

    window.addEventListener('pending-changes-updated', handlePendingChangesUpdate);

    return () => {
      window.removeEventListener('pending-changes-updated', handlePendingChangesUpdate);
    };
  }, [fetchPendingChanges]);

  const hasPendingChange = useCallback((entityId: string) => {
    return pendingChanges.some(change => change.entityId === entityId);
  }, [pendingChanges]);

  return {
    pendingChanges,
    loading,
    hasPendingChange,
    refetch: fetchPendingChanges
  };
}