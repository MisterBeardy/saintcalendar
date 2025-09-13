import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Types based on Prisma schema
export interface Saint {
  id: string;
  saintNumber: string;
  name: string;
  saintName: string;
  saintDate: string;
  saintYear: number;
  locationId?: string;
  location?: Location;
  totalBeers: number;
  years: SaintYear[];
  milestones: Milestone[];
  events: Event[];
  stickers: Sticker[];
}

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
  status?: 'OPEN' | 'PENDING' | 'CLOSED';
  openingDate?: Date;
  closingDate?: Date;
  exclude?: string;
  saints: Saint[];
  events: Event[];
  stickers: Sticker[];
}

export interface SaintYear {
  id: string;
  year: number;
  burger: string;
  tapBeerList: string[];
  canBottleBeerList: string[];
  facebookEvent?: string;
  sticker?: string;
  saintId: string;
}

export interface Milestone {
  id: string;
  count: number;
  date: string;
  sticker?: string;
  saintId: string;
}

export interface Event {
  id: string;
  date: number;
  title: string;
  locationId?: string;
  beers: number;
  saintNumber?: string;
  saintedYear?: number;
  month?: number;
  saintName: string;
  realName: string;
  sticker?: string;
  eventType: string;
  burgers?: number;
  tapBeers?: number;
  canBottleBeers?: number;
  facebookEvent?: string;
  burger?: string;
  tapBeerList: string[];
  canBottleBeerList: string[];
  milestoneCount?: number;
  year?: number;
  saintId?: string;
}

export interface Sticker {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  locationId?: string;
  saintId?: string;
  year?: number;
  imageUrl?: string;
  type?: string;
}

