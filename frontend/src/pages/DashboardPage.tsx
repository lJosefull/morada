import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface DashboardData {
  totalProperties: number;
  activeListings: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        setError(null);
        // FIX: Changed from /api/v1/dashboard to /dashboard to match backend routes
        const response = await api.get<DashboardData>('/dashboard');
        
        if (isMounted) {
          setData(response.data);
        }
      } catch (err) {
        if (isMounted) {
          // FIX: Properly extract error message from API error response
          const errorMessage = err instanceof Error 
            ? (err as any).message || 'Failed to load dashboard data'
            : 'Failed to load dashboard data';
          setError(errorMessage);
          console.error('Dashboard fetch error:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (isAuthenticated && user) {
      fetchDashboardData();
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorBoundary>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
          <p className="mt-2 text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </ErrorBoundary>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700">Total Properties</h2>
          <p className="text-3xl font-bold text-blue-600 mt-2">{data.totalProperties}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700">Active Listings</h2>
          <p className="text-3xl font-bold text-green-600 mt-2">{data.activeListings}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h2>
        {data.recentActivity.length === 0 ? (
          <p className="text-gray-500">No recent activity</p>
        ) : (
          <ul className="space-y-3">
            {data.recentActivity.map((activity) => (
              <li key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-400 rounded-full" />
                <div>
                  <p className="text-sm text-gray-600">{activity.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}