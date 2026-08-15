# SPEC — Morada / InmobiliarIA (Marketplace Inmobiliario)

> **Versión:** 1.1.0 | **Última revisión:** 2026-08 | **Fuente de verdad:** este documento (sincronizado con el código)

---

## 1. Resumen

Marketplace inmobiliario colombiano en español. Agentes publican propiedades (casas, apartamentos, terrenos, locales, oficinas, bodegas), compradores buscan/filtran, contactan vía formulario (CRM de inquiries), dejan reviews, siguen agentes, guardan favoritos y reciben un feed personalizado.

- **Marca/UI:** Morada (app) · **Repo/docs:** InmobiliarIA
- **Moneda por defecto:** COP (también soporta CLP, USD, EUR, UF)
- **Deploy:** Vercel (frontend) + Docker compose (backend y Postgres local)

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Backend | NestJS 10 + TypeScript 5.3, Express, arquitectura **DDD Lite** en 4 capas |
| ORM | Prisma 5 + PostgreSQL 16 |
| Auth | JWT (access 15min + refresh 7d) + Passport, Google OAuth, verificación de email |
| Bot protection | Altcha (proof-of-work, nonce anti-replay) |
| Frontend | React 18 + TypeScript strict + Vite 5 |
| Estado | Zustand 4 (persistido en localStorage) |
| Estilos | TailwindCSS 3.4 (paleta custom `primary` azul) |
| Router | React Router v6 (lazy loading 16 páginas) |
| HTTP | Axios con interceptor de refresh token (cola de peticiones) |
| i18n | react-i18next (solo `es`, 22 namespaces) |
| Mapas | Leaflet + OSM (visualización) · Google Places Autocomplete (ubicación) |
| SEO | react-helmet-async + Edge Middleware `/og/:id` (Open Graph) |
| Mail | nodemailer (SMTP) — verificación de email |
| Docs API | Swagger/OpenAPI en `/docs` (solo `NODE_ENV !== 'production'`) |
| IA | Columnas `aiTitle`/`aiDescription`/`aiStatus` en BD y feed de match (`matchReasons`) — sin backend de IA implementado aún |

---

## 3. Arquitectura Backend (DDD Lite)

Prefijo global **`/api`** (setGlobalPrefix). Guard **JWT global** (`APP_GUARD`): todo requiere `Authorization: Bearer <accessToken>` salvo rutas con `@Public()`. Guard **Throttler** global (3 configs: short 3/1s, medium 20/10s, long 100/60s).

```
backend/src/
├── main.ts              # Puerto, helmet, CORS (FRONTEND_URL), ValidationPipe, Swagger, /uploads static, graceful shutdown
├── app.module.ts        # ConfigModule, ThrottlerModule, PrismaModule, AuthInfrastructureModule, MailModule, 11 controllers, guards globales
├── domain/              # Entidades + contratos de repositorio (interfaces y tokens de inyección)
│   ├── auth/ images/ properties/ users/ inquiry/ views/ favorites/ reviews/
├── application/         # Servicios con lógica de negocio (*.service.ts)
│   ├── auth/ users/ properties/ images/ inquiry/ views/ favorites/ reviews/
│   ├── notifications/ follow/ recommendations/
├── infrastructure/      # Implementaciones concretas
│   ├── auth/    (jwt.strategy, google.strategy, guards, public.decorator)
│   ├── database/ (prisma.module, prisma.service, prisma-*.repository.ts)
│   ├── upload/  (multer.config, file-upload.decorator, serve-static.module)
│   ├── mail/    (mail.service — nodemailer)
│   └── altcha/  (altcha.service — challenge + verify)
└── interfaces/          # Controllers + DTOs (class-validator + Swagger)
```

Tokens de inyección de repositorios (definidos en `domain/`, implementados en `prisma.module.ts`):
`USER_REPOSITORY`, `PROPERTY_REPOSITORY`, `IMAGE_REPOSITORY`, `INQUIRY_REPOSITORY`, `VIEW_REPOSITORY`, `DAILY_STATS_REPOSITORY`, `FAVORITE_REPOSITORY`, `REVIEW_REPOSITORY`.

**Reglas de capas:** controllers delgados (validan + delegan), lógica de negocio en `application/`, acceso a BD en repositorios de `infrastructure/`. Todos los repositorios mapean con `toDomain()`.

