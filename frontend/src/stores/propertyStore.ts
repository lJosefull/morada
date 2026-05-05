import { create } from 'zustand';
import { api } from '../lib/api';
import { Property } from '../types/property';

interface PropertyState {
  properties: Property[];
  currentProperty: Property | null;
  isLoading: boolean;
  error: string | null;

  fetchProperties: (query?: Record<string, string>) => Promise<void>;
  fetchPropertyById: (id: string) => Promise<void>;
  createProperty: (propertyData: Partial<Property>) => Promise<Property>;
  updateProperty: (id: string, propertyData: Partial<Property>) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;
  clearError: () => void;
  setCurrentProperty: (property: Property | null) => void;
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
  properties: [],
  currentProperty: null,
  isLoading: false,
  error: null,

  fetchProperties: async (query?: Record<string, string>) => {
    try {
      set({ isLoading: true, error: null });
      const queryString = query ? new URLSearchParams(query).toString() : '';
      const url = `/api/v1/properties${queryString ? `?${queryString}` : ''}`;
      const response = await api.get<Property[]>(url);
      set({ properties: response.data, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch properties';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  fetchPropertyById: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get<Property>(`/api/v1/properties/${id}`);
      set({ currentProperty: response.data, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch property';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  createProperty: async (propertyData: Partial<Property>) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post<Property>('/api/v1/properties', propertyData);
      const newProperty = response.data;
      set((state) => ({
        properties: [...state.properties, newProperty],
        isLoading: false,
      }));
      return newProperty;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create property';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  updateProperty: async (id: string, propertyData: Partial<Property>) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.put<Property>(`/api/v1/properties/${id}`, propertyData);
      const updatedProperty = response.data;
      set((state) => ({
        properties: state.properties.map((p) => (p.id === id ? updatedProperty : p)),
        currentProperty: state.currentProperty?.id === id ? updatedProperty : state.currentProperty,
        isLoading: false,
      }));
      return updatedProperty;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update property';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  deleteProperty: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await api.delete(`/api/v1/properties/${id}`);
      set((state) => ({
        properties: state.properties.filter((p) => p.id !== id),
        currentProperty: state.currentProperty?.id === id ? null : state.currentProperty,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete property';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setCurrentProperty: (property: Property | null) => {
    set({ currentProperty: property });
  },
}));