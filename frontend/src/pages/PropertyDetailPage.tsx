import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Bed, Bath, Maximize2, ArrowLeft, Sparkles, Loader2, Phone, Mail } from 'lucide-react'
import api from '../lib/api'
import type { Property } from '../types'

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(({ data }) => setProperty(data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )

  if (!property) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Propiedad no encontrada</p>
      <Link to="/propiedades" className="text-blue-600 hover:underline mt-2 inline-block">Volver</Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/propiedades" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver a propiedades
      </Link>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="h-64 md:h-96 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
          {property.images?.[0] ? (
            <img src={property.images[0].url} alt={property.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-lg">Sin imagen disponible</span>
          )}
        </div>

        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm text-blue-600 font-medium uppercase mb-1">
                {property.listingType === 'sale' ? 'En Venta' : 'En Arriendo'}
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.aiTitle || property.title}</h1>
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>{property.location}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">
                ${property.price.toLocaleString('es-CL')}
              </p>
              <p className="text-sm text-gray-500">{property.currency}</p>
            </div>
          </div>

          <div className="flex gap-6 mb-8 text-gray-600">
            {property.bedrooms && (
              <div className="flex items-center gap-2">
                <Bed className="w-5 h-5" /> <span>{property.bedrooms} Dormitorios</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-2">
                <Bath className="w-5 h-5" /> <span>{property.bathrooms} Baños</span>
              </div>
            )}
            {property.surface && (
              <div className="flex items-center gap-2">
                <Maximize2 className="w-5 h-5" /> <span>{property.surface} m²</span>
              </div>
            )}
          </div>

          <div className="prose max-w-none mb-8">
            <h2 className="text-xl font-semibold mb-2">Descripción</h2>
            <p className="text-gray-700 whitespace-pre-line">{property.aiDescription || property.description}</p>
          </div>

          {property.aiStatus === 'completed' && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Optimizado por IA</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Título original:</p>
                  <p className="text-gray-500 line-through">{property.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Título optimizado:</p>
                  <p className="text-blue-700 font-medium">{property.aiTitle}</p>
                </div>
              </div>
            </div>
          )}

          {property.user && (
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Contactar Propietario</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" /> {property.user.email}
                </div>
                {property.user.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" /> {property.user.phone}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
