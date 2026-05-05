import { useState, useEffect, useCallback } from 'react';
import { propertyService } from '../services/propertyService';
import type { Property } from '../types/property';

interface UsePropertiesOptions {
  initialPage?: number;
  limit?: number;
  autoFetch?: boolean;
}

interface UsePropertiesReturn {
  properties: Property[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  setPage: (page: number) => void;
  refetch: () => Promise<void>;
  createProperty: (data: Partial<Property>) => Promise<Property>;
  updateProperty: (id: string, data: Partial<Property>) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;
}

export function useProperties(options: UsePropertiesOptions = {}): UsePropertiesReturn {
  const { initialPage = 1, limit = 12, autoFetch = true } = options;
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await propertyService.getAll({ page, limit });
      setProperties(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch properties';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    if (autoFetch) {
      fetchProperties();
    }
  }, [autoFetch, fetchProperties]);

  const createProperty = useCallback(async (data: Partial<Property>): Promise<Property> => {
    const newProperty = await propertyService.create(data);
    await fetchProperties();
    return newProperty;
  }, [fetchProperties]);

  const updateProperty = useCallback(async (id: string, data: Partial<Property>): Promise<Property> => {
    const updatedProperty = await propertyService.update(id, data);
    await fetchProperties();
    return updatedProperty;
  }, [fetchProperties]);

  const deleteProperty = useCallback(async (id: string): Promise<void> => {
    await propertyService.delete(id);
    await fetchProperties();
  }, [fetchProperties]);

  return {
    properties,
    loading,
    error,
    page,
    totalPages,
    total,
    setPage,
    refetch: fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
  };
}