---

## 4. Modelo de Datos (Prisma)

Esquema en `backend/prisma/schema.prisma`. IDs `cuid()`, timestamps `createdAt`/`updatedAt`, enums como `String` con `@default`.

| Modelo | Campos clave | Relaciones |
|---|---|---|
| **User** | email (único), password (hash), name, phone?, avatar?, googleId?, emailVerified, verificationToken?, role `user\|admin`, plan `free\|agent\|agency`, agencyName?, agencyLogo? | properties, refreshTokens, inquiries, propertyViews, favorites, reviews, notifications, followers/following (self-ref) |
| **Property** | title, description, price (Float), currency (default COP), propertyType, listingType, bedrooms?, bathrooms?, surface?, surfaceUnit, location, latitude?, longitude?, status `available\|reserved\|sold\|rented\|hidden`, aiTitle?, aiDescription?, aiStatus `pending\|processing\|completed\|failed`, userId | user, images, inquiries, propertyViews, dailyStats, favorites, reviews |
| **Image** | url (`/uploads/<file>`), filename, mimetype, size, isPrimary | property (Cascade) |
| **RefreshToken** | token, expiresAt (7d) | user |
| **Inquiry** | propertyId, name, email, phone?, message, status `new\|contacted\|interested\|not_interested\|converted`, notes?, ownerUserId, userId? | property (Cascade), user (SetNull), statusChanges |
| **InquiryStatusChange** | fromStatus?, toStatus, changedAt | inquiry (Cascade) |
| **PropertyView** | userId?, ip?, createdAt | property (Cascade), user (SetNull) |
| **DailyPropertyStats** | date, views, uniqueViews, inquiriesCount — `@@unique([propertyId, date])` | property (Cascade) |
| **Favorite** | — `@@unique([userId, propertyId])` | user/property (Cascade) |
| **Review** | rating (1–5), comment, reply?, replyDate?, — `@@unique([userId, propertyId])` | user/property (Cascade) |
| **Notification** | type, title, message, link?, read | user (Cascade) |
| **UserFollow** | followerId, followingId — `@@unique([followerId, followingId])` | user (Cascade, self-rel) |
| **UsedAltchaNonce** | nonce (único), createdAt | — |

**Índices:** `Inquiry @@index([ownerUserId, status])`, `@@index([propertyId])`; `PropertyView @@index([propertyId, createdAt])`; `Review @@index([propertyId])`; `Notification @@index([userId, read])`, `@@index([userId, createdAt])`; `UsedAltchaNonce @@index([createdAt])`.

**Migraciones:** `add_google_oauth`, `add_legal_compliance`, `add_email_verification`, `add_used_altcha_nonce`.

**Seed** (`backend/prisma/seed.ts`): admin `admin@realestate.com` / `password123`, 10 propiedades con imágenes picsum.

---

## 5. Endpoints API

Todos con prefijo `/api`. 🔓 = público (`@Public()`), 🔒 = requiere JWT.

### 5.1 Auth — `/api/auth`
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/register` | 🔓 (throttle 5/60s) | Registro. Requiere campo `altcha` (resuelto). Devuelve tokens + user |
| POST | `/auth/login` | 🔓 (throttle 10/60s) | Login. Requiere `altcha`. Devuelve tokens + user |
| POST | `/auth/refresh` | 🔓 (throttle 20/60s) | Rota refresh token (verifica firma + DB + expiración) |
| POST | `/auth/verify-email` | 🔓 (throttle 10/60s) | Verifica email con token |
| POST | `/auth/resend-verification` | 🔓 (throttle 3/60s) | Reenvía correo de verificación |
| POST | `/auth/logout` | 🔒 | Borra todos los refresh tokens del user |
| GET | `/auth/profile` | 🔒 | Perfil completo del usuario |
| GET | `/auth/google` | 🔓 | Inicia OAuth de Google (redirect) |
| GET | `/auth/google/callback` | 🔓 | Callback → redirect a `FRONTEND_URL/auth/callback#accessToken=...&refreshToken=...` |
| GET | `/auth/altcha-challenge` | 🔓 | Genera challenge PoW para login/registro |

