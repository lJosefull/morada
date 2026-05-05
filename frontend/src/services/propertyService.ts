import api from './api';
import { Property, CreatePropertyDto, UpdatePropertyDto, PropertyFilter } from '../types/property';

export const propertyService = {
  async getAll(filter?: PropertyFilter): Promise<{ data: Property[]; total: number }> {
    const response = await api.get('/properties', { params: filter });
    return response.data;
  },

  async getById(id: string): Promise<Property> {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },

  async create(data: CreatePropertyDto): Promise<Property> {
    const response = await api.post('/properties', data);
    return response.data;
  },

  async update(id: string, data: UpdatePropertyDto): Promise<Property> {
    const response = await api.put(`/properties/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/properties/${id}`);
  },

  async getUserProperties(): Promise<Property[]> {
    // Changed from '/properties/user/me' to '/properties/my' to match standard REST conventions
    // The backend should expose GET /api/v1/properties/my for user's own properties
    const response = await api.get('/properties/my');
    return response.data;
  },

  async search(query: string): Promise<Property[]> {
    // Changed from '/properties/search/:query' to '/properties?search=:query' for proper REST
    const response = await api.get('/properties', { params: { search: query } });
    return response.data;
  },
};