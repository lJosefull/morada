import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth'

type TabId = 'profile' | 'security'

const tabs: { id: TabId; label: string; icon: string }[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    id: 'security',
    label: 'Security',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },

]

export default function SettingsPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const fetchUser = useAuthStore((s) => s.fetchUser)

  const [activeTab, setActiveTab] = useState<TabId>('profile')

  // Profile form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

  // Security form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)



  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setPhone(user.phone || '')
    }
  }, [user])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(null)
    setProfileSaving(true)
    try {
      const body: Record<string, string> = {}
      if (name !== user?.name) body.name = name
      if (email !== user?.email) body.email = email
      if (phone !== (user?.phone || '')) body.phone = phone
      if (Object.keys(body).length === 0) throw new Error('No changes to save')
      await api.patch('/users/me', body)
      await fetchUser()
      setProfileSuccess('Changes saved successfully')
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)
    if (newPassword !== confirmPassword)
      return void setPasswordError('Passwords do not match')
    if (newPassword.length < 6)
      return void setPasswordError('Password must be at least 6 characters')
    setPasswordSaving(true)
    try {
      await api.patch('/users/me/password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess('Password updated successfully')
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : 'Current password is incorrect'
      )
    } finally {
      setPasswordSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {t('settings.title')}
          </h1>
          <p className="text-gray-500 mt-1">
            {t('settings.title')}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Left Sidebar ── */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Avatar + Info */}
              <div className="p-6 text-center border-b border-gray-100">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-lg shadow-indigo-200">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="mt-4 font-semibold text-gray-900">
                  {user.name}
                </h2>
                <p className="text-sm text-gray-500">{user.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                  {t('profile.contactInfo')}
                </span>
                <div className="mt-3 flex justify-center gap-2">
                  {user.plan === 'free' && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      Plan gratuito
                    </span>
                  )}
                  {user.plan === 'agent' && (
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                      Agente
                    </span>
                  )}
                  {user.plan === 'agency' && (
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                      {user.agencyName || 'Inmobiliaria'}
                    </span>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-3 space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setProfileError(null)
                      setProfileSuccess(null)
                      setPasswordError(null)
                      setPasswordSuccess(null)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 ${
                        activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d={tab.icon}
                      />
                    </svg>
                    {tab.id === 'profile' ? t('settings.profile') : tab.label}
                  </button>
                ))}
              </nav>

              {/* Member Since */}
              <div className="px-6 pb-5">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">
                  {t('profile.memberSince')}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                {/* Version */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">
                    Versión
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    v1.0.0
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Content Area ── */}
          <div className="flex-1 min-w-0">
            {/* ══ PROFILE TAB ══ */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="px-8 py-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">
                    {t('settings.profile')}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('settings.profile')}
                  </p>
                </div>

                <form
                  onSubmit={handleProfileSubmit}
                  className="px-8 py-6 space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('auth.name')}
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                        placeholder={t('inquiries.yourName')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('auth.email')}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                        placeholder={t('inquiries.yourEmail')}
                        required
                      />
                    </div>
                  </div>

                  <div className="max-w-md">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('auth.phone')}
                      </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                        placeholder={t('inquiries.yourPhone')}
                    />
                  </div>

                  {/* Profile Error */}
                  {profileError && (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-3.5 rounded-xl text-sm">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="flex-1">{profileError}</span>
                        <button
                          type="button"
                          onClick={() => setProfileError(null)}
                          className="font-semibold hover:underline text-sm"
                        >
                          {t('common.close')}
                        </button>
                    </div>
                  )}

                  {/* Profile Success */}
                  {profileSuccess && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3.5 rounded-xl text-sm">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="flex-1">{profileSuccess}</span>
                        <button
                          type="button"
                          onClick={() => setProfileSuccess(null)}
                          className="font-semibold hover:underline text-sm"
                        >
                          {t('common.close')}
                        </button>
                    </div>
                  )}

                  {/* Profile Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {t('settings.saveChanges')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setName(user.name)
                        setEmail(user.email)
                        setPhone(user.phone || '')
                      }}
                      className="px-6 py-3 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ══ SECURITY TAB ══ */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="px-8 py-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">{t('settings.account')}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('settings.account')}
                  </p>
                </div>

                <form
                  onSubmit={handlePasswordSubmit}
                  className="px-8 py-6 space-y-6"
                >
                  <div className="max-w-md">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('auth.password')}
                      </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder={t('auth.password')}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('auth.password')}
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder={t('auth.password')}
                        minLength={6}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('auth.password')}
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder={t('auth.password')}
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  {/* Security Tip */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 max-w-lg">
                    <svg
                      className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-amber-800">
                      {t('auth.password')}
                    </p>
                  </div>

                  {/* Password Error */}
                  {passwordError && (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-3.5 rounded-xl text-sm">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="flex-1">{passwordError}</span>
                        <button
                          type="button"
                          onClick={() => setPasswordError(null)}
                          className="font-semibold hover:underline text-sm"
                        >
                          {t('common.close')}
                        </button>
                    </div>
                  )}

                  {/* Password Success */}
                  {passwordSuccess && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3.5 rounded-xl text-sm">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="flex-1">{passwordSuccess}</span>
                        <button
                          type="button"
                          onClick={() => setPasswordSuccess(null)}
                          className="font-semibold hover:underline text-sm"
                        >
                          {t('common.close')}
                        </button>
                    </div>
                  )}

                  {/* Password Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {passwordSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t('common.loading')}
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          {t('common.save')}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPassword('')
                        setNewPassword('')
                        setConfirmPassword('')
                      }}
                      className="px-6 py-3 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                    >
                      {t('common.close')}
                    </button>
                  </div>
                </form>
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  )
}