### 5.2 Properties — `/api/properties`
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/properties` | 🔓 | Lista con filtros: search, propertyType, listingType, minPrice, maxPrice, bedrooms, bathrooms, location, page, limit, latitude, longitude, radius (haversine). → `{data, total, page, limit}` |
| GET | `/properties/mine` | 🔒 | Propiedades del usuario |
| GET | `/properties/feed` | 🔒 | Feed personalizado → `{data, total, page, limit, profile}` con `matchReasons` |
| GET | `/properties/:id` | 🔓 | Detalle (excluye status `hidden`) |
| GET | `/properties/:id/also-viewed` | 🔓 | Hasta 6 "también vistas" |
| POST | `/properties` | 🔒 | Crear (valida límite por plan: free=3, agent=50, agency=∞) |
| PATCH | `/properties/:id` | 🔒 | Actualizar (solo dueño; exige ≥1 imagen) |
| DELETE | `/properties/:id` | 🔒 | Eliminar (solo dueño) |

### 5.3 Images — `/api/properties/:propertyId/images`
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/images` | 🔒 | `@UploadFile('image')` multipart, body `isPrimary`; → `{url: /uploads/<file>}` (solo dueño) |
| DELETE | `/images/:id` | 🔒 | 204 (solo dueño) |
| POST | `/images/:id/primary` | 🔒 | Marca imagen principal (solo dueño) |

### 5.4 Users — `/api/users`
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/users/me` | 🔒 | Perfil propio |
| PATCH | `/users/me` | 🔒 | Actualiza name/email/phone (unicidad de email) |
| POST | `/users/me/avatar` | 🔒 | Sube avatar multipart → `{avatar: /uploads/<file>}` |
| PATCH | `/users/me/password` | 🔒 | Cambia password (valida actual) |
| GET | `/users/:id/profile` | 🔓 | Perfil público + propiedades |

### 5.5 Inquiry (CRM) — `/api`
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/properties/:propertyId/inquiry` | 🔓 (usa `req.user?.id` si hay JWT) | Crea inquiry + notificación `inquiry_new` al dueño |
| GET | `/inquiries/mine` | 🔒 | Inquiries de mis propiedades (`?status=`) |
| GET | `/inquiries/mine/:id` | 🔒 | Detalle (solo dueño) |
| PATCH | `/inquiries/mine/:id/status` | 🔒 | Cambia status + registra `InquiryStatusChange` |
| PATCH | `/inquiries/mine/:id/notes` | 🔒 | Actualiza notas internas |
| GET | `/inquiries/my-history` | 🔒 | Inquiries hechas por mí como comprador |
| GET | `/inquiries/stats` | 🔒 | `{total, byStatus}` |

### 5.6 Views & Stats — `/api`
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/properties/:id/view` | 🔓 | Registra vista, upsert `DailyPropertyStats` |
| GET | `/properties/:id/stats` | 🔒 (dueño) | `{totalViews, weeklyViews, inquiryCount}` |
| GET | `/properties/:id/stats/daily` | 🔒 (dueño) | Daily stats 30 días |

### 5.7 Favorites — `/api/favorites` (clase con JWT)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/favorites/toggle` | `{favorited}` |
| GET | `/favorites` | `{data, total}` (con propiedad + imágenes) |
| GET | `/favorites/check?propertyIds=a,b` | `{ [id]: boolean }` |

### 5.8 Reviews — `/api/properties/:propertyId/reviews`
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/reviews` | 🔓 | Lista paginada |
| GET | `/reviews/stats` | 🔓 | `{average, total, distribution {1..5}}` |
| POST | `/reviews` | 🔒 | Crear (no auto-reseña; 1 por user/property; rating 1–5) |
| PATCH | `/reviews/mine` | 🔒 | Editar mi review |
| DELETE | `/reviews/mine` | 🔒 | Borrar mi review |
| GET | `/reviews/mine` | 🔒 | Mi review |
| PATCH | `/reviews/mine/reply` | 🔒 (dueño propiedad) | Reply del dueño (`{reviewId, reply}`) |
| DELETE | `/reviews/mine/reply` | 🔒 (dueño propiedad) | Quitar reply (`{reviewId}`) |

### 5.9 Notifications — `/api/notifications` (clase con JWT)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/notifications` | `{data, total}`, `?unread=true`, máx 50, order desc |
| GET | `/notifications/unread-count` | `{count}` |
| PATCH | `/notifications/:id/read` | Marcar leída |
| POST | `/notifications/read-all` | `{success}` |

