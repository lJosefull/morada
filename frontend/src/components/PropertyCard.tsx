import React, { useState } from 'react';
import type { Property } from '../types/property';
import { ErrorBoundary } from './ErrorBoundary';

interface PropertyCardProps {
  property: Property;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export function PropertyCard({ property, onEdit, onDelete, onView }: PropertyCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800';
      case 'SOLD':
        return 'bg-red-100 text-red-800';
      case 'RENTED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'HOUSE':
        return '🏠';
      case 'APARTMENT':
        return '🏢';
      case 'CONDO':
        return '🏙️';
      case 'LAND':
        return '🌲';
      case 'COMMERCIAL':
        return '🏪';
      default:
        return '📋';
    }
  };

  return (
    <ErrorBoundary>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {/* Property Image */}
        <div className="relative h-48 bg-gray-200">
          {property.images && property.images.length > 0 ? (
            <img
              src={property.images[0].url}
              alt={property.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-property.jpg';
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-4xl">{getTypeIcon(property.type)}</span>
            </div>
          )}
          
          {/* Status Badge */}
          <span
            className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(property.status)}`}
          >
            {property.status}
          </span>
        </div>

        {/* Property Details */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {property.title}
            </h3>
            <span className="text-sm text-gray-500 ml-2">
              {getTypeIcon(property.type)} {property.type}
            </span>
          </div>

          <p className="text-2xl font-bold text-blue-600 mb-2">
            {formatPrice(property.price)}
          </p>

          <p className="text-sm text-gray-600 mb-3">
            {property.address}, {property.city}, {property.state} {property.zipCode}
          </p>

          {/* Property Features */}
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
            {property.bedrooms && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {property.bedrooms} beds
              </span>
            )}
            {property.bathrooms && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {property.bathrooms} baths
              </span>
            )}
            {property.area && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                {property.area} sqft
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {onView && (
              <button
                onClick={onView}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                View Details
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <>
                {showConfirmDelete ? (
                  <div className="flex space-x-1">
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    className="bg-red-50 text-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default PropertyCard;