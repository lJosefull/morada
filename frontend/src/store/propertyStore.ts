import { create } from 'zustand';
import { Property, PropertyFilters, CreatePropertyDto, UpdatePropertyDto, PaginatedResponse } from '../types/property';
import { api } from '../lib/api';

// API base path for properties - can be configured
const PROPERTIES_API_PATH = '/properties';

interface PropertyState {
  properties: Property[];
  currentProperty: Property | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  filters: PropertyFilters;

  // Actions
  fetchProperties: (filters?: PropertyFilters) => Promise<void>;
  fetchPropertyById: (id: string) => Promise<void>;
  createProperty: (data: CreatePropertyDto) => Promise<Property>;
  updateProperty: (id: string, data: UpdatePropertyDto) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;
  setFilters: (filters: Partial<PropertyFilters>) => void;
  clearCurrentProperty: () => void;
  clearError: () => void;
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
  properties: [],
  currentProperty: null,
  total: 0,
  page: 1,
  limit: 12,
  totalPages: 0,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  filters: {},

  fetchProperties: async (filters?: PropertyFilters) => {
    try {
      set({ isLoading: true, error: null });
      const currentFilters = { ...get().filters, ...filters };
      const queryParams = new URLSearchParams();

      if (currentFilters.status) queryParams.set('status', currentFilters.status);
      if (currentFilters.type) queryParams.set('type', currentFilters.type);
      if (currentFilters.minPrice) queryParams.set('minPrice', String(currentFilters.minPrice));
      if (currentFilters.maxPrice) queryParams.set('maxPrice', String(currentFilters.maxPrice));
      if (currentFilters.search) queryParams.set('search', currentFilters.search);
      if (currentFilters.page) queryParams.set('page', String(currentFilters.page));
      if (currentFilters.limit) queryParams.set('limit', String(currentFilters.limit));

      const queryString = queryParams.toString();
      const url = queryString ? `${PROPERTIES_API_PATH}?${queryString}` : PROPERTIES_API_PATH;
      
      const response = await api.get<PaginatedResponse<Property>>(url);
      set({
        properties: response.data,
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        isLoading: false,
        filters: currentFilters,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch properties';
      set({ isLoading: false, error: message });
      // Re-throw for component-level handling if needed
      throw error;
    }
  },

  fetchPropertyById: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const property = await api.get<Property>(`${PROPERTIES_API_PATH}/${id}`);
      set({ currentProperty: property, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch property';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  createProperty: async (data: CreatePropertyDto) => {
    try {
      set({ isCreating: true, error: null });
      const property = await api.post<Property>(PROPERTIES_API_PATH, data);
      set((state) => ({
        properties: [property, ...state.properties],
        total: state.total + 1,
        isCreating: false,
      }));
      return property;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create property';
      set({ isCreating: false, error: message });
      throw error;
    }
  },

  updateProperty: async (id: string, data: UpdatePropertyDto) => {
    try {
      set({ isUpdating: true, error: null });
      const property = await api.put<Property>(`${PROPERTIES_API_PATH}/${id}`, data);
      set((state) => ({
        properties: state.properties.map((p) => (p.id === id ? property : p)),
        currentProperty: state.currentProperty?.id === id ? property : state.currentProperty,
        isUpdating: false,
      }));
      return property;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update property';
      set({ isUpdating: false, error: message });
      throw error;
    }
  },

  deleteProperty: async (id: string) => {
    try {
      set({ isDeleting: true, error: null });
      await api.delete(`${PROPERTIES_API_PATH}/${id}`);
      set((state) => ({
        properties: state.properties.filter((p) => p.id !== id),
        total: state.total - 1,
        currentProperty: state.currentProperty?.id === id ? null : state.currentProperty,
        isDeleting: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete property';
      set({ isDeleting: false, error: message });
      throw error;
    }
  },

  setFilters: (filters: Partial<PropertyFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  clearCurrentProperty: () => {
    set({ currentProperty: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));