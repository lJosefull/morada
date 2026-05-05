import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePropertyStore, Property } from '../stores/propertyStore';
import toast from 'react-hot-toast';

interface PropertyFormProps {
  property?: Property;
  isEditing?: boolean;
}

export default function PropertyForm({ property, isEditing = false }: PropertyFormProps) {
  const navigate = useNavigate();
  const { createProperty, updateProperty, isSubmitting } = usePropertyStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    address: '',
    status: 'available',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (property && isEditing) {
      setFormData({
        title: property.title || '',
        description: property.description || '',
        price: property.price?.toString() || '',
        address: property.address || '',
        status: property.status || 'available',
      });
    }
  }, [property, isEditing]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const data = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        address: formData.address.trim(),
        status: formData.status,
      };

      if (isEditing && property) {
        await updateProperty(property.id, data);
        toast.success('Property updated successfully');
        navigate(`/properties/${property.id}`);
      } else {
        const newProperty = await createProperty(data);
        toast.success('Property created successfully');
        navigate(`/properties/${newProperty.id}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save property';
      toast.error(message);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`input-field mt-1 ${errors.title ? 'border-red-500' : ''}`}
          placeholder="Enter property title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className={`input-field mt-1 ${errors.description ? 'border-red-500' : ''}`}
          placeholder="Enter property description"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
          Price ($)
        </label>
        <input
          type="number"
          id="price"
          name="price"
          value={formData.price}
          onChange={handleChange}
          className={`input-field mt-1 ${errors.price ? 'border-red-500' : ''}`}
          placeholder="Enter price"
          min="0"
          step="0.01"
        />
        {errors.price && (
          <p className="mt-1 text-sm text-red-600">{errors.price}</p>
        )}
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className={`input-field mt-1 ${errors.address ? 'border-red-500' : ''}`}
          placeholder="Enter property address"
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address}</p>
        )}
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="input-field mt-1"
        >
          <option value="available">Available</option>
          <option value="pending">Pending</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      <div className="flex items-center space-x-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : (
            isEditing ? 'Update Property' : 'Create Property'
          )}
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}