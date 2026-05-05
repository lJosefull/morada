import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { propertyService } from '../services/propertyService';
import { Property } from '../types/property';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { PropertyCard } from '../components/properties/PropertyCard';
import { Button } from '../components/ui/Button';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (isAuthenticated && user) {
      fetchProperties();
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await propertyService.getUserProperties();
      setProperties(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load properties';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      await propertyService.deleteProperty(propertyId);
      setProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete property';
      setError(message);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'User'}</p>
        </div>
        <Button
          onClick={() => navigate('/properties/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Add Property
        </Button>
      </div>

      {error && (
        <ErrorAlert
          message={error}
          onDismiss={() => setError(null)}
          className="mb-6"
        />
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first property</p>
          <Button
            onClick={() => navigate('/properties/new')}
            variant="outline"
          >
            Add Property
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(property => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={() => navigate(`/properties/${property.id}/edit`)}
              onDelete={() => handleDeleteProperty(property.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}