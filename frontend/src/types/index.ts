export interface User {
  id: string
  email: string
  name: string
  phone?: string
  avatar?: string | null
  role: 'user' | 'admin'
  plan: 'free' | 'agent' | 'agency'
  agencyName?: string | null
  agencyLogo?: string | null
  createdAt: string
}

export interface Property {
  id: string
  title: string
  description: string
  price: number
  currency: string
  propertyType: 'house' | 'apartment' | 'office' | 'land' | 'lote' | 'commercial' | 'warehouse'
  listingType: 'sale' | 'rent'
  bedrooms: number | null
  bathrooms: number | null
  surface: number | null
  location: string
  latitude: number | null
  longitude: number | null
  status: string
  aiTitle: string | null
  aiDescription: string | null
  aiStatus: 'pending' | 'processing' | 'completed' | 'failed'
  userId: string
  user?: { id: string; name: string; email: string; phone?: string; plan: string; agencyName?: string | null; agencyLogo?: string | null }
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

export interface Inquiry {
  id: string
  propertyId: string
  name: string
  email: string
  phone?: string
  message: string
  status: 'new' | 'contacted' | 'interested' | 'not_interested' | 'converted'
  notes?: string
  createdAt: string
  updatedAt: string
  property?: Property
  statusHistory?: InquiryStatusChange[]
}

export interface InquiryStatusChange {
  id: string
  fromStatus: string
  toStatus: string
  changedAt: string
}

export interface InquiryStats {
  total: number
  new: number
  contacted: number
  interested: number
  not_interested: number
  converted: number
  conversionRate: number
}

export interface Favorite {
  id: string
  propertyId: string
  userId: string
  createdAt: string
  property: Property
}

export interface PropertyStats {
  totalViews: number
  weeklyViews: number
  inquiryCount: number
}

export interface Review {
  id: string
  propertyId: string
  userId: string
  user?: { id: string; name: string }
  rating: number
  comment: string
  reply: string | null
  replyDate: string | null
  createdAt: string
  updatedAt: string
}

export interface ReviewStats {
  average: number
  total: number
  distribution: Record<string, number>
}
