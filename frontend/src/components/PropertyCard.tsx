import React, { useState } from 'react';
import { Property } from '../types/property';
import { formatCurrency } from '../lib/utils';

interface PropertyCardProps {
  property: Property;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export function PropertyCard({ property, onEdit, onDelete, onView }: PropertyCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    sold: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rented: 'bg-blue-100 text-blue-800',
  };

  const defaultImage = '/placeholder-property.jpg';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Property Image */}
      <div className="relative h-48 bg-gray-200">
        {!isImageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse">
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        )}
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        ) : (
          <img
            src={property.images?.[0] || defaultImage}
            alt={property.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isImageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setIsImageLoaded(true);
            }}
            loading="lazy"
          />
        )}
        
        {/* Status Badge */}
        <span
          className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full ${
            statusColors[property.status] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
        </span>
      </div>

      {/* Property Details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 truncate" title={property.title}>
          {property.title}
        </h3>
        <p className="mt-1 text-sm text-gray-500 truncate">
          {property.address}, {property.city}, {property.state} {property.zipCode}
        </p>
        
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xl font-bold text-blue-600">
            {formatCurrency(property.price)}
          </p>
          <p className="text-sm text-gray-500">
            {property.propertyType}
          </p>
        </div>

        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {property.bedrooms} bed
          </span>
          <span className="flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {property.bathrooms} bath
          </span>
          <span className="flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            {property.squareFootage.toLocaleString()} sqft
          </span>
        </div>

        {/* Action Buttons */}
        {(onEdit || onDelete || onView) && (
          <div className="mt-4 flex space-x-2">
            {onView && (
              <button
                onClick={onView}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                View
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}