import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import type { Property } from '../types';
import PropertyForm from '../components/PropertyForm';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<Property>(`/properties/${id}`)
      .then(({ data }) => {
        if (user && data.userId !== user.id) {
          setProperty(null);
        } else {
          setProperty(data);
        }
      })
      .catch(() => setProperty(null))
      .finally(() => setLoading(false));
  }, [id, user?.id]);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );

  if (!property) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Property not found or access denied
        </h2>
        <p className="text-gray-500 mb-4">You can only edit properties you own.</p>
        <Link to="/properties" className="text-blue-600 hover:underline">
          Back to properties
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PropertyForm property={property} isEditing />
    </div>
  );
}