### 5.10 Follow — `/api`
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/follow/toggle` | 🔒 | `{following}` + notificación `follow` al seguido |
| GET | `/follow/check/:userId` | 🔒 | `{following}` |
| GET | `/users/:userId/followers` | 🔓 | Paginado |
| GET | `/users/:userId/following` | 🔓 | Paginado |

### 5.11 SEO
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/seo/properties/:id` | HTML con meta tags OG/Twitter + redirect JS a la SPA (**⚠ bug**: doble prefijo `/api/api/...` y protegido sin `@Public()`) |

---

## 6. Frontend

### 6.1 Rutas (App.tsx)
| Path | Protegida | Página |
|---|---|---|
| `/login`, `/register` | No | LoginPage, RegisterPage |
| `/auth/callback` | No | AuthCallbackPage (OAuth) |
| `/verify-email` | No | VerifyEmailPage |
| `/dashboard` | Sí | DashboardPage |
| `/inquiries` + `/inquiries/history` | Sí | InquiriesPage (kanban), MyInquiriesPage |
| `/feed`, `/favorites` | Sí | FeedPage, FavoritesPage |
| `/properties` | No | PropertiesPage |
| `/property/:id` | No | PropertyDetailPage |
| `/properties/new`, `/property/:id/edit` | Sí | CreatePropertyPage, EditPropertyPage |
| `/agents/:userId` | No | PublicProfilePage |
| `/settings` | Sí | SettingsPage |
| `/legal/:docId` | No | LegalPage |
| `/` y `*` | — | Redirect → `/properties` |

### 6.2 Páginas (16)
Login (Altcha captcha), Register (Altcha + checkbox legales), AuthCallback (tokens del hash URL), VerifyEmail (token de query + reenvío), Dashboard (stats inquiries + propiedades propias + gráfico), PropertiesPage (búsqueda + paginación + grid/lista + sort), PropertyDetail (galería `ImageLightbox` + mapa Leaflet + `ContactForm` + `ReviewSection` + Share + alsoViewed), Create/EditProperty (form con `LocationAutocomplete` + upload + botón IA), Inquiries (kanban 5 columnas drag&drop), MyInquiries (historial comprador), Favorites, PublicProfile (datos + propiedades + reviews), Settings (tabs perfil/seguridad), Feed (`/properties/feed` con matchReasons), Legal (HTML estático de `public/legal/*.html`).

### 6.3 Componentes clave (28)
`Layout` (Navbar + VerificationBanner + Outlet + LegalFooter + CookieConsent), `Navbar` (search inline + dropdowns favoritos/inquiries/notificaciones), `ProtectedRoute` (spinner 3s → redirect con `state.from`), `SEOHead` (helmet, SITE_NAME "Morada"), `PropertyCard`, `PropertyForm` (incluye generación IA con preview), `InquiryKanban`, `InquiryDetail`, `InquiryCard`, `LocationAutocomplete` (Google Places), `PropertyMap` (Leaflet), `ReviewSection`, `ReviewForm`, `ContactForm`, `StarRating`, `Pagination`, `NotificationDropdown` (polling 30s), `AnimatedLink` (View Transitions), `ImageLightbox` (zoom/teclado), `ToastContainer`, `LoadingSpinner`, `ErrorAlert`, `ShareButton`, `CookieConsent`, `VerificationBanner`, `VersionBadge` (v1.1.0), `LegalFooter`, `ErrorBoundary`.

### 6.4 Stores (Zustand)
- **auth.ts** (persist): `user`, `accessToken`, `refreshToken`, `isLoading`, `isFetchingUser`, `error`. Acciones: `login(email,password,altcha)`, `register`, `logout`, `setTokens`, `fetchUser`, `clearError`. `hasActiveSession`.
- **notifications.ts**: `notifications`, `unreadCount`, `loading` + fetch/markAsRead/markAllAsRead.
- **toast.ts**: `toasts[]`, `addToast(message, type, duration=4000)`, `removeToast`.

