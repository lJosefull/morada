# Real Estate Marketplace — InmobiliarIA

> **Estado:** En desarrollo activo | **Versión:** 1.0.0

## Stack Tecnológico

| Capa       | Tecnología                                                                 |
| ---------- | -------------------------------------------------------------------------- |
| Backend    | NestJS 10 + TypeScript 5.3                                                |
| ORM        | Prisma 5 + PostgreSQL 16                                                   |
| Frontend   | React 18 + TypeScript + Vite 5                                             |
| Estado     | Zustand 4 (persistido en localStorage)                                     |
| Estilos    | TailwindCSS 3.4                                                            |
| Router     | React Router v6                                                            |
| HTTP       | Axios (con interceptor de refresh token)                                   |
| Auth       | JWT (access 15min + refresh 7d) con Passport                              |
| Docs API   | Swagger (OpenAPI) en `/api`→`/docs`                                        |
| Infra      | Docker Compose (Postgres 16, Backend, Frontend)                            |
| AI         | Soporte DeepSeek / OpenAI para descripciones generadas                     |

---

## Arquitectura

### Backend — DDD Lite (`backend/src/`)

```
src/
├── main.ts                         # Entry point, CORS, ValidationPipe, Swagger
├── app.module.ts                   # Módulo raíz (global guard JWT)
├── domain/                         # Capa de dominio (entidades, interfaces de repositorio)
│   ├── auth/auth.types.ts
│   ├── images/image.entity.ts
│   ├── images/image.repository.ts
│   ├── properties/property.entity.ts
│   ├── properties/property.repository.ts
│   ├── users/user.entity.ts
│   └── users/user.repository.ts
├── application/                    # Capa de aplicación (servicios con lógica de negocio)
│   ├── auth/auth.service.ts
│   ├── images/images.service.ts
│   ├── properties/properties.service.ts
│   └── users/users.service.ts
├── infrastructure/                 # Capa de infraestructura (implementaciones concretas)
│   ├── auth/
│   │   ├── auth.module.ts          # Configura JWT + Passport
│   │   ├── jwt-auth.guard.ts       # Global guard (excluye @Public)
│   │   ├── jwt.strategy.ts         # Estrategia Passport JWT
│   │   ├── public.decorator.ts     # Decorador @Public()
│   │   └── constants.ts
│   ├── database/
│   │   ├── prisma.module.ts        # Módulo global con providers
│   │   ├── prisma.service.ts       # PrismaClient wrapper
│   │   ├── prisma-user.repository.ts
│   │   ├── prisma-property.repository.ts
│   │   └── prisma-image.repository.ts
│   └── upload/
│       ├── multer.config.ts        # Config de subida de archivos
│       ├── file-upload.decorator.ts
│       └── serve-static.module.ts  # Sirve archivos estáticos /uploads
└── interfaces/                     # Capa de interfaces (controllers, DTOs)
    ├── auth/auth.controller.ts
    ├── auth/auth.dto.ts
    ├── properties/properties.controller.ts
    ├── properties/properties.dto.ts
    ├── images/images.controller.ts
    └── users/users.controller.ts
```

### Frontend — Pages + Components + Store (`frontend/src/`)

```
src/
├── main.tsx                         # Entry point
├── App.tsx                          # Router + lazy loading + ErrorBoundary
├── index.css                        # Tailwind + View Transitions
├── types/index.ts                   # Interfaces compartidas
├── lib/
│   ├── api.ts                       # Axios client con refresh token interceptor
│   └── utils.ts                     # formatCurrency
├── store/
│   └── auth.ts                      # Zustand store (persistida)
├── components/
│   ├── Layout.tsx                   # Navbar + Outlet
│   ├── Navbar.tsx                   # Navegación responsive
│   ├── PropertyCard.tsx
│   ├── PropertyForm.tsx
│   ├── ProtectedRoute.tsx
│   ├── Pagination.tsx
│   ├── SearchBar.tsx
│   ├── SearchFilters.tsx
│   ├── LoadingSpinner.tsx
│   ├── ErrorBoundary.tsx
│   ├── ErrorAlert.tsx
│   ├── ErrorMessage.tsx
│   └── AnimatedLink.tsx
└── pages/
    ├── LoginPage.tsx
    ├── RegisterPage.tsx
    ├── DashboardPage.tsx
    ├── PropertiesPage.tsx
    ├── PropertyDetailPage.tsx
    ├── CreatePropertyPage.tsx
    └── EditPropertyPage.tsx
```

