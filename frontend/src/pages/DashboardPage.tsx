import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { PropertyCard } from '../components/PropertyCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ErrorMessage } from '../components/ErrorMessage';

export interface Property {
  id: string;
  title: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  images: { url: string }[];
  createdAt: string;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchProperties = useCallback(async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/properties', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProperties(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      setError(err.response?.data?.message || err.message || 'Failed to load properties. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [token, navigate, logout]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      await api.delete(`/properties/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      setError(err.response?.data?.message || err.message || 'Failed to delete property.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<ErrorMessage message="Something went wrong. Please refresh the page." />}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
          <button
            onClick={() => navigate('/properties/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Property
          </button>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={handleRetry} />
          </div>
        )}

        {properties.length === 0 && !error ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No properties found.</p>
            <button
              onClick={() => navigate('/properties/new')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onDelete={handleDeleteProperty}
                onEdit={() => navigate(`/properties/${property.id}/edit`)}
              />
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}