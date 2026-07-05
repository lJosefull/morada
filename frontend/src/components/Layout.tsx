import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import LegalFooter from './LegalFooter';
import CookieConsent from './CookieConsent';
import VerificationBanner from './VerificationBanner';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <VerificationBanner />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <Outlet />
      </main>
      <LegalFooter />
      <CookieConsent />
    </div>
  );
}