export interface PendingChange {
  id: string;
  entityType: 'LOCATION' | 'SAINT' | 'STICKER';
  entityId: string;
  changes: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UseSaintsDataReturn {
  // Data
  saints: Saint[];
  locations: Location[];
  pendingChanges: PendingChange[];

  // Loading states
  saintsLoading: boolean;
  locationsLoading: boolean;
  pendingChangesLoading: boolean;

  // Errors
  saintsError: string | null;
  locationsError: string | null;
  pendingChangesError: string | null;

  // Search/Filter
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredSaints: Saint[];

  // CRUD functions
  createSaint: (data: Omit<Saint, 'id' | 'years' | 'milestones' | 'events' | 'stickers'>) => Promise<Saint>;
  updateSaint: (id: string, data: Partial<Saint>) => Promise<Saint>;
  deleteSaint: (id: string) => Promise<void>;

  createLocation: (data: Omit<Location, 'id' | 'saints' | 'events' | 'stickers'>) => Promise<Location>;
  updateLocation: (id: string, data: Partial<Location>) => Promise<Location>;
  deleteLocation: (id: string) => Promise<void>;

  // Pending changes
  createPendingChange: (data: Omit<PendingChange, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<PendingChange>;
  updatePendingChange: (id: string, data: Partial<PendingChange>) => Promise<PendingChange>;

  // Refetch functions
  refetchSaints: () => Promise<void>;
  refetchLocations: () => Promise<void>;
  refetchPendingChanges: () => Promise<void>;
  refetchAll: () => Promise<void>;
}

export const useSaintsData = (): UseSaintsDataReturn => {
  const { data: session } = useSession();

  // State
  const [saints, setSaints] = useState<Saint[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);

  const [saintsLoading, setSaintsLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [pendingChangesLoading, setPendingChangesLoading] = useState(false);

  const [saintsError, setSaintsError] = useState<string | null>(null);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [pendingChangesError, setPendingChangesError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  // Fetch functions
  const fetchSaints = useCallback(async () => {
    try {
      setSaintsLoading(true);
      setSaintsError(null);
      const response = await fetch('/api/saints');
      if (!response.ok) {
        throw new Error('Failed to fetch saints');
      }
      const data = await response.json();
      setSaints(data);
    } catch (error) {
      setSaintsError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSaintsLoading(false);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      setLocationsLoading(true);
      setLocationsError(null);
      const response = await fetch('/api/locations');
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      setLocationsError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLocationsLoading(false);
    }
  }, []);

  const fetchPendingChanges = useCallback(async () => {
    if (!session) return;

    try {
      setPendingChangesLoading(true);
      setPendingChangesError(null);
      const response = await fetch('/api/pending-changes?entityType=SAINT&entityType=LOCATION&status=PENDING');
      if (!response.ok) {
        throw new Error('Failed to fetch pending changes');
      }
      const data = await response.json();
      setPendingChanges(data.pendingChanges || []);
    } catch (error) {
      setPendingChangesError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setPendingChangesLoading(false);
    }
  }, [session]);

  // Initial fetch
  useEffect(() => {
    fetchSaints();
    fetchLocations();
  }, [fetchSaints, fetchLocations]);

  useEffect(() => {
    fetchPendingChanges();
  }, [fetchPendingChanges]);

  // Filtered saints
  const filteredSaints = useMemo(() => {
    if (!searchTerm) return saints;

    const term = searchTerm.toLowerCase();
    return saints.filter(saint =>
      saint.name.toLowerCase().includes(term) ||
      saint.saintName.toLowerCase().includes(term) ||
      saint.saintNumber.toLowerCase().includes(term) ||
      saint.location?.displayName.toLowerCase().includes(term) ||
      saint.saintYear.toString().includes(term)
    );
  }, [saints, searchTerm]);

  // CRUD functions
  const createSaint = useCallback(async (data: Omit<Saint, 'id' | 'years' | 'milestones' | 'events' | 'stickers'>) => {
    const response = await fetch('/api/saints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create saint');
    }
    const newSaint = await response.json();
    setSaints(prev => [...prev, newSaint]);
    return newSaint;
  }, []);

  const updateSaint = useCallback(async (id: string, data: Partial<Saint>) => {
    const response = await fetch(`/api/saints?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update saint');
    }
    const updatedSaint = await response.json();
    setSaints(prev => prev.map(s => s.id === id ? updatedSaint : s));
    return updatedSaint;
  }, []);

  const deleteSaint = useCallback(async (id: string) => {
    const response = await fetch(`/api/saints?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete saint');
    }
    setSaints(prev => prev.filter(s => s.id !== id));
  }, []);

  const createLocation = useCallback(async (data: Omit<Location, 'id' | 'saints' | 'events' | 'stickers'>) => {
    const response = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create location');
    }
    const newLocation = await response.json();
    setLocations(prev => [...prev, newLocation]);
    return newLocation;
  }, []);

  const updateLocation = useCallback(async (id: string, data: Partial<Location>) => {
    const response = await fetch(`/api/locations?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update location');
    }
    const updatedLocation = await response.json();
    setLocations(prev => prev.map(l => l.id === id ? updatedLocation : l));
    return updatedLocation;
  }, []);

  const deleteLocation = useCallback(async (id: string) => {
    const response = await fetch(`/api/locations?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete location');
    }
    setLocations(prev => prev.filter(l => l.id !== id));
  }, []);

  const createPendingChange = useCallback(async (data: Omit<PendingChange, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const response = await fetch('/api/pending-changes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create pending change');
    }
    const newChange = await response.json();
    setPendingChanges(prev => [...prev, newChange]);
    return newChange;
  }, []);

  const updatePendingChange = useCallback(async (id: string, data: Partial<PendingChange>) => {
    const response = await fetch(`/api/pending-changes?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update pending change');
    }
    const updatedChange = await response.json();
    setPendingChanges(prev => prev.map(c => c.id === id ? updatedChange : c));
    return updatedChange;
  }, []);

  // Refetch functions
  const refetchSaints = useCallback(async () => {
    await fetchSaints();
  }, [fetchSaints]);

  const refetchLocations = useCallback(async () => {
    await fetchLocations();
  }, [fetchLocations]);

  const refetchPendingChanges = useCallback(async () => {
    await fetchPendingChanges();
  }, [fetchPendingChanges]);

  const refetchAll = useCallback(async () => {
    await Promise.all([fetchSaints(), fetchLocations(), fetchPendingChanges()]);
  }, [fetchSaints, fetchLocations, fetchPendingChanges]);

  return {
    saints,
    locations,
    pendingChanges,
    saintsLoading,
    locationsLoading,
    pendingChangesLoading,
    saintsError,
    locationsError,
    pendingChangesError,
    searchTerm,
    setSearchTerm,
    filteredSaints,
    createSaint,
    updateSaint,
    deleteSaint,
    createLocation,
    updateLocation,
    deleteLocation,
    createPendingChange,
    updatePendingChange,
    refetchSaints,
    refetchLocations,
    refetchPendingChanges,
    refetchAll,
  };
};