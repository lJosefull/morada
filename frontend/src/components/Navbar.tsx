import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { Building2, Home, Plus, LogOut } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const links = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/propiedades', label: 'Propiedades', icon: Building2 },
    { to: '/propiedades/nueva', label: 'Publicar', icon: Plus },
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
              <Building2 className="w-6 h-6" />
              InmobiliarIA
            </Link>
            <div className="flex gap-1">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
