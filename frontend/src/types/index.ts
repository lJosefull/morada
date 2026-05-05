export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: 'user' | 'admin'
  createdAt: string
}

export interface Property {
  id: string
  title: string
  description: string
  price: number
  currency: string
  propertyType: 'house' | 'apartment' | 'land' | 'commercial'
  listingType: 'sale' | 'rent'
  bedrooms: number | null
  bathrooms: number | null
  surface: number | null
  location: string
  latitude: number | null
  longitude: number | null
  isActive: boolean
  aiTitle: string | null
  aiDescription: string | null
  aiStatus: 'pending' | 'processing' | 'completed' | 'failed'
  userId: string
  user?: { id: string; name: string; email: string; phone?: string }
  images: Image[]
  createdAt: string
  updatedAt: string
}

export interface Image {
  id: string
  url: string
  filename: string
  mimetype: string
  size: number
  isPrimary: boolean
  propertyId: string
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
