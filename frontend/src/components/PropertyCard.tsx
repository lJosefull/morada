import React from 'react';
import { Property, PropertyStatus } from '../types/property';
import { Link } from 'react-router-dom';

interface PropertyCardProps {
  property: Property;
  onEdit?: (property: Property) => void;
  onDelete?: (property: Property) => void;
  onStatusChange?: (property: Property, newStatus: PropertyStatus) => void;
}

const statusColors: Record<PropertyStatus, string> = {
  [PropertyStatus.AVAILABLE]: 'bg-green-100 text-green-800',
  [PropertyStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [PropertyStatus.SOLD]: 'bg-red-100 text-red-800',
  [PropertyStatus.RENTED]: 'bg-blue-100 text-blue-800',
  [PropertyStatus.UNDER_MAINTENANCE]: 'bg-gray-100 text-gray-800',
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const mainImage = property.images?.[0];

  // FIX: Handle date formatting for different backend date formats
  const formatDate = (date: Date | string): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Property Image */}
      <div className="relative h-48 bg-gray-200">
        {mainImage && !imageError ? (
          <img
            src={mainImage}
            alt={property.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Status Badge */}
        <span
          className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full ${
            statusColors[property.status]
          }`}
        >
          {property.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Property Details */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
            {property.title}
          </h3>
          <span className="text-lg font-bold text-indigo-600 ml-2">
            {formatPrice(property.price)}
          </span>
        </div>

        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {property.description}
        </p>

        {/* Location */}
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">
            {property.address.city}, {property.address.state}
          </span>
        </div>

        {/* Property Features */}
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

        {/* Property Type */}
        <div className="mt-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
          </span>
        </div>

        {/* FIX: Add created/updated date display */}
        <div className="mt-2 text-xs text-gray-400">
          {property.createdAt && (
            <span>Listed: {formatDate(property.createdAt)}</span>
          )}
        </div>

        {/* Action Buttons */}
        {(onEdit || onDelete || onStatusChange) && (
          <div className="mt-4 flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(property)}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit
              </button>
            )}
            {onStatusChange && (
              <select
                value={property.status}
                onChange={(e) => onStatusChange(property, e.target.value as PropertyStatus)}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {Object.values(PropertyStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(property)}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};