### 6.5 Lib
- **api.ts** — singleton `ApiClient`: baseURL `${VITE_API_URL}/api` (fallback `/api`), timeout 30s. Interceptor request añade Bearer. Interceptor response: en 401 → refresh con cola (`failedQueue`, `isRefreshing`), `setTokens`, reintenta; si falla `logout()` + redirect `/login`. `getErrorMessage` mapea 400–500.
- **utils.ts** — `PLACEHOLDER_IMAGE`, `getImageUrl` (prefija `VITE_API_URL` a `/uploads/...`), `handleImageError`, `formatCurrency` (COP/CLP/USD/EUR/UF).

### 6.6 i18n
`config.ts` → recurso `es` (`es.json`, 22 namespaces: app, nav, auth, property, feed, favorites, inquiries, dashboard, settings, profile, reviews, search, share, notifications, legal, common, map, toast, propertyDetail, peopleAlsoViewed, footer, verificationBanner). Solo español.

### 6.7 Types (`src/types/index.ts`)
`User`, `Property` (propertyType incluye `office|warehouse|lote` además de house/apartment/land/commercial), `Image`, `PaginatedResponse<T>`, `Inquiry`, `InquiryStatusChange`, `InquiryStats` (con `conversionRate`), `Favorite`, `PropertyStats`, `Review`, `ReviewStats`. `altcha.d.ts` declara `<altcha-widget>`.

---

## 7. Flujos de Autenticación

1. **Altcha:** cliente obtiene `GET /auth/altcha-challenge`, resuelve PoW y envía payload en `register.altcha`/`login.altcha`. Backend verifica `verifySolution` + nonce único (tabla `UsedAltchaNonce`, limpieza >24h).
2. **Access JWT:** 15 min, `JWT_SECRET`, guard global.
3. **Refresh JWT:** 7 días, `JWT_REFRESH_SECRET`, **persistido en `RefreshToken`**. `POST /auth/refresh` rota (borra viejo, crea nuevo). `logout` borra todos.
4. **Google OAuth:** `/auth/google` → redirect; callback ejecuta `googleLogin` (upsert por email: enlaza googleId/avatar si existe, o crea user con `passwordHash:''` y `emailVerified:true`) y redirige con tokens en el hash.
5. **Verificación email:** campo `emailVerified` + `verificationToken`. Correo HTML en español marca "Morada" vía nodemailer → `FRONTEND_URL/verify-email?token=...`.

---

## 8. Configuración y Variables de Entorno

### Backend (`.env` / `.env.example`)
| Variable | Uso | Default |
|---|---|---|
| `DATABASE_URL` | Conexión Prisma PostgreSQL | — (requerida) |
| `JWT_SECRET` | Firma access token (**validado en boot**) | — |
| `JWT_REFRESH_SECRET` | Firma refresh token (**validado en boot**) | — |
| `FRONTEND_URL` | CORS origin, redirect Google, links de verificación | `http://localhost:5173` |
| `PORT` | Puerto HTTP | `3000` |
| `NODE_ENV` | Habilita Swagger y logs Prisma | `development` |
| `ALTCHA_HMAC_KEY` | HMAC de challenges Altcha | — |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Correo | `mail.nova.com.co` / `587` / — / — / `noreply@morada.app` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | OAuth Google | — |
| `UPLOAD_DIR` | Directorio de uploads | `./uploads` |
| `MAX_FILE_SIZE` | Límite subida (bytes) | `5242880` (5 MB) |
| `DEEPSEEK_API_KEY` | (documentada en `.env.example`; sin uso en código) | — |

**Notas:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `UPLOAD_DIR`, `MAX_FILE_SIZE` existen en `.env.example` pero no en el ejemplo de PROJECT.md; `SMTP_HOST` difiere entre `.env.example` (`smtp.mi.com.co`) y el default del código (`mail.nova.com.co`).

### Frontend (`frontend/.env`)
`VITE_API_URL`, `VITE_GOOGLE_MAPS_API_KEY`.

### main.ts (boot)
- Falla si `JWT_SECRET`/`JWT_REFRESH_SECRET` faltan o son los defaults del `.env.example`.
- Helmet (`crossOriginResourcePolicy: cross-origin`, CSP off para Swagger).
- CORS = `FRONTEND_URL` (soporta comas), credentials true.
- `ValidationPipe` global: `whitelist`, `forbidNonWhitelisted`, `transform`, `enableImplicitConversion`.
- Swagger `/docs` solo en no-producción, con `addBearerAuth()`.
- Graceful shutdown SIGTERM/SIGINT.

