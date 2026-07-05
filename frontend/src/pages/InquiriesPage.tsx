import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import InquiryKanban from '../components/InquiryKanban';

export default function InquiriesPage() {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('inquiries.myInquiries')}</h1>
          <p className="text-gray-600 mt-1">{t('inquiries.title')}</p>
        </div>
        <Link
          to="/inquiries/history"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {t('common.viewAll')}
        </Link>
      </div>
      <InquiryKanban />
    </div>
  );
}
