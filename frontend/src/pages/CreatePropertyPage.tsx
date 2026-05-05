import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Loader2 } from 'lucide-react'
import api from '../lib/api'

export default function CreatePropertyPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', price: 0, currency: 'CLP',
    propertyType: 'house', listingType: 'sale',
    bedrooms: 0, bathrooms: 0, surface: 0, location: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { data } = await api.post('/properties', form)
      navigate(`/propiedades/${data.id}`)
    } catch (err) {
      console.error(err)
      alert('Error al crear la propiedad')
    } finally {
      setSubmitting(false)
    }
  }

  const update = (key: string, value: any) => setForm({ ...form, [key]: value })

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Publicar Propiedad</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input value={form.title} onChange={(e) => update('title', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required
              placeholder="Ej: Hermosa casa en la playa" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32" required
              placeholder="Describe tu propiedad con detalles..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select value={form.propertyType} onChange={(e) => update('propertyType', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-white">
              <option value="house">Casa</option>
              <option value="apartment">Departamento</option>
              <option value="land">Terreno</option>
              <option value="commercial">Local Comercial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Operación</label>
            <select value={form.listingType} onChange={(e) => update('listingType', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-white">
              <option value="sale">Venta</option>
              <option value="rent">Arriendo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
            <input type="number" value={form.price} onChange={(e) => update('price', Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required min={1} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
            <select value={form.currency} onChange={(e) => update('currency', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-white">
              <option value="CLP">CLP</option>
              <option value="UF">UF</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dormitorios</label>
            <input type="number" value={form.bedrooms} onChange={(e) => update('bedrooms', Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" min={0} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Baños</label>
            <input type="number" value={form.bathrooms} onChange={(e) => update('bathrooms', Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" min={0} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Superficie (m²)</label>
            <input type="number" value={form.surface} onChange={(e) => update('surface', Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" min={0} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
            <input value={form.location} onChange={(e) => update('location', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required
              placeholder="Ej: Viña del Mar" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">IA incluida</p>
            <p className="text-sm text-blue-700">
              Al publicar, nuestro equipo de IA (CEO, Copywriter, QA) optimizará
              automáticamente el título y la descripción de tu propiedad.
            </p>
          </div>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Publicando...</> : 'Publicar Propiedad'}
        </button>
      </form>
    </div>
  )
}