### Modelo de Datos (Prisma)

```
User
├── id (cuid)
├── email (único)
├── password (hash)
├── name
├── phone?
├── role: "user" | "admin"
├── properties[]
└── refreshTokens[]

Property
├── id (cuid)
├── title, description
├── price (Float), currency
├── propertyType (enum: house|apartment|land|commercial)
├── listingType (enum: sale|rent)
├── bedrooms?, bathrooms?, surface?
├── location, latitude?, longitude?
├── status (enum: available|reserved|sold|rented|hidden)
├── aiTitle?, aiDescription?, aiStatus
├── userId → User
├── images[]
└── timestamps

Image
├── id, url, filename, mimetype, size
├── isPrimary
├── propertyId → Property
└── createdAt

RefreshToken
├── id, token, userId, expiresAt
```

---

## Estado Actual — Issues Identificados

### 🔴 Críticos

| ID   | Issue                                              | Dónde                    | Impacto                            |
| ---- | -------------------------------------------------- | ------------------------ | ---------------------------------- |
| S-01 | JWT secrets hardcodeados como fallback              | auth.module.ts, jwt.strategy.ts, auth.service.ts | Riesgo de seguridad |
| S-02 | Secrets en docker-compose.yml                      | docker-compose.yml       | Exposición en repositorio          |
| S-03 | Backend en modo dev en Docker (`npm run start:dev`) | backend/Dockerfile       | Sin optimización ni producción     |
| S-04 | No hay rate limiting en auth endpoints              | auth.controller          | Vulnerable a brute force           |
| S-05 | CORS hardcodeado en lugar de usar variable de entorno | main.ts                | Difícil de configurar              |

### 🟡 Medios

| ID   | Issue                                              | Dómit                        | Impacto                     |
| ---- | -------------------------------------------------- | ---------------------------- | --------------------------- |
| M-01 | Sin tests ni configuración de testing               | Todo el proyecto             | Sin cobertura               |
| M-02 | SearchFilters incompatible (condo, townhouse)       | SearchFilters.tsx            | Opciones inválidas           |
| M-03 | Errores con `alert()` en lugar de UI toast          | PropertyForm.tsx             | UX pobre                    |
| M-04 | Refresh llamada con axios.post /api/auth/refresh    | api.ts                       | No usa baseURL configurada  |
| M-05 | No hay healthcheck ni graceful shutdown explícito   | main.ts                     | Despliegue frágil           |
| M-06 | Sin helmet/security headers                         | main.ts                     | Seguridad web reducida      |
| M-07 | Upload a disco local sin cloud storage              | multer.config.ts             | No escala                   |
| M-08 | `user.entity.ts` con `refreshToken` que no existe en BD | user.entity.ts          | Inconsistencia de dominio   |
| M-09 | Registro pasa `password` (plaintext) innecesario    | auth.service.ts              | Datos innecesarios en código |

### 🟢 Leves / Mejoras

| ID   | Mejora                                              | Dómit                        |
| ---- | --------------------------------------------------- | ---------------------------- |
| L-01 | Login y Register comparten layout (DRY)             | pages/                       |
| L-02 | Falta componente Toast unificado                    | -                            |
| L-03 | Dockerfile frontend no build de prod                | frontend/Dockerfile          |
| L-04 | No hay .env con VITE_API_URL usado en api.ts        | api.ts usa '/api' hardcodeado |
| L-05 | PropertiesPage y SearchFilters tienen lógica duplicada | components/                |
| L-06 | Sin manejo de caché ni stale-while-revalidate       | Frontend general             |
| L-07 | Pagination no memorizada                            | PropertiesPage.tsx           |
| L-08 | Sin ESLint config file                              | frontend/                    |

---

## Endpoints API

