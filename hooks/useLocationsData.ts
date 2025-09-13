import { useState, useEffect, useMemo } from 'react';

export type LocationStatus = 'OPEN' | 'PENDING' | 'CLOSED';

export interface Location {
  id: string;
  state: string;
  city: string;
  displayName: string;
  address: string;
  phoneNumber: string;
  sheetId: string;
  isActive: boolean;
  managerEmail: string;
  openedDate?: Date;
  status?: LocationStatus;
  openingDate?: Date;
  closingDate?: Date;
  exclude?: string;
  saints: any[]; // Simplified for this hook
  events: any[]; // Simplified for this hook
  stickers: any[]; // Simplified for this hook
}

export type FilterStatus = 'All' | 'Active' | 'Pending' | 'Closed';

interface UseLocationsDataReturn {
  locations: Location[];
  filteredLocations: Location[];
  loading: boolean;
  error: string | null;
  filter: FilterStatus;
  setFilter: (filter: FilterStatus) => void;
}

export const useLocationsData = (): UseLocationsDataReturn => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('All');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/locations');
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }

        const data: Location[] = await response.json();
        setLocations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const filteredLocations = useMemo(() => {
    if (filter === 'All') {
      return locations;
    }

    const statusMap: Record<Exclude<FilterStatus, 'All'>, LocationStatus> = {
      Active: 'OPEN',
      Pending: 'PENDING',
      Closed: 'CLOSED',
    };

    const targetStatus = statusMap[filter];
    return locations.filter(location => location.status === targetStatus);
  }, [locations, filter]);

  return {
    locations,
    filteredLocations,
    loading,
    error,
    filter,
    setFilter,
  };
};