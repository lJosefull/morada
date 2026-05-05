import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PropertyCard } from '../components/PropertyCard';
import type { Property } from '../types/property';

interface DashboardState {
  properties: Property[];
  isLoading: boolean;
  error: string | null;
  stats: {
    totalProperties: number;
    availableProperties: number;
    soldProperties: number;
  };
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [state, setState] = useState<DashboardState>({
    properties: [],
    isLoading: true,
    error: null,
    stats: {
      totalProperties: 0,
      availableProperties: 0,
      soldProperties: 0,
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, navigate]);

  const fetchDashboardData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const [propertiesResponse] = await Promise.all([
        api.get<Property[]>('/properties', {
          params: { ownerId: user?.id }
        }),
      ]);

      const properties = propertiesResponse.data;
      const stats = {
        totalProperties: properties.length,
        availableProperties: properties.filter(p => p.status === 'AVAILABLE').length,
        soldProperties: properties.filter(p => p.status === 'SOLD').length,
      };

      setState({
        properties,
        isLoading: false,
        error: null,
        stats,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      // Log error for debugging
      console.error('Dashboard fetch error:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (state.error) {
    return (
      <ErrorBoundary>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-red-800 text-lg font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600 mb-4">{state.error}</p>
            <button
              onClick={fetchDashboardData}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Welcome back, {user?.name || 'User'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/properties/new')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Property
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Properties</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {state.stats.totalProperties}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Available</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {state.stats.availableProperties}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Sold</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {state.stats.soldProperties}
              </p>
            </div>
          </div>

          {/* Properties List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Your Properties</h2>
            </div>
            
            {state.properties.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No properties found</p>
                <button
                  onClick={() => navigate('/properties/new')}
                  className="mt-4 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Add your first property
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {state.properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onEdit={() => navigate(`/properties/${property.id}/edit`)}
                    onDelete={async () => {
                      try {
                        await api.delete(`/properties/${property.id}`);
                        fetchDashboardData();
                      } catch (error) {
                        console.error('Delete failed:', error);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}