import { create } from 'zustand';
import apiClient from '../lib/api';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  type: string;
  status: string;
  images: string[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface PropertyFilters {
  page: number;
  limit: number;
  search?: string;
  type?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface PropertyState {
  properties: Property[];
  currentProperty: Property | null;
  total: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  filters: PropertyFilters;

  fetchProperties: () => Promise<void>;
  fetchPropertyById: (id: string) => Promise<void>;
  createProperty: (data: Omit<Property, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProperty: (id: string, data: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  searchProperties: (query: string) => Promise<void>;
  setFilters: (filters: Partial<PropertyFilters>) => void;
  clearError: () => void;
  clearCurrentProperty: () => void;
}

export const usePropertyStore = create<PropertyState>()((set, get) => ({
  properties: [],
  currentProperty: null,
  total: 0,
  isLoading: false,
  isSubmitting: false,
  error: null,
  filters: {
    page: 1,
    limit: 10,
  },

  fetchProperties: async () => {
    const { filters } = get();
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<{ properties: Property[]; total: number }>('/properties', {
        params: {
          page: filters.page,
          limit: filters.limit,
          ...(filters.type && { type: filters.type }),
          ...(filters.status && { status: filters.status }),
          ...(filters.minPrice && { minPrice: filters.minPrice }),
          ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        },
      });
      set({
        properties: response.properties,
        total: response.total,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch properties.',
      });
    }
  },

  fetchPropertyById: async (id: string) => {
    set({ isLoading: true, error: null, currentProperty: null });
    try {
      const property = await apiClient.get<Property>(`/properties/${id}`);
      set({
        currentProperty: property,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch property details.',
      });
    }
  },

  createProperty: async (data) => {
    set({ isSubmitting: true, error: null });
    try {
      const property = await apiClient.post<Property>('/properties', data);
      set((state) => ({
        properties: [property, ...state.properties],
        total: state.total + 1,
        isSubmitting: false,
      }));
    } catch (error: any) {
      set({
        isSubmitting: false,
        error: error.message || 'Failed to create property.',
      });
      throw error;
    }
  },

  updateProperty: async (id: string, data: Partial<Property>) => {
    set({ isSubmitting: true, error: null });
    try {
      const updatedProperty = await apiClient.put<Property>(`/properties/${id}`, data);
      set((state) => ({
        properties: state.properties.map((p) => (p.id === id ? updatedProperty : p)),
        currentProperty: state.currentProperty?.id === id ? updatedProperty : state.currentProperty,
        isSubmitting: false,
      }));
    } catch (error: any) {
      set({
        isSubmitting: false,
        error: error.message || 'Failed to update property.',
      });
      throw error;
    }
  },

  deleteProperty: async (id: string) => {
    set({ isSubmitting: true, error: null });
    try {
      await apiClient.delete(`/properties/${id}`);
      set((state) => ({
        properties: state.properties.filter((p) => p.id !== id),
        total: state.total - 1,
        currentProperty: state.currentProperty?.id === id ? null : state.currentProperty,
        isSubmitting: false,
      }));
    } catch (error: any) {
      set({
        isSubmitting: false,
        error: error.message || 'Failed to delete property.',
      });
      throw error;
    }
  },

  searchProperties: async (query: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<{ properties: Property[]; total: number }>('/properties/search', {
        params: { q: query, page: 1, limit: 10 },
      });
      set({
        properties: response.properties,
        total: response.total,
        isLoading: false,
        filters: { ...get().filters, page: 1, search: query },
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Search failed.',
      });
    }
  },

  setFilters: (filters: Partial<PropertyFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  clearError: () => set({ error: null }),
  clearCurrentProperty: () => set({ currentProperty: null }),
}));