| Método | Ruta                      | Auth   | Descripción                    |
| ------ | ------------------------- | ------ | ------------------------------ |
| POST   | /api/auth/register        | Público | Registrar usuario             |
| POST   | /api/auth/login           | Público | Iniciar sesión                |
| POST   | /api/auth/refresh         | Público | Refrescar token               |
| POST   | /api/auth/logout          | Bearer | Cerrar sesión                 |
| GET    | /api/auth/profile         | Bearer | Perfil del usuario actual     |
| GET    | /api/users/me             | Bearer | Datos del usuario actual      |
| GET    | /api/properties           | Público | Listar propiedades (con filtros) |
| GET    | /api/properties/mine      | Bearer | Propiedades del usuario       |
| GET    | /api/properties/:id       | Público | Detalle de propiedad          |
| POST   | /api/properties           | Bearer | Crear propiedad               |
| PATCH  | /api/properties/:id       | Bearer | Actualizar propiedad          |
| DELETE | /api/properties/:id       | Bearer | Eliminar propiedad            |
| POST   | /api/properties/:pid/images | Bearer | Subir imagen                 |
| DELETE | /api/properties/:pid/images/:id | Bearer | Eliminar imagen          |
| POST   | /api/properties/:pid/images/:id/primary | Bearer | Marcar imagen principal |

---

## Cómo Levantar

### Con Docker (recomendado)

```bash
# 1. Clonar y entrar
cd proyecto-inmobiliario

# 2. Configurar variables
cp .env.example .env
# Editar .env con tus claves

# 3. Levantar servicios
docker compose up --build

# 4. Abrir en navegador
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000/api
# Swagger Docs: http://localhost:3000/docs
```

### Desarrollo local (sin Docker)

```bash
# Terminal 1: Backend
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

---

## ✅ Cambios Aplicados (17-May-2026)

| ID    | Cambio                                                          | Estado |
| ----- | --------------------------------------------------------------- | ------ |
| S-01  | JWT secrets: removidos fallbacks hardcodeados                    | ✅     |
| S-02  | Secrets removidos de docker-compose.yml; ahora usan .env         | ✅     |
| S-03  | Dockerfile multi-stage para backend (build + production)         | ✅     |
| S-04  | Rate limiting con @nestjs/throttler (3 req/s, 20/10s, 100/60s)  | ✅     |
| S-05  | CORS ahora usa FRONTEND_URL desde variable de entorno            | ✅     |
| M-01  | Jest + @nestjs/testing configurado en backend                   | ✅     |
| M-02  | SearchFilters corregido (removidos condo, townhouse)            | ✅     |
| M-04  | Refresh token usa `this.client.post` en vez de axios directo    | ✅     |
| M-06  | Helmet agregado para security headers                          | ✅     |
| M-08  | `refreshToken` removido de IUser (inconsistente con BD)         | ✅     |
| M-09  | Register ya no pasa `password` plaintext innecesario            | ✅     |
| L-01  | Dockerfile frontend con nginx y multi-stage                     | ✅     |
| L-02  | nginx.conf con proxy a backend y SPA fallback                   | ✅     |
| L-03  | .env.example actualizado con placeholders seguros               | ✅     |
| L-04  | Graceful shutdown agregado (SIGTERM/SIGINT)                     | ✅     |

## Checklist de Prioridades para Próximo Sprint

- [ ] M-03: Implementar sistema de toasts (reemplazar alert())
- [ ] M-07: Agregar soporte S3/cloud storage para imágenes
- [ ] L-01: Consolidar layouts de Login/Register (DRY)
- [ ] L-07: Implementar React Query / SWR para caché de datos
- [ ] Agregar tests unitarios (al menos auth y properties)
- [ ] Agregar CI/CD básico (GitHub Actions)

---

## Mantenimiento

| Archivo                    | Propósito                                |
| -------------------------- | ---------------------------------------- |
| `.env` (raíz)              | Variables de entorno del backend         |
| `backend/.env.example`     | Template de variables backend            |
| `docker-compose.yml`       | Orquestación de servicios                |
| `backend/prisma/schema.prisma` | Esquema de base de datos             |
| `PROJECT.md`               | Este documento                          |
