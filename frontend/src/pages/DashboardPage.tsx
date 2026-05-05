import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api, ApiError } from '@/lib/api';
import PropertyCard from '@/components/PropertyCard';
import { PageLoader } from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  type: string;
  status: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  images?: Array<{ id: string; url: string; alt?: string }>;
  user?: { id: string; name: string; email: string };
  userId: string;
  createdAt: string;
}

interface DashboardStats {
  totalProperties: number;
  availableProperties: number;
  pendingProperties: number;
  soldProperties: number;
  totalValue: number;
}

interface PropertiesResponse {
  properties?: Property[];
  data?: Property[];
  total?: number;
}

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    availableProperties: 0,
    pendingProperties: 0,
    soldProperties: 0,
    totalValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Handle multiple response formats for backend compatibility
      const response = await api.get<PropertiesResponse | Property[]>('/properties');
      
      let data: Property[];
      if (Array.isArray(response)) {
        data = response;
      } else if (response && typeof response === 'object') {
        // Check for common wrapper formats
        data = (response as PropertiesResponse).properties || 
               (response as PropertiesResponse).data || 
               [];
      } else {
        data = [];
      }
      
      setProperties(data);
      
      // Calculate stats
      const totalValue = data.reduce((sum, p) => sum + p.price, 0);
      setStats({
        totalProperties: data.length,
        availableProperties: data.filter((p) => p.status === 'AVAILABLE').length,
        pendingProperties: data.filter((p) => p.status === 'PENDING').length,
        soldProperties: data.filter((p) => p.status === 'SOLD' || p.status === 'RENTED').length,
        totalValue,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : (err as ApiError)?.message || 'Failed to fetch properties';
      setError(errorMessage);
      console.error('Error fetching properties:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      // Try multiple possible endpoints for backend compatibility
      try {
        await api.delete(`/properties/${propertyId}`);
      } catch {
        // Fallback to alternative endpoint patterns
        await api.delete(`/api/properties/${propertyId}`);
      }
      
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      // Update stats
      setStats((prev) => ({
        ...prev,
        totalProperties: prev.totalProperties - 1,
        // Recalculate other stats
        availableProperties: properties.filter((p) => p.status === 'AVAILABLE' && p.id !== propertyId).length,
        pendingProperties: properties.filter((p) => p.status === 'PENDING' && p.id !== propertyId).length,
        soldProperties: properties.filter((p) => (p.status === 'SOLD' || p.status === 'RENTED') && p.id !== propertyId).length,
        totalValue: properties.filter((p) => p.id !== propertyId).reduce((sum, p) => sum + p.price, 0),
      }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : (err as ApiError)?.message || 'Failed to delete property';
      throw new Error(errorMessage);
    }
  };

  const filteredProperties = properties.filter((property) => {
    const matchesFilter = filter === 'all' || property.status === filter.toUpperCase();
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.state.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to view the dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <PageLoader message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchProperties}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Here's an overview of your property portfolio.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Properties</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalProperties}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.availableProperties}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.pendingProperties}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Value</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    ${stats.totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'available', 'pending', 'sold', 'rented'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Properties Grid */}
          {filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No properties found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || filter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating a new property listing.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onDelete={handleDeleteProperty}
                  isOwner={property.userId === user?.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DashboardPage;