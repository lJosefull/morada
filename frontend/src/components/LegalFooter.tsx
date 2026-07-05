import { Link } from 'react-router-dom';
import VersionBadge from './VersionBadge';

export default function LegalFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <span className="text-xl font-bold text-blue-600">Morada</span>
            <p className="text-sm text-gray-500 mt-2">
              Plataforma tecnológica inmobiliaria operada por ViewSoft SAS.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              &copy; {new Date().getFullYear()} ViewSoft SAS. Todos los derechos reservados.
            </p>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Documentos Legales</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/legal/terms"
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/privacy"
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/data-policy"
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Política de Tratamiento de Datos
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/cookies"
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Plataforma</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/legal/acceptable-use"
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Política de Uso Aceptable
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/intellectual-property"
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Propiedad Intelectual
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/listing-policy"
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Publicación de Inmuebles
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Contacto Legal</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <a
                  href="mailto:legal@viewsoft.com.co"
                  className="hover:text-blue-600 transition-colors"
                >
                  legal@viewsoft.com.co
                </a>
              </li>
              <li className="text-xs text-gray-400">
                ViewSoft SAS
                <br />
                Colombia
              </li>
              <li>
                <a
                  href="mailto:legal@viewsoft.com.co?subject=PQRS%20-%20Morada"
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                >
                  PQRS
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">
            Morada es una plataforma tecnológica de publicación y búsqueda de inmuebles. No somos
            una inmobiliaria, no realizamos corretaje de propiedades ni intermediamos en
            transacciones inmobiliarias. Verifique siempre la información de los inmuebles por sus
            propios medios antes de realizar cualquier transacción.
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <VersionBadge />
            <span className="text-[11px] text-gray-300 dark:text-gray-600">|</span>
            <a
              href="https://github.com/viewsoft/morada/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-gray-400 hover:text-blue-600 transition-colors"
            >
              Release Notes
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
