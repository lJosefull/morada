# Changelog

Todas las notas de versión del proyecto Morada.

Este formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.1.0/),
y el versionado sigue [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-06-20

### Lanzamiento Inicial 🚀

Lanzamiento oficial de Morada, el marketplace y plataforma tecnológica inmobiliaria
operada por **ViewSoft SAS**.

#### Funcionalidades Principales

##### Registro y Autenticación
- Registro de usuarios con email y contraseña
- Autenticación con Google OAuth
- Sistema de JWT con refresh tokens y rotación
- Perfiles de usuario configurables (nombre, email, teléfono, avatar)

##### Publicación de Inmuebles
- Publicación de propiedades con título, descripción, precio y ubicación
- Tipos de propiedad: casa, apartamento, terreno, comercial
- Operaciones: venta y arriendo
- Estados: disponible, reservada, vendida, arrendada, oculta
- Subida de imágenes por propiedad (JPEG, PNG, WebP, GIF)
- Imagen principal configurable
- Generación automática de descripciones con IA (DeepSeek)

##### Búsqueda y Descubrimiento
- Búsqueda global con búsquedas recientes (almacenadas localmente)
- Filtros por tipo, operación, precio, habitaciones, baños
- Feed personalizado con recomendaciones basadas en IA
- Sección "Personas también vieron"
- Vista de propiedades en mapa interactivo (Leaflet)

##### Consultas y Comunicación
- Sistema de consultas con formulario de contacto
- Panel Kanban para gestión de leads (Nuevo → Contactado → Interesado → No interesado → Convertido)
- Historial de cambios de estado de consultas
- Notificaciones in-app para nuevas consultas, reseñas y seguidores

##### Reseñas y Calificaciones
- Sistema de reseñas con calificación de 1 a 5 estrellas
- Respuesta del propietario a reseñas
- Estadísticas de reseñas (promedio, distribución)

##### Red Social Inmobiliaria
- Perfiles públicos de agentes e inmobiliarias
- Sistema de seguir/dejar de seguir usuarios
- Lista de propiedades del agente en su perfil

##### Dashboard y Analítica
- Panel de control con estadísticas de consultas
- Métricas de rendimiento de propiedades
- Acciones rápidas (nueva propiedad, ver consultas)
- Tracking de vistas de propiedades

##### SEO y Compartición
- Open Graph tags para compartir en redes sociales
- Meta tags dinámicos por propiedad
- Compartir por WhatsApp, Facebook, Twitter/X, Telegram, email

##### Internacionalización
- Soporte multi-idioma (español implementado)
- Arquitectura preparada para más idiomas (i18next)

##### Seguridad
- Cifrado de contraseñas con bcrypt
- Headers de seguridad (helmet)
- Rate limiting por endpoint
- Validación y sanitización de entradas
- CORS configurado

#### Documentación Técnica
- API documentada con Swagger/OpenAPI (`/docs`)
- Arquitectura modular (Domain-Driven Design)
- Prisma ORM con PostgreSQL
- TypeScript en frontend y backend

#### Cumplimiento Legal (Nuevo - Post-Lanzamiento)
Ver [CHANGELOG detallado](./CHANGELOG.md#100) para la lista completa de cambios legales.

---

## [1.1.0] — 2026-06-20

### Auditoría y Correcciones Frontend 🐛

Release de mantenimiento basada en una auditoría completa del frontend que
identificó y corrigió 18 issues.

#### Correcciones
- **View tracking:** Agregada llamada a `POST /properties/:id/view` en PropertyDetailPage
- **Currency:** Agregado selector de moneda (CLP/USD/UF) en PropertyForm
- **ShareButton URL:** Corregida de `/og/{id}` a `/property/{id}`
- **Owner block:** Propietario ya no puede contactarse a sí mismo
- **Labels password:** 3 campos ahora con etiquetas únicas (actual, nueva, confirmar)
- **Columna tabla:** Encabezado usaba `t('common.noData')` → corregido a "Fecha"
- **Catches silenciosos:** Toast de error en favoritos, follow, consultas, feed
- **window.confirm:** Reemplazado por toasts + acción directa en ReviewSection

#### Mejoras
- **Paginación en favoritos** (12 por página)
- **PropertyCard reutilizado** en FavoritesPage (elimina duplicación de layout)
- **Loading state** en botón Follow
- **Template de mensaje** predefinido en ContactForm
- **SITE_URL** movida a variable de entorno `VITE_SITE_URL`
- **Navegación SPA** (`useNavigate` en lugar de `window.location.href`)
- **Lazy loading** en imágenes de galería y "también vieron"
- **formatCurrency** con locale dinámico según moneda

#### Limpieza
- Componentes eliminados: `SearchFilters.tsx`, `SearchBar.tsx`, `ErrorMessage.tsx`
- `FRONTEND_REVIEW.md` con inventario completo de issues

#### Pendiente para próximas versiones
- [ ] Integración de pagos (Mercado Pago)
- [ ] Facturación electrónica (DIAN)
- [ ] Verificación de email
- [ ] Eliminación de cuenta desde la interfaz
- [ ] Emails transaccionales
- [ ] Sistema de reembolsos
- [ ] Contratos SaaS para inmobiliarias
- [ ] SLA (Acuerdo de Nivel de Servicio)
- [ ] Frontend tests (Vitest + React Testing Library)
- [ ] React Query / SWR para cache de datos
- [ ] Amenities en modelo y formulario (parking, pool, gym)
- [ ] Mapa interactivo para selección de ubicación

---

Las versiones anteriores a 1.0.0 corresponden a desarrollo interno no público.

[1.0.0]: https://github.com/viewsoft/morada/releases/tag/v1.0.0
