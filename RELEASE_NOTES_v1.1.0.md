# Release Notes — Morada v1.1.0

**Fecha:** 20 de junio de 2026
**Producto:** Morada — Marketplace Inmobiliario
**Operador:** ViewSoft SAS
**Dominio:** morada.viewsoft.com.co

---

## Resumen

Versión de mantenimiento y mejora continua enfocada en corrección de bugs,
eliminación de código muerto y mejoras de UX identificadas en una auditoría
completa del frontend.

---

## Novedades

### 🚀 Mejoras
- **Formulario de propiedades:** Nuevo selector de moneda (CLP/USD/UF) — el modelo ya tenía el campo pero el formulario lo ignoraba
- **Vista de propiedades:** Ahora se registra cada visita (`POST /properties/:id/view`)
- **Paginación en favoritos:** Vista de favoritos con paginación (12 por página)
- **Card reutilizable:** FavoritesPage ahora usa el componente `<PropertyCard>` en lugar de duplicar el layout
- **Loading state en Follow:** El botón de seguir muestra spinner y se deshabilita durante la llamada
- **Mensaje predefinido en contacto:** El formulario de contacto ahora trae pre-llenado un mensaje template
- **SEO dinámico:** `SITE_URL` ahora se configura vía `VITE_SITE_URL` en lugar de hardcodear
- **Navegación SPA:** Reemplazado `window.location.href` por `useNavigate` en PublicProfilePage
- **Lazy loading:** Imágenes en galería y "también vieron" cargan con `loading="lazy"`

### 🐛 Correcciones
- **ShareButton:** URL corregida de `/og/{id}` a `/property/{id}`
- **Propietario ya no puede contactarse a sí mismo:** Email, teléfono y formulario de contacto ocultos para el dueño de la propiedad
- **Labels de contraseña:** Los 3 campos de cambio de contraseña ahora tienen etiquetas distintas (Contraseña actual / Nueva / Confirmar)
- **Columna incorrecta en consultas:** Encabezado de tabla usaba `t('common.noData')` como label — corregido a "Fecha"
- **Catches silenciosos:** Todos los errores de acciones de usuario (favoritos, follow, consultas) ahora muestran toast de error
- **Confirmaciones nativas:** Reemplazados `window.confirm()` por toasts + acción directa

### 🧹 Limpieza
- Eliminados componentes no utilizados: `SearchFilters.tsx`, `SearchBar.tsx`, `ErrorMessage.tsx`
- `formatCurrency` ahora determina locale según la moneda (CLP→es-CL, USD→en-US, EUR→es-ES)

---

## Cambios Técnicos

- **Frontend:** 18 archivos modificados, 3 eliminados
- **TypeScript:** Sin errores de compilación (`tsc --noEmit` ✅)
- **Build:** Vite build exitoso en 1.38s
- **No hay cambios de base de datos** ni de backend en esta release

---

## Breaking Changes

Ninguno. Todos los cambios son compatibles hacia atrás.

---

## Problemas Conocidos

- No hay framework de tests configurado (pendiente Vitest + React Testing Library)
- Las vistas registradas requieren que el backend tenga implementado `POST /properties/:id/view`
- El selector de moneda en el formulario no afecta el preview en tiempo real (formatCurrency en preview necesita el currency)

---

## Instrucciones de Actualización

```bash
cd frontend && npm install && npm run build
```

No se requieren migraciones de base de datos.

Nueva variable de entorno opcional para frontend:
- `VITE_SITE_URL` — URL pública del sitio (default: `https://morada.viewsoft.com.co`)

---

## Changelog

Ver [CHANGELOG.md](./CHANGELOG.md) para la lista detallada de cambios.

---

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `frontend/package.json` | v1.0.0 → v1.1.0 |
| `frontend/src/components/VersionBadge.tsx` | v1.0.0 → v1.1.0 |
| `frontend/src/components/PropertyForm.tsx` | + campo currency |
| `frontend/src/components/ContactForm.tsx` | + template mensaje |
| `frontend/src/components/SEOHead.tsx` | SITE_URL → env var |
| `frontend/src/components/ReviewSection.tsx` | window.confirm → toast |
| `frontend/src/components/InquiryDetail.tsx` | + toasts en catches |
| `frontend/src/lib/utils.ts` | locale dinámico en formatCurrency |
| `frontend/src/pages/PropertyDetailPage.tsx` | + view tracking, ShareButton URL, owner block, follow loading, toast en catch |
| `frontend/src/pages/FavoritesPage.tsx` | pagination + PropertyCard |
| `frontend/src/pages/FeedPage.tsx` | + toast en catch |
| `frontend/src/pages/MyInquiriesPage.tsx` | label columna corregida |
| `frontend/src/pages/SettingsPage.tsx` | labels password, VersionBadge |
| `frontend/src/pages/PublicProfilePage.tsx` | window.location → useNavigate |
| `frontend/src/i18n/es.json` | + keys: currency, date, currentPassword, etc. |
| `frontend/src/components/SearchFilters.tsx` | 🗑️ eliminado |
| `frontend/src/components/SearchBar.tsx` | 🗑️ eliminado |
| `frontend/src/components/ErrorMessage.tsx` | 🗑️ eliminado |

---

© 2026 ViewSoft SAS. Todos los derechos reservados.
