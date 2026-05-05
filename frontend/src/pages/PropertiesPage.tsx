import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Bed, Bath, Maximize2, Loader2 } from 'lucide-react'
import api from '../lib/api'
import type { Property, PaginatedResponse } from '../types'

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ listingType: '', propertyType: '', search: '' })
  const [loading, setLoading] = useState(true)
  const limit = 12

  useEffect(() => {
    setLoading(true)
    api.get('/properties', { params: { ...filters, page, limit } })
      .then((res) => {
        setProperties(res.data.data || [])
        setTotal(res.data.total || 0)
      })
      .finally(() => setLoading(false))
  }, [page, filters])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Propiedades</h1>
        <Link
          to="/propiedades/nueva"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nueva Propiedad
        </Link>
      </div>

      <div className="flex gap-4 flex-wrap">
        <select
          value={filters.listingType}
          onChange={(e) => { setFilters({ ...filters, listingType: e.target.value }); setPage(1) }}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="">Todos los tipos</option>
          <option value="sale">Venta</option>
          <option value="rent">Arriendo</option>
        </select>
        <select
          value={filters.propertyType}
          onChange={(e) => { setFilters({ ...filters, propertyType: e.target.value }); setPage(1) }}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="">Todas las categorías</option>
          <option value="house">Casa</option>
          <option value="apartment">Departamento</option>
          <option value="land">Terreno</option>
          <option value="commercial">Local Comercial</option>
        </select>
        <input
          type="text"
          placeholder="Buscar por ubicación..."
          value={filters.search}
          onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1) }}
          className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No se encontraron propiedades
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <Link
                key={p.id}
                to={`/propiedades/${p.id}`}
                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  {p.images?.[0] ? (
                    <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400">Sin imagen</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-blue-600 font-medium uppercase mb-1">
                    {p.listingType === 'sale' ? 'Venta' : 'Arriendo'}
                  </p>
                  <h3 className="font-semibold text-gray-900 mb-1">{p.aiTitle || p.title}</h3>
                  <p className="text-lg font-bold text-blue-600 mb-2">
                    ${p.price.toLocaleString('es-CL')}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</span>
                    {p.bedrooms && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{p.bedrooms}</span>}
                    {p.bathrooms && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{p.bathrooms}</span>}
                    {p.surface && <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{p.surface}m²</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 rounded-lg ${
                    page === p ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
