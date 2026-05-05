import { memo, useCallback, useState } from 'react';

interface Filters {
  city: string;
  minPrice: number;
  maxPrice: number;
  propertyType: string;
}

interface SearchFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  className?: string;
}

const PROPERTY_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
];

export const SearchFilters = memo(function SearchFilters({
  filters,
  onFilterChange,
  className = '',
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = useCallback(
    (key: keyof Filters, value: string | number) => {
      const newFilters = { ...localFilters, [key]: value };
      setLocalFilters(newFilters);
      onFilterChange(newFilters);
    },
    [localFilters, onFilterChange]
  );

  const handleReset = useCallback(() => {
    const resetFilters: Filters = {
      city: '',
      minPrice: 0,
      maxPrice: 0,
      propertyType: '',
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  }, [onFilterChange]);

  const hasActiveFilters = Object.values(localFilters).some(
    value => value !== '' && value !== 0
  );

  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium lg:hidden"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      <div className={`space-y-4 ${isExpanded ? 'block' : 'hidden lg:block'}`}>
        {/* Search by City */}
        <div>
          <label htmlFor="city-filter" className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            id="city-filter"
            type="text"
            value={localFilters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            placeholder="Search by city..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Price Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="min-price" className="block text-sm font-medium text-gray-700 mb-1">
              Min Price
            </label>
            <input
              id="min-price"
              type="number"
              value={localFilters.minPrice || ''}
              onChange={(e) => handleFilterChange('minPrice', Number(e.target.value))}
              placeholder="$0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label htmlFor="max-price" className="block text-sm font-medium text-gray-700 mb-1">
              Max Price
            </label>
            <input
              id="max-price"
              type="number"
              value={localFilters.maxPrice || ''}
              onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value))}
              placeholder="$1,000,000"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Property Type */}
        <div>
          <label htmlFor="property-type" className="block text-sm font-medium text-gray-700 mb-1">
            Property Type
          </label>
          <select
            id="property-type"
            value={localFilters.propertyType}
            onChange={(e) => handleFilterChange('propertyType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {PROPERTY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
});