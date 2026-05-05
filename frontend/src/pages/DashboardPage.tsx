import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Plus, Sparkles } from 'lucide-react'
import api from '../lib/api'
import type { Property } from '../types'

export default function DashboardPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, pendingAI: 0 })

  useEffect(() => {
    api.get('/properties', { params: { limit: 5 } }).then(({ data }) => {
      setProperties(data.data || [])
    })
    api.get('/properties', { params: { limit: 1 } }).then(({ data }) => {
      setStats((s) => ({ ...s, total: data.total || 0 }))
    })
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/propiedades/nueva"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Propiedad
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Propiedades</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <Sparkles className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Con IA Completa</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Sparkles className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">IA Pendiente</p>
              <p className="text-2xl font-bold">{stats.pendingAI}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Últimas Propiedades</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {properties.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hay propiedades aún. ¡Publica tu primera propiedad!
            </div>
          ) : (
            properties.map((p) => (
              <Link
                key={p.id}
                to={`/propiedades/${p.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium">{p.aiTitle || p.title}</p>
                  <p className="text-sm text-gray-500">
                    {p.location} · {p.listingType === 'sale' ? 'Venta' : 'Arriendo'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-600">
                    ${p.price.toLocaleString('es-CL')}
                  </p>
                  <p className={`text-xs ${
                    p.aiStatus === 'completed' ? 'text-green-600' :
                    p.aiStatus === 'processing' ? 'text-yellow-600' : 'text-gray-400'
                  }`}>
                    IA: {p.aiStatus === 'completed' ? 'Completa' :
                          p.aiStatus === 'processing' ? 'Procesando...' :
                          p.aiStatus === 'pending' ? 'Pendiente' : 'Falló'}
                  </p>
                </div>
              </Link>
            ))
          )}
          {properties.length > 0 && (
            <Link
              to="/propiedades"
              className="block p-4 text-center text-blue-600 hover:bg-blue-50 font-medium text-sm"
            >
              Ver todas las propiedades
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
