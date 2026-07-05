import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Property } from '../types';
import { formatCurrency, getImageUrl } from '../lib/utils';

interface PropertyCardProps {
  property: Property;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function PropertyCard({
  property,
  onEdit,
  onDelete,
  onView,
  isFavorite,
  onToggleFavorite,
}: PropertyCardProps) {
  const { t } = useTranslation();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const defaultImage = '/placeholder-property.jpg';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 bg-gray-200">
        {!isImageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse">
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        )}
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        ) : (
          <img
            src={getImageUrl(property.images?.[0]?.url) || defaultImage}
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

        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`absolute top-2 left-2 p-1.5 rounded-full transition-all ${
              isFavorite
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
            }`}
          >
            <svg
              className="w-4 h-4"
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}

        <div className="absolute top-2 right-2 flex gap-1">
          {property.status && property.status !== 'available' && (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                property.status === 'sold'
                  ? 'bg-red-500 text-white'
                  : property.status === 'rented'
                    ? 'bg-purple-500 text-white'
                    : property.status === 'reserved'
                      ? 'bg-amber-500 text-white'
                      : property.status === 'hidden'
                        ? 'bg-gray-500 text-white'
                        : 'bg-blue-100 text-blue-800'
              }`}
            >
              {property.status === 'sold'
                ? t('property.sold')
                : property.status === 'rented'
                  ? t('property.rented')
                  : property.status === 'reserved'
                    ? 'Reservado'
                    : property.status === 'hidden'
                      ? t('property.hidden')
                      : property.status}
            </span>
          )}
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            {property.listingType === 'sale' ? t('property.forSale') : t('property.forRent')}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 truncate" title={property.title}>
          {property.title}
        </h3>
        <p className="mt-1 text-sm text-gray-500 truncate">{property.location}</p>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xl font-bold text-blue-600">
            {formatCurrency(property.price, property.currency)}
          </p>
          <p className="text-sm text-gray-500 capitalize">{property.propertyType}</p>
        </div>

        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
          {property.bedrooms && (
            <span className="flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              {property.bedrooms} {t('property.bedrooms')}
            </span>
          )}
          {property.bathrooms && (
            <span className="flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {property.bathrooms} {t('property.bathrooms')}
            </span>
          )}
          {property.surface && (
            <span className="flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
              {property.surface} m²
            </span>
          )}
        </div>

        {(onEdit || onDelete || onView) && (
          <div className="mt-4 flex space-x-2">
            {onView && (
              <button
                onClick={onView}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                {t('common.view')}
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('common.edit')}
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                {t('common.delete')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
