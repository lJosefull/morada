import { create } from 'zustand';
import { Property, PropertyFilter, CreatePropertyData, UpdatePropertyData, PaginatedResponse } from '../types/property';
import { api } from '../lib/api';

interface PropertyState {
  properties: Property[];
  currentProperty: Property | null;
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  fetchProperties: (filter?: PropertyFilter) => Promise<void>;
  fetchPropertyById: (id: string) => Promise<void>;
  createProperty: (data: CreatePropertyData) => Promise<Property>;
  updateProperty: (id: string, data: UpdatePropertyData) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;
  updatePropertyStatus: (id: string, status: string) => Promise<void>;
  clearError: () => void;
  clearCurrentProperty: () => void;
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
  properties: [],
  currentProperty: null,
  total: 0,
  page: 1,
  limit: 10,
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchProperties: async (filter?: PropertyFilter) => {
    set({ isLoading: true, error: null });
    try {
      // FIX: Handle paginated response properly - backend might return { data, total, page, limit }
      // or { properties, total, page, limit }
      const response = await api.get<PaginatedResponse<Property>>('/properties', filter as Record<string, unknown>);
      
      // FIX: Handle different response structures
      const properties = (response as any).properties || (response as any).data || [];
      const total = (response as any).total || properties.length;
      const page = (response as any).page || 1;
      const limit = (response as any).limit || 10;
      
      set({
        properties,
        total,
        page,
        limit,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch properties',
      });
    }
  },

  fetchPropertyById: async (id: string) => {
    set({ isLoading: true, error: null, currentProperty: null });
    try {
      // FIX: Handle nested response
      const response = await api.get<Property>(`/properties/${id}`);
      const property = (response as any).data || response;
      
      set({ currentProperty: property, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch property',
        currentProperty: null,
      });
    }
  },

  createProperty: async (data: CreatePropertyData) => {
    set({ isSubmitting: true, error: null });
    try {
      // FIX: Handle nested response
      const response = await api.post<Property>('/properties', data);
      const property = (response as any).data || response;
      
      set((state) => ({
        properties: [property, ...state.properties],
        total: state.total + 1,
        isSubmitting: false,
      }));
      return property;
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message || 'Failed to create property' });
      throw error;
    }
  },

  updateProperty: async (id: string, data: UpdatePropertyData) => {
    set({ isSubmitting: true, error: null });
    try {
      // FIX: Use PUT for full update, but backend might expect PATCH for partial updates
      // Use the appropriate HTTP method based on the data
      let property: Property;
      
      if (Object.keys(data).length <= 3) {
        // For small updates, use PATCH
        const response = await api.patch<Property>(`/properties/${id}`, data);
        property = (response as any).data || response;
      } else {
        // For full updates, use PUT
        const response = await api.put<Property>(`/properties/${id}`, data);
        property = (response as any).data || response;
      }
      
      set((state) => ({
        properties: state.properties.map((p) => (p.id === id ? property : p)),
        currentProperty: state.currentProperty?.id === id ? property : state.currentProperty,
        isSubmitting: false,
      }));
      return property;
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message || 'Failed to update property' });
      throw error;
    }
  },

  deleteProperty: async (id: string) => {
    set({ isSubmitting: true, error: null });
    try {
      await api.delete(`/properties/${id}`);
      set((state) => ({
        properties: state.properties.filter((p) => p.id !== id),
        total: state.total - 1,
        currentProperty: state.currentProperty?.id === id ? null : state.currentProperty,
        isSubmitting: false,
      }));
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message || 'Failed to delete property' });
      throw error;
    }
  },

  updatePropertyStatus: async (id: string, status: string) => {
    set({ isSubmitting: true, error: null });
    try {
      // FIX: Backend might expect PUT instead of PATCH for status updates
      // Try PATCH first, fallback to PUT
      let property: Property;
      
      try {
        const response = await api.patch<Property>(`/properties/${id}/status`, { status });
        property = (response as any).data || response;
      } catch {
        // Fallback to PUT if PATCH fails
        const response = await api.put<Property>(`/properties/${id}`, { status });
        property = (response as any).data || response;
      }
      
      set((state) => ({
        properties: state.properties.map((p) => (p.id === id ? property : p)),
        currentProperty: state.currentProperty?.id === id ? property : state.currentProperty,
        isSubmitting: false,
      }));
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message || 'Failed to update property status' });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  clearCurrentProperty: () => {
    set({ currentProperty: null });
  },
}));