### Upload (multer)
diskStorage en `UPLOAD_DIR`, filename `uuid()+ext`, solo `image/jpeg|png|webp|gif`, máx 5 MB. Servido en `/uploads/*` desde `main.ts`. Campos: `properties/:propertyId/images` (campo `image`) y `users/me/avatar` (campo `avatar`).

---

## 9. Despliegue

| Destino | Detalle |
|---|---|
| **Docker (local)** | `docker compose up --build`. Postgres 16-alpine (healthcheck), backend (Dockerfile multi-stage node:24, `prisma db push --accept-data-loss` + `migrate resolve --applied add_email_verification`), frontend (nginx:alpine, puerto 5173→80) |
| **Vercel (frontend)** | `vercel.json`: build `cd frontend && npm run build`, output `frontend/dist`, SPA rewrites. Edge Middleware `/og/:id` genera OG meta tags (`morada.viewsoft.com.co`) |
| **nginx.conf (frontend prod)** | Security headers (CSP con Google Maps/fonts), proxy `/api/`, `/uploads/`, `/docs` → backend:3000, SPA fallback, cache estáticos 1y |

---

## 10. Convenciones del Código

- **Prettier:** `semi`, `singleQuote`, `trailingComma: "all"`, `printWidth: 100`, `tabWidth: 2`, `endOfLine: lf`.
- **ESLint:** `@typescript-eslint` recommended; `no-explicit-any` off (backend); `no-unused-vars` warn con `argsIgnorePattern: '^_'`.
- **Commits:** Conventional Commits (`feat/fix/refactor/docs/...` + scope: `auth`, `properties`, `deploy`, ...).
- **Naming:** `PascalCase` clases/componentes/tipos, `camelCase` funciones/variables, archivos `kebab-case` (backend) / `PascalCase.tsx` (frontend).
- **Errores frontend:** sistema de toasts (`store/toast.ts`), nunca `alert()`.
- **Consumo API frontend:** siempre vía `api` de `lib/api.ts` (nunca `fetch`/axios crudo).
- **i18n:** textos visibles vía `t('clave')`.
- **Comentarios:** no añadir salvo que el usuario lo pida.

---

## 11. Problemas Conocidos / Quirks

🔴 **Críticos**
- Ruta SEO `/api/api/seo/properties/:id` (doble prefijo) y protegida por JWT sin `@Public()` — el guard la bloquearía.
- `register` setea `emailVerified: true` hardcodeado sin enviar correo (inconsistente con el flujo de verificación).
- Login no bloquea usuarios con `emailVerified: false`.

🟡 **Medios**
- `getAlsoViewed` y `recordView` son `@Public()` pero leen `req.user?.id`, que nunca está poblado en rutas públicas.
- Borrar imágenes no borra el archivo físico del disco.
- `findMine` (properties) no filtra `hidden` cuando hay `userId`.
- URL inconsistente: `/property/:id` (singular) vs `/properties` (plural).
- Columnas AI (`aiTitle`, `aiDescription`, `aiStatus`) y `DEEPSEEK_API_KEY` sin implementación de generación.
- `next.config.js` (frontend) es residuo legacy (rewrites a :3001) — no se usa con Vite.
- `ServeStaticModule` definido pero no registrado (el static funciona vía `main.ts`).
- Sin framework de tests en frontend; en backend no hay spec files aún pese a jest configurado.
- `VersionBadge` y `VersionBadge` hardcodean versión.
- `RegisterDto.password` exige mayúscula+minúscula+dígito, pero `ChangePasswordDto.newPassword` solo `MinLength(6)`.

🟢 **Leves**
- `supabase/` folder vacío.
- Brand doble: "Morada" (UI) vs "InmobiliarIA" (docs).
- Sin schedulers/cron ni colas de email.

---

## 12. Roadmap Pendiente (del proyecto)

- [ ] Sistema de toasts terminado (base ya existe)
- [ ] Soporte S3/cloud storage para imágenes
- [ ] Tests unitarios (auth, properties, inquiries)
- [ ] React Query / SWR para caché de datos
- [ ] CI/CD básico (GitHub Actions)
- [ ] Notificaciones reales en tiempo real
- [ ] Backend de IA para `aiTitle`/`aiDescription` (DeepSeek/OpenAI)
