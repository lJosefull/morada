import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { formatCurrency, getImageUrl, handleImageError } from '../lib/utils'
import { useToastStore } from '../store/toast'
import LocationAutocomplete from './LocationAutocomplete'
import type { Property, Image } from '../types'

interface PropertyFormProps {
  property?: Property
  isEditing?: boolean
}

const typeLabels: Record<string, string> = {
  house: 'Casa',
  apartment: 'Departamento',
  office: 'Oficina',
  land: 'Terreno',
  lote: 'Lote',
  commercial: 'Local comercial',
  warehouse: 'Bodega',
}

const typeIcons: Record<string, string> = {
  house: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  apartment: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  land: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  commercial: 'M21 13.255A23.93 23.93 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  office: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  warehouse: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  lote: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

const DESCRIPTION_MAX = 2000

export default function PropertyForm({ property, isEditing = false }: PropertyFormProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addToast = useToastStore((s) => s.addToast)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<Image[]>(property?.images || [])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [deletedImageIds, setDeletedImageIds] = useState<Set<string>>(new Set())

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'COP',
    propertyType: 'house',
    listingType: 'sale',
    bedrooms: '',
    bathrooms: '',
    surface: '',
    location: '',
    latitude: '',
    longitude: '',
    status: 'available',
  })

  useEffect(() => {
    if (property && isEditing) {
      setFormData({
        title: property.title || '',
        description: property.description || '',
        price: property.price?.toString() || '',
        currency: property.currency || 'COP',
        propertyType: property.propertyType || 'house',
        listingType: property.listingType || 'sale',
        bedrooms: property.bedrooms?.toString() || '',
        bathrooms: property.bathrooms?.toString() || '',
        surface: property.surface?.toString() || '',
        location: property.location || '',
        latitude: property.latitude?.toString() || '',
        longitude: property.longitude?.toString() || '',
        status: property.status || 'available',
      })
    }
  }, [property, isEditing])

  useEffect(() => {
    if (property) setImages(property.images || [])
  }, [property])

  const descLength = formData.description.length

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = t('property.title')
    if (!formData.description.trim()) newErrors.description = t('property.description')
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = t('property.price')
    }
    if (!formData.location.trim()) newErrors.location = t('property.location')
    if (isEditing && images.filter((img) => !deletedImageIds.has(img.id)).length === 0) {
      newErrors.images = 'Agrega al menos una imagen'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const data = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        currency: formData.currency,
        propertyType: formData.propertyType,
        listingType: formData.listingType,
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
        surface: formData.surface ? Number(formData.surface) : undefined,
        location: formData.location.trim(),
        latitude: formData.latitude ? Number(formData.latitude) : undefined,
        longitude: formData.longitude ? Number(formData.longitude) : undefined,
        status: formData.status,
      }

      if (isEditing && property) {
        await api.patch(`/properties/${property.id}`, data)
        for (const imageId of deletedImageIds) {
          await api.delete(`/properties/${property.id}/images/${imageId}`)
        }
        setDeletedImageIds(new Set())
        addToast(t('common.save'), 'success')
        navigate(`/property/${property.id}`)
      } else {
        const { data: newProperty } = await api.post<Property>('/properties', data)
        for (const file of pendingFiles) {
          const fd = new FormData()
          fd.append('image', file)
          await api.post(`/properties/${newProperty.id}/images`, fd)
        }
        setPendingFiles([])
        addToast(t('common.submit'), 'success')
        navigate(`/property/${newProperty.id}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save property'
      addToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    if (name === 'description' && value.length > DESCRIPTION_MAX) return
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!property || !isEditing) {
      setPendingFiles((prev) => [...prev, file!])
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { data: uploaded } = await api.post<Image>(
        `/properties/${property.id}/images`,
        fd,
      )
      setImages((prev) => [...prev, uploaded])
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to upload image', 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemovePending = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDeleteImage = (imageId: string) => {
    setDeletedImageIds((prev) => {
      const next = new Set(prev)
      if (next.has(imageId)) {
        next.delete(imageId)
      } else {
        next.add(imageId)
      }
      return next
    })
  }

  const handleSetPrimary = async (imageId: string) => {
    if (!property) return
    try {
      await api.post(`/properties/${property.id}/images/${imageId}/primary`)
      setImages((prev) =>
        prev.map((img) => ({ ...img, isPrimary: img.id === imageId })),
      )
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to set primary image', 'error')
    }
  }

  const fieldClass = (name: string, extra = '') =>
    `mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 ${
      errors[name] ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'
    } ${extra}`

  const previewImage = images.find((img) => img.isPrimary) || images[0]

  return (
    <div className="lg:grid lg:grid-cols-3 lg:gap-8">
      <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-4">
            {isEditing ? t('property.editTitle') : t('property.createTitle')}
          </h2>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              {t('property.title')} <span className="text-red-500">*</span>
            </label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange}
              className={fieldClass('title')} placeholder={t('property.title')}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                {t('property.description')} <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs tabular-nums ${descLength > DESCRIPTION_MAX * 0.9 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {descLength}/{DESCRIPTION_MAX}
              </span>
            </div>
            <textarea id="description" name="description" rows={5} value={formData.description} onChange={handleChange}
              className={fieldClass('description', 'resize-y min-h-[120px]')}
              placeholder={t('property.description')}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  {t('property.price')} <span className="text-red-500">*</span>
                </label>
                <input type="number" id="price" name="price" value={formData.price} onChange={handleChange}
                  className={fieldClass('price')} min="0" placeholder={t('property.price')}
                />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                  {t('property.currency')}
                </label>
                <select id="currency" name="currency" value={formData.currency} onChange={handleChange}
                  className={fieldClass('')}
                >
                  <option value="COP">COP</option>
                  <option value="CLP">CLP</option>
                  <option value="USD">USD</option>
                  <option value="UF">UF</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">{t('property.type')}</label>
              <select id="propertyType" name="propertyType" value={formData.propertyType} onChange={handleChange}
                className={fieldClass('')}
              >
                <option value="house">{t('property.propertyType.house')}</option>
                <option value="apartment">{t('property.propertyType.apartment')}</option>
                <option value="office">{t('property.propertyType.office')}</option>
                <option value="land">{t('property.propertyType.land')}</option>
                <option value="lote">{t('property.propertyType.lote')}</option>
                <option value="commercial">{t('property.propertyType.commercial')}</option>
                <option value="warehouse">{t('property.propertyType.warehouse')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="listingType" className="block text-sm font-medium text-gray-700">{t('property.type')}</label>
              <select id="listingType" name="listingType" value={formData.listingType} onChange={handleChange}
                className={fieldClass('')}
              >
                <option value="sale">{t('property.sale')}</option>
                <option value="rent">{t('property.rent')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                {t('property.location')} <span className="text-red-500">*</span>
              </label>
              <LocationAutocomplete
                value={formData.location}
                latitude={formData.latitude}
                longitude={formData.longitude}
                onChange={(data) => {
                  setFormData((prev) => ({ ...prev, ...data }))
                  if (data.location) setErrors((prev) => ({ ...prev, location: '' }))
                }}
                className={fieldClass('location')}
                placeholder={t('property.location')}
              />
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            </div>
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">{t('property.location')}</label>
              <input type="number" step="any" id="latitude" name="latitude" value={formData.latitude} onChange={handleChange}
                className={fieldClass('')} placeholder="-33.4489"
              />
            </div>
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">{t('property.location')}</label>
              <input type="number" step="any" id="longitude" name="longitude" value={formData.longitude} onChange={handleChange}
                className={fieldClass('')} placeholder="-70.6693"
              />
            </div>
            <div>
              <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">{t('property.bedrooms')}</label>
              <input type="number" id="bedrooms" name="bedrooms" value={formData.bedrooms} onChange={handleChange}
                className={fieldClass('')} min="0"
              />
            </div>
            <div>
              <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">{t('property.bathrooms')}</label>
              <input type="number" id="bathrooms" name="bathrooms" value={formData.bathrooms} onChange={handleChange}
                className={fieldClass('')} min="0"
              />
            </div>
            <div>
              <label htmlFor="surface" className="block text-sm font-medium text-gray-700">{t('property.surface')} ({t('property.surfaceUnit')})</label>
              <input type="number" id="surface" name="surface" value={formData.surface} onChange={handleChange}
                className={fieldClass('')} min="0"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">{t('property.status')}</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange}
                className={fieldClass('')}
              >
                <option value="available">{t('property.available')}</option>
                <option value="reserved">{t('property.status')}</option>
                <option value="sold">{t('property.sold')}</option>
                <option value="rented">{t('property.rented')}</option>
                <option value="hidden">{t('property.hidden')}</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">{t('property.hidden')}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">{t('property.images')}</label>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {isEditing && images.map((img) => (
                  <div key={img.id} className={`relative group w-24 h-24 rounded-lg overflow-hidden border flex-shrink-0 ${deletedImageIds.has(img.id) ? 'border-red-400 opacity-50' : 'border-gray-200'}`}>
                    <img src={getImageUrl(img.url)} alt="" className="w-full h-full object-cover" onError={handleImageError} />
                    {deletedImageIds.has(img.id) ? (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <button type="button" onClick={() => handleDeleteImage(img.id)}
                          className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow"
                          title="Restaurar imagen"
                        >
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                        {!img.isPrimary && (
                          <button type="button" onClick={() => handleSetPrimary(img.id)}
                            className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                            title={t('property.uploadImages')}
                          >
                            <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </button>
                        )}
                        <button type="button" onClick={() => handleDeleteImage(img.id)}
                          className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                          title={t('common.delete')}
                        >
                          <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                    {img.isPrimary && (
                      <span className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {t('common.view')}
                      </span>
                    )}
                  </div>
                ))}
                {!isEditing && pendingFiles.map((file, i) => (
                  <div key={i} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button type="button" onClick={() => handleRemovePending(i)}
                        className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                        title={t('common.delete')}
                      >
                        <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                <label className={`w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors flex-shrink-0 ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleUpload} className="hidden" />
                  {uploading ? (
                    <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-[10px] text-gray-400 font-medium">{t('property.uploadImages')}</span>
                    </>
                  )}
                </label>
              </div>
              {!isEditing && pendingFiles.length > 0 && (
                <p className="text-xs text-blue-600">
                  {pendingFiles.length} imagen(es) seleccionada(s) — se subirán al crear la propiedad
                </p>
              )}
              <p className="text-xs text-gray-400">{t('property.maxFileSize')}</p>
              {errors.images && (
                <p className="text-sm text-red-500 mt-2">{errors.images}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button type="submit" disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-sm"
          >
            {submitting ? t('common.loading') : isEditing ? t('common.save') : t('common.create')}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>

      <div className="lg:col-span-1 mt-6 lg:mt-0 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {t('property.detailTitle')}
          </h3>
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <div className="aspect-[16/10] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative">
              {previewImage ? (
                <img src={getImageUrl(previewImage.url)} alt="" className="w-full h-full object-cover" onError={handleImageError} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d={typeIcons[formData.propertyType] || typeIcons.house} />
                  </svg>
                </div>
              )}
              <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                formData.listingType === 'sale' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
              }`}>
                {formData.listingType === 'sale' ? t('property.forSale') : t('property.forRent')}
              </span>
            </div>
            <div className="p-3 space-y-1.5">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {formData.title || t('property.title')}
              </p>
              <p className="text-lg font-bold text-blue-600 leading-tight">
                {formData.price ? formatCurrency(Number(formData.price)) : '—'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {formData.location || t('property.location')}
              </p>
              {formData.status && formData.status !== 'available' && (
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                  formData.status === 'sold' ? 'bg-red-100 text-red-700' :
                  formData.status === 'rented' ? 'bg-purple-100 text-purple-700' :
                  formData.status === 'reserved' ? 'bg-amber-100 text-amber-700' :
                  formData.status === 'hidden' ? 'bg-gray-100 text-gray-700' : ''
                }`}>
                  {formData.status === 'sold' ? t('property.sold') :
                   formData.status === 'rented' ? t('property.rented') :
                   formData.status === 'reserved' ? t('property.available') :
                   formData.status === 'hidden' ? t('property.hidden') : formData.status}
                </span>
              )}
              <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1 border-t border-gray-100">
                {formData.bedrooms && <span>{formData.bedrooms} dorm</span>}
                {formData.bathrooms && <span>{formData.bathrooms} baños</span>}
                {formData.surface && <span>{formData.surface} m²</span>}
                <span className="capitalize">{typeLabels[formData.propertyType] || formData.propertyType}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
