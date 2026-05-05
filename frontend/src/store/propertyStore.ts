import { create } from 'zustand';
import apiClient from '../lib/api';

interface PropertyImage {
  id: string;
  url: string;
  alt?: string;
}

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  type: string;
  status: string;
  images: PropertyImage[];
  createdAt: string;
  updatedAt: string;
}

interface PropertyState {
  properties: Property[];
  selectedProperty: Property | null;
  isLoading: boolean;
  error: string | null;
  
  fetchProperties: () => Promise<void>;
  fetchPropertyById: (id: string) => Promise<void>;
  createProperty: (data: Partial<Property>) => Promise<Property>;
  updateProperty: (id: string, data: Partial<Property>) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;
  clearError: () => void;
  clearSelectedProperty: () => void;
}

export const usePropertyStore = create<PropertyState>()((set, get) => ({
  properties: [],
  selectedProperty: null,
  isLoading: false,
  error: null,

  fetchProperties: async () => {
    set({ isLoading: true, error: null });
    try {
      const properties = await apiClient.get<Property[]>('/properties');
      set({ properties, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch properties';
      set({ error: message, isLoading: false });
    }
  },

  fetchPropertyById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const property = await apiClient.get<Property>(`/properties/${id}`);
      set({ selectedProperty: property, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch property';
      set({ error: message, isLoading: false });
    }
  },

  createProperty: async (data: Partial<Property>) => {
    set({ isLoading: true, error: null });
    try {
      const property = await apiClient.post<Property>('/properties', data);
      set((state) => ({
        properties: [property, ...state.properties],
        isLoading: false,
      }));
      return property;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create property';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateProperty: async (id: string, data: Partial<Property>) => {
    set({ isLoading: true, error: null });
    try {
      const property = await apiClient.put<Property>(`/properties/${id}`, data);
      set((state) => ({
        properties: state.properties.map((p) => (p.id === id ? property : p)),
        selectedProperty: property,
        isLoading: false,
      }));
      return property;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update property';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteProperty: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/properties/${id}`);
      set((state) => ({
        properties: state.properties.filter((p) => p.id !== id),
        selectedProperty: state.selectedProperty?.id === id ? null : state.selectedProperty,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete property';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  clearSelectedProperty: () => {
    set({ selectedProperty: null });
  },
}));