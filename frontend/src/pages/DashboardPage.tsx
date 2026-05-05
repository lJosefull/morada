import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PropertyCard } from '../components/PropertyCard';
import { toast } from 'react-hot-toast';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  status: string;
  createdAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DashboardPage = () => {
  const { user, token, logout } = useAuthStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchProperties = useCallback(async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // FIX: Use relative path since api.ts already has baseURL
      const response = await api.get('/v1/properties', {
        params: { page, limit: 10 },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // FIX: Handle both response formats (data.data or data)
      const responseData = response.data?.data || response.data;
      if (responseData && responseData.data) {
        setProperties(responseData.data);
        setMeta(responseData.meta || { total: 0, page: 1, limit: 10, totalPages: 0 });
      } else if (Array.isArray(responseData)) {
        setProperties(responseData);
        setMeta({ total: responseData.length, page: 1, limit: responseData.length, totalPages: 1 });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      // FIX: Handle 401 specifically
      if (err.response?.status === 401) {
        logout();
        window.location.href = '/login';
        return;
      }
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch properties';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, logout]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleDelete = async (propertyId: string) => {
    try {
      // FIX: Use relative path
      await api.delete(`/v1/properties/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      toast.success('Property deleted successfully');
    } catch (err: any) {
      // FIX: Handle 401 specifically
      if (err.response?.status === 401) {
        logout();
        window.location.href = '/login';
        return;
      }
      const errorMessage = err.response?.data?.message || 'Failed to delete property';
      toast.error(errorMessage);
      console.error('Delete error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchProperties()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<div className="p-4 text-red-600">Something went wrong with the dashboard.</div>}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.name || 'User'}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Total Properties: {meta.total}
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-500">Get started by adding your first property.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {meta.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage((prev) => Math.min(meta.totalPages, prev + 1))}
                  disabled={page === meta.totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default DashboardPage;