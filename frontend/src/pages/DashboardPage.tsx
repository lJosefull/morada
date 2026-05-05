```tsx  
import { useEffect, useState, useCallback } from 'react';  
import { useAuthStore } from '../stores/authStore';  
import { propertyService } from '../services/propertyService';  
import { PropertyCard } from '../components/PropertyCard';  
import { ErrorBoundary } from '../components/ErrorBoundary';  
import { LoadingSpinner } from '../components/LoadingSpinner';  
import { Property } from '../types/property';  

interface DashboardState {  
  properties: Property[];  
  isLoading: boolean;  
  error: string | null;  
  filterStatus: string;  
}  

export function DashboardPage() {  
  const { user, isAuthenticated } = useAuthStore();  
  const [state, setState] = useState<DashboardState>({  
    properties: [],  
    isLoading: false,  
    error: null,  
    filterStatus: 'all',  
  });  

  const fetchProperties = useCallback(async () => {  
    if (!isAuthenticated || !user?.id) return;  

    setState(prev => ({ ...prev, isLoading: true, error: null }));  
    try {  
      const properties = await propertyService.getByOwner(user.id);  
      setState(prev => ({ ...prev, properties, isLoading: false }));  
    } catch (err) {  
      const errorMessage = err instanceof Error ? err.message : 'Failed to load properties';  
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));  
    }  
  }, [isAuthenticated, user?.id]);  

  useEffect(() => {  
    fetchProperties();  
  }, [fetchProperties]);  

  const handleDeleteProperty = async (propertyId: string) => {  
    try {  
      await propertyService.delete(propertyId);  
      setState(prev => ({  
        ...prev,  
        properties: prev.properties.filter(p => p.id !== propertyId),  
      }));  
    } catch (err) {  
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete property';  
      setState(prev => ({ ...prev, error: errorMessage }));  
    }  
  };  

  const filteredProperties = state.filterStatus === 'all'  
    ? state.properties  
    : state.properties.filter(p => p.status === state.filterStatus);  

  if (!isAuthenticated) {  
    return (  
      <div className="flex items-center justify-center min-h-screen bg-gray-50">  
        <div className="text-center p-8 bg-white rounded-lg shadow-md">  
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>  
          <p className="text-gray-600">Please log in to view your dashboard.</p>  
        </div>  
      </div>  
    );  
  }  

  return (  
    <ErrorBoundary fallback={<div className="p-8 text-red-600">Something went wrong loading the dashboard.</div>}>  
      <div className="min-h-screen bg-gray-50 p-6">  
        <div className="max-w-7xl mx-auto">  
          <div className="flex justify-between items-center mb-8">  
            <div>  
              <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>  
              <p className="text-gray-600 mt-2">Welcome back, {user?.name || 'User'}</p>  
            </div>  
            <div className="flex items-center space-x-4">  
              <select  
                value={state.filterStatus}  
                onChange={(e) => setState(prev => ({ ...prev, filterStatus: e.target.value }))}  
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"  
                aria-label="Filter by status"  
              >  
                <option value="all">All Properties</option>  
                <option value="available">Available</option>  
                <option value="sold">Sold</option>  
                <option value="pending">Pending</option>  
                <option value="rented">Rented</option>  
              </select>  
              <a  
                href="/properties/new"  
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"  
              >  
                Add Property  
              </a>  
            </div>  
          </div>  

          {state.error && (  
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">  
              <div className="flex items-center">  
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">  
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />  
                </svg>  
                <span className="text-red-700">{state.error}</span>  
              </div>  
              <button  
                onClick={() => setState(prev => ({ ...prev, error: null }))}  
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"  
              >  
                Dismiss  
              </button>  
            </div>  
          )}  

          {state.isLoading ? (  
            <div className="flex justify-center items-center py-20">  
              <LoadingSpinner size="lg" />  
            </div>  
          ) : filteredProperties.length === 0 ? (  
            <div className="text-center py-20 bg-white rounded-lg shadow-sm">  
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">  
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />  
              </svg>  
              <h3 className="mt-4 text-lg font-medium text-gray-900">No properties found</h3>  
              <p className="mt-2 text-gray-500">  
                {state.filterStatus !== 'all'  
                  ? `No properties with status "${state.filterStatus}"`  
                  : 'Get started by adding your first property'}  
              </p>  
              <a  
                href="/properties/new"  
                className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"  
              >  
                Add Property  
              </a>  
            </div>  
          ) : (  
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">  
              {filteredProperties.map(property => (  
                <PropertyCard  
                  key={property.id}  
                  property={property}  
                  onDelete={handleDeleteProperty}  
                />  
              ))}  
            </div>  
          )}  
        </div>  
      </div>  
    </ErrorBoundary>  
  );  
}  
```