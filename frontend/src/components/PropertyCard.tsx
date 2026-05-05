import React from 'react';
import { Link } from 'react-router-dom';
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

interface PropertyCardProps {
  property: Property;
  onDelete: (id: string) => Promise<void>;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onDelete }) => {
  const [imageError, setImageError] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(property.id);
      toast.success('Property deleted successfully');
    } catch (error) {
      // FIX: Error is already handled in parent, but we still need to reset state
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link to={`/properties/${property.id}`} className="block">
        <div className="relative h-48 bg-gray-200">
          {property.images && property.images.length > 0 && !imageError ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
              {property.status}
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
            {property.title}
          </h3>
          <p className="text-sm text-gray-500 mb-2 truncate">
            {property.location}
          </p>
          <p className="text-xl font-bold text-blue-600 mb-2">
            {formatPrice(property.price)}
          </p>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {property.description}
          </p>
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>Added {formatDate(property.createdAt)}</span>
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-full px-4 py-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isDeleting ? 'Deleting...' : 'Delete Property'}
        </button>
      </div>
    </div>
  );
};