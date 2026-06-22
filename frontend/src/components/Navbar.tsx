import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';
import { api } from '../lib/api';
import { getImageUrl } from '../lib/utils';
import { NotificationDropdown } from './NotificationDropdown';

const RECENT_SEARCHES_KEY = 'nav_recent_searches'
const MAX_RECENT = 5

const QUICK_LINKS = [
  { labelKey: 'property.propertyType.house', icon: '🏠' },
  { labelKey: 'property.propertyType.apartment', icon: '🏢' },
  { labelKey: 'property.propertyType.land', icon: '🌳' },
  { labelKey: 'property.propertyType.commercial', icon: '🏪' },
]

export default function Navbar() {
  const { t } = useTranslation();
  const { accessToken, user, logout } = useAuthStore();
  const isAuthenticated = !!accessToken;
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsSearchFocused(false)
        searchRef.current?.blur()
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const saveRecentSearch = useCallback((query: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== query.toLowerCase())
      const updated = [query, ...filtered].slice(0, MAX_RECENT)
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const removeRecentSearch = useCallback((e: React.MouseEvent, query: string) => {
    e.stopPropagation()
    setRecentSearches(prev => {
      const updated = prev.filter(s => s.toLowerCase() !== query.toLowerCase())
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const executeSearch = useCallback((query: string) => {
    const trimmed = query.trim()
    setSearchQuery('')
    setIsSearchFocused(false)
    searchRef.current?.blur()
    if (trimmed) {
      saveRecentSearch(trimmed)
      navigate(`/properties?search=${encodeURIComponent(trimmed)}`)
    } else {
      navigate('/properties')
    }
  }, [navigate, saveRecentSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    executeSearch(searchQuery)
  }

  const handleQuickLink = (label: string) => {
    executeSearch(label)
  }

  const clearSearch = () => {
    setSearchQuery('')
    searchRef.current?.focus()
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    api.get<{ new: number }>('/inquiries/stats')
      .then(({ data }) => {
        setUnreadCount(data.new || 0);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const isLoggedIn = isAuthenticated;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 shrink-0">
            <span className="text-2xl font-bold text-blue-600">{t('app.name')}</span>
          </Link>

          {/* Global Search — hidden only on the main properties listing (has its own search) */}
          {location.pathname !== '/properties' && (
            <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8 relative" ref={dropdownRef}>
              <form onSubmit={handleSearch} className="w-full">
                <div className={`relative w-full group transition-all duration-200 ${
                  isSearchFocused ? 'scale-[1.02]' : ''
                }`}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className={`w-4 h-4 transition-colors duration-200 ${
                      isSearchFocused ? 'text-blue-500' : 'text-gray-400'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    placeholder={`${t('common.search')}...`}
                    className={`w-full pl-10 pr-10 py-2 rounded-xl text-sm transition-all duration-200 placeholder:text-gray-400 ${
                      isSearchFocused
                        ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-100'
                        : 'bg-gray-100 border-transparent hover:bg-gray-200'
                    } border focus:outline-none`}
                  />
                  {/* Clear button */}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {/* ⌘K badge */}
                  {!isSearchFocused && !searchQuery && (
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-200/70 rounded">
                        <span>⌘</span>K
                      </kbd>
                    </div>
                  )}
                </div>
              </form>

              {/* Search Dropdown */}
              {isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl shadow-gray-200/50 z-50 overflow-hidden animate-[fadeIn_0.15s_ease]">
                  {/* Recent searches */}
                  {recentSearches.length > 0 && !searchQuery && (
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        {t('common.recent')}
                      </p>
                      <div className="space-y-0.5">
                        {recentSearches.map((query) => (
                          <button
                            key={query}
                            onClick={() => executeSearch(query)}
                            className="w-full flex items-center justify-between px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group/btn"
                          >
                            <span className="flex items-center gap-2.5">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="truncate">{query}</span>
                            </span>
                            <button
                              onClick={(e) => removeRecentSearch(e, query)}
                              className="p-0.5 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-200 opacity-0 group-hover/btn:opacity-100 transition-all"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions when typing */}
                  {searchQuery.trim() && (
                    <div className="p-3">
                      <button
                        onClick={() => executeSearch(searchQuery)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>{t('common.search')} &quot;<strong>{searchQuery}</strong>&quot;</span>
                      </button>
                    </div>
                  )}

                  {/* Quick links — only show when not typing */}
                  {!searchQuery && (
                    <div className="border-t border-gray-100 p-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        {t('property.type')}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_LINKS.map((link) => (
                          <button
                            key={link.labelKey}
                            onClick={() => handleQuickLink(t(link.labelKey))}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
                          >
                            <span>{link.icon}</span>
                            <span>{t(link.labelKey)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state — first time */}
                  {recentSearches.length === 0 && !searchQuery && (
                    <div className="p-6 text-center">
                      <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">{t('search.noResultsHint')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/properties"
              className={`text-sm font-medium transition-colors ${
                isActive('/properties')
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('nav.properties')}
            </Link>
            {isLoggedIn && (
              <>
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('nav.dashboard')}
                </Link>
                <Link
                  to="/inquiries"
                  className={`text-sm font-medium transition-colors relative ${
                    isActive('/inquiries') || isActive('/inquiries/history')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('nav.inquiries')}
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/feed"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/feed')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('nav.feed')}
                </Link>
                <Link
                  to="/favorites"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/favorites')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('nav.favorites')}
                </Link>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
              <NotificationDropdown />
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  {user?.avatar ? (
                    <img src={getImageUrl(user.avatar)} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-medium">{user?.name}</span>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      to={`/agents/${user?.id}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      {t('nav.profile')}
                    </Link>
                    <Link
                      to="/properties/new"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      {t('nav.newProperty')}
                    </Link>
                    <Link
                      to="/inquiries"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      {t('nav.inquiries')}
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/favorites"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      {t('nav.favorites')}
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      {t('nav.settings')}
                    </Link>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {/* Mobile search */}
            <form onSubmit={(e) => { handleSearch(e); setIsMobileMenuOpen(false) }} className="px-4 mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('common.search')}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </form>
            <div className="space-y-2 mb-4">
              <Link
                to="/properties"
                className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                  isActive('/properties')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('nav.properties')}
              </Link>
              {isLoggedIn && (
                <>
                  <Link
                    to="/dashboard"
                    className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                      isActive('/dashboard')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('nav.dashboard')}
                  </Link>
                  <Link
                    to="/inquiries"
                    className={`block px-4 py-2 rounded-lg text-sm font-medium flex items-center ${
                      isActive('/inquiries')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('nav.inquiries')}
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/feed"
                    className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                      isActive('/feed')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('nav.feed')}
                  </Link>
                  <Link
                    to="/favorites"
                    className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                      isActive('/favorites')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('nav.favorites')}
                  </Link>
                  <Link
                    to="/properties/new"
                    className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                      isActive('/properties/new')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('nav.newProperty')}
                  </Link>
                </>
              )}
            </div>
            <div className="space-y-2 px-4">
              {isLoggedIn ? (
                <>
                  <Link
                    to={`/agents/${user?.id}`}
                    className="block text-sm font-medium text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('nav.profile')}
                  </Link>
                  <Link
                    to="/settings"
                    className="block text-sm font-medium text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('nav.settings')}
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-left text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block text-sm font-medium text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="block text-sm font-medium text-blue-600 hover:text-blue-800"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('nav.register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
