import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';
import { api } from '../lib/api';

export default function VerificationBanner() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.emailVerified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    setError('');
    setSent(false);
    try {
      await api.post('/auth/resend-verification', { email: user.email });
      setSent(true);
    } catch {
      setError(t('verificationBanner.error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{t('verificationBanner.message')}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {sent && <span className="text-xs text-green-700">{t('verificationBanner.resent')}</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
          <button
            onClick={handleResend}
            disabled={sending}
            className="text-xs font-medium text-amber-900 hover:text-amber-700 underline disabled:opacity-50"
          >
            {sending ? t('verificationBanner.resending') : t('verificationBanner.resend')}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-400 hover:text-amber-600"
            aria-label={t('verificationBanner.dismiss')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
