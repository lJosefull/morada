# Informe de Auditoría de Seguridad — Morada (Marketplace Inmobiliario)

**Stack:** Frontend React 18/Vite 5 (Docker/nginx + Vercel) · Backend NestJS 10/Prisma 5/Postgres 16 (Docker) · Node 24
**Alcance:** SECRETS, DEPENDENCIAS, SAST, CONFIG · **Modo:** solo lectura, sin instalación de paquetes
**Fecha:** 2026-08-15

---

## 1. SECRETS

| Estado | Hallazgo | Ubicación | Detalle |
|---|---|---|---|
| ✅ OK | Sin `.env` reales commiteados | `.gitignore`, `git ls-files` | Solo `*.env.example` en el repo; `.env`, `.env.local`, `.env.production` ignorados. |
| ✅ OK | Sin secretos en historial git | `git log --all -p` | No se encontraron `sk-…`, `AKIA…`, `AIza…`, `ghp_…` ni valores reales de SMTP/DEEPSEEK en la historia. |
| ⚠️ BAJA | Credencial admin hardcodeada en seed | `backend/prisma/seed.ts:7,10,17` | `bcrypt.hash('password123')` + `admin@realestate.com` con `role: 'admin'`. Riesgo solo si el seed corre en prod; exigir cambio de password y no ejecutarlo en producción. |
| ⚠️ BAJA | Password de Postgres hardcodeado | `docker-compose.yml:9` | `POSTGRES_PASSWORD: postgres`, puerto `5432:5432` publicado al host → si el host tiene IP pública, la BD es accesible con credencial trivial. Mover a `.env` y limitar bind (`127.0.0.1:5432:5432`). |
| ⚠️ BAJA | Key de Google Maps embebida en bundle | `frontend/src/components/LocationAutocomplete.tsx:20,77` | `VITE_GOOGLE_MAPS_API_KEY` se inyecta en el JS del cliente (por diseño). No hay key hardcodeada en el repo. Restringir la key por **HTTP referrer** en la consola de Google. |
| ⚠️ BAJA | `FB_APP_ID` / URLs hardcodeadas | `middleware.js:6-10` | Son valores públicos (no secretos); aceptable, pero mejor centralizar en env vars. |
| ⚠️ BAJA | `.gitignore` incompleto | `.gitignore` | No cubre `.env.development`, `.env.test`, `.env.staging` → riesgo de commit accidental. |

---

## 2. DEPENDENCIAS

**Frontend** (`frontend/package-lock.json` — sí commiteado, auditable con `npm audit`):
- **5 high + 3 moderate** (ninguna crítica):
  - `vite 5.4.21` — HIGH: `server.fs.deny` bypass y path traversal en `.map` de deps optimizadas (GHSA-fx2h-pf6j-xcff, GHSA-4w7w-66w2-5vf9). Impacto real limitado al dev-server; sin fix disponible → planear migración a Vite ≥6.
  - `postcss 8.5.16` — HIGH: path traversal por `sourceMappingURL` al auto-cargar mapas de origen (GHSA-r28c-9q8g-f849, GHSA-fxqj-rqcc-2cmp). Sin fix; riesgo bajo si solo se procesa CSS propio.
  - `react-router-dom 6.30.4` — MODERATE: open redirect → XSS (GHSA-jjmj-jmhj-qwj2). **Afecta producción.** Requiere migrar a v7 (sin fix en la línea 6.x).

**Backend** (`backend/package.json` — **SIN `package-lock.json`**):
- ❌ **Sin lockfile commiteado** → builds no reproducibles y `npm audit` no ejecutable (`ENOLOCK`). Además el `Dockerfile` hace `COPY backend/package-lock.json ./` + `npm ci`, que **falla sin lockfile** (ver Config).
- `multer ^1.4.5-lts.1` — línea 1.x con vulnerabilidades conocidas (DoS de `busboy`); migrar a **multer 2.x**.
- `@prisma/client ^5.0.0` / `prisma ^5.0.0` — versión mayor antigua y no soportada oficialmente en Node 24; actualizar a Prisma 6 y auditar advisories.
- `bcrypt ^5.1.0` — librería en desuso; considerar `bcrypt` ≥6 o migrar a argon2/bcryptjs.
- `@types/passport-google-oauth20` en `dependencies` (debería ser `devDependencies`).

---

## 3. SAST (código)

### CRITICA

**C1. XSS almacenado por subida de archivos → robo de tokens (same-origin en despliegue Docker)**
- **Archivos:** `backend/src/infrastructure/upload/multer.config.ts:18`, `backend/src/infrastructure/upload/multer.config.ts:22-27`, `backend/src/interfaces/images/images.controller.ts:21-32`, `backend/src/main.ts:36`, `frontend/nginx.conf` (location `/uploads/`), `frontend/src/store/auth.ts:107-113`
- **Explicación:** `multer.config.ts:18` conserva la extensión del `originalname` controlada por el atacante (`${uuid()}${ext}`); el `fileFilter` (líneas 22-27) valida **solo `file.mimetype`**, suplible sin validar magic bytes. Cualquier usuario autenticado puede subir `evil.html` con mimetype `image/png` a su propiedad (`images.controller.ts:21-32`). `main.ts:36` sirve `/uploads` con `express.static`; y `frontend/nginx.conf` (location `/uploads/`) lo **proxy al mismo origin que la SPA**, donde `frontend/src/store/auth.ts:107-113` persiste `accessToken`+`refreshToken` en **localStorage** → una página HTML ejecutada ahí roba las sesiones (account takeover total).
- **Recomendación:** validar magic bytes + allowlist de extensiones; servir uploads con `Content-Type: application/octet-stream` / `Content-Disposition: attachment` (o CDN separada); desactivar ejecución de scripts en `/uploads` en nginx; mover tokens fuera de localStorage (memoria + cookie HttpOnly o sessionStorage).

### ALTA

**A1. Cuenta secuestrable vía enlace de Google OAuth por email**
- **Archivos:** `backend/src/application/auth/auth.service.ts:46`, `backend/src/application/auth/auth.service.ts:133-150`
- **Explicación:** `auth.service.ts:46` registra con `emailVerified: true` (**sin verificación real de email**). `googleLogin` (líneas 133-150) enlaza `googleId` a la cuenta existente **solo por email**, sin probar la propiedad del email. **Cadena:** el atacante registra `victima@mail.com` con su propia contraseña → cuando la víctima usa "Continuar con Google", su cuenta queda enlazada al perfil del atacante → el atacante entra con la contraseña que conoce.
- **Recomendación:** exigir verificación de email antes de marcar `emailVerified`; al enlazar Google a una cuenta preexistente con password, exigir login previo o verificación del email.

**A2. `prisma db push --accept-data-loss` en cada arranque**
- **Archivos:** `backend/Dockerfile` (CMD)
- **Explicación:** el CMD ejecuta `npx prisma db push --accept-data-loss; npx prisma migrate resolve …; node dist/main.js`: borra/recrea el schema con pérdida de datos en **cada** inicio del contenedor.
- **Recomendación:** usar migraciones versionadas (`prisma migrate deploy`); eliminar `--accept-data-loss` y `migrate resolve`.

**A3. Rate limiting de auth inoperante**
- **Archivos:** `backend/src/app.module.ts:39-55`, `backend/src/interfaces/auth/auth.controller.ts:28,36,44,52,60`
- **Explicación:** `app.module.ts:39-55` registra throttlers **nombrados** `short` (3/1s), `medium` (20/10s), `long` (100/60s). El `AuthController` usa `@Throttle({ default: {...} })` apuntando a un throttler `default` que **no existe** → los límites intencionados (5/min registro, 10/min login) **no se aplican**; solo queda el global de 100 req/min por IP (verificar semántica v6 en runtime).
- **Recomendación:** usar los nombres reales (`@Throttle({ short: {...}, long: {...} })`) o crear un throttler `default`.

### MEDIA

**M1. Enumeración de PII sin autenticación**
- **Archivos:** `backend/src/application/users/users.service.ts:43-53`, `backend/src/interfaces/users/users.controller.ts:56-59`, `backend/src/application/follow/follow.service.ts:57,77`, `backend/src/interfaces/follow/follow.controller.ts:28-29,43-44`
- **Explicación:** `GET /api/users/:id/profile` público expone **email, phone, plan, role, agencyName** de cualquier usuario. `GET /users/:userId/followers` y `/following` públicos devuelven **email y phone** de todos los seguidores/seguidos.
- **Recomendación:** exponer solo `name`/`phone`/`avatar` (y solo para usuarios con propiedades publicadas); `plan`/`role`/`email` solo al dueño. Relevante también para la Ley 1581 (Colombia).

**M2. Tokens JWT de refresh almacenados en claro en BD**
- **Archivos:** `backend/src/application/auth/auth.service.ts:245-251`
- **Explicación:** `generateTokens` guarda el refresh token tal cual en la tabla `RefreshToken`. Si la BD se compromete, los tokens son utilizables.
- **Recomendación:** guardar el hash (SHA-256) del token y comparar por hash.

**M3. Tokens en el fragmento de URL del callback de Google**
- **Archivos:** `backend/src/interfaces/auth/auth.controller.ts:103`, `frontend/src/pages/AuthCallbackPage.tsx:12-16`
- **Explicación:** el callback redirige a `#accessToken=…&refreshToken=…` → quedan en el historial del navegador.
- **Recomendación:** entregarlos por `postMessage`/cookie HttpOnly/endpoint de intercambio con code en lugar de fragment.

**M4. Throttler/`req.ip` sin `trust proxy` tras nginx**
- **Archivos:** `backend/src/main.ts` (sin `trust proxy`), `frontend/nginx.conf` (header `X-Forwarded-For`)
- **Explicación:** detrás de nginx, `req.ip` es la IP del contenedor: el throttle de 100/min es **compartido por todos los usuarios** (un atacante puede agotarlo y DoSear a todos) y las "vistas" registran IP falsa.
- **Recomendación:** `app.set('trust proxy', …)` correctamente y confirmar el throttle por IP real.

**M5. Inflado de vistas por IP del cliente**
- **Archivos:** `backend/src/interfaces/views/views.controller.ts:13-14`, `backend/src/interfaces/views/views.dto.ts:4-8`
- **Explicación:** `POST /properties/:id/view` acepta `ip` provista por el cliente; sin deduplicación por IP. Permite inflar estadísticas y manipular rankings de "más vistos".
- **Recomendación:** derivar la IP del request (con trust proxy) y deduplicar por `propertyId + ip + ventana temporal`.

### BAJA

- `ChangePasswordDto` (`backend/src/interfaces/users/users.dto.ts:30`) exige solo `MinLength(6)` sin complejidad, inconsistente con el registro (`auth.dto.ts` exige mayúscula/minúscula/dígito). Endurecer.
- `resendVerification` (`backend/src/application/auth/auth.service.ts:118`) responde "User not found" → **enumeración de emails**.
- `SeoController` (`backend/src/interfaces/seo/seo.controller.ts:14`): ruta `api/seo/properties/:id` + prefijo global → `/api/api/seo/…` (doble `api`); **sin `@Public`** (el JwtAuthGuard global exige token → rota para crawlers) y **sin filtrar `status='hidden'`** (fuga latente si se arregla la ruta). La propiedad visible real sí se filtra vía `backend/src/infrastructure/database/prisma-property.repository.ts:16` (`findById` excluye `hidden`), que es la que usa la API pública.
- `LegalPage.tsx:118`: `dangerouslySetInnerHTML` con contenido de archivos estáticos fijos (riesgo bajo, sin path traversal).
- Consentimiento con PII en `localStorage` (`frontend/src/pages/RegisterPage.tsx:64`, clave `morada-consent-<email>`).
- CSP débil: `frontend/nginx.conf` con `'unsafe-inline' 'unsafe-eval'` en `script-src`; `backend/src/main.ts:30` desactiva CSP del API (por Swagger).
- **altcha desde CDN sin SRI** (`frontend/index.html:38`, `https://cdn.jsdelivr.net/npm/altcha/dist/altcha.min.js`, sin versión fijada) → riesgo de supply chain; y además **el CSP de nginx no incluye `jsdelivr.net`**, por lo que el widget anti-bots **no carga** en el despliegue Docker (control roto). Fijar versión + SRI, o auto-hospedar el script.
- `backend/src/infrastructure/altcha/altcha.service.ts:24-28`: `maxNumber: 50000` → PoW trivial de resolver programáticamente; con A3, el registro/login automático es factible.
- Sin `Strict-Transport-Security` (HSTS) en ningún despliegue.
- `vercel.json`: **sin security headers** en el despliegue Vercel.
- `next.config.js` y `frontend/api/property.js` (función OG): código legacy/muerto; el escape `e()` de `property.js` y `seo.controller.ts` es correcto para sus contextos.

---

## 4. CONFIG

- **Build backend roto:** `backend/Dockerfile` usa `COPY backend/package.json backend/package-lock.json ./` con contexto `./backend` (rutas inconsistentes) y `npm ci` exige un lockfile que no existe → el build de Docker **falla** tal como está.
- `docker-compose.yml:27-28` publica `3000:3000` del backend directo al host (restringir; debería ir solo detrás de nginx/reverse proxy).
- `backend` corre como `root` en la imagen, sin HEALTHCHECK ni filesystem read-only.
- `.env.example` (raíz) documenta `JWT_SECRET=change-me-to-a-random-64-char-hex` etc. → placeholders correctos, y `backend/src/main.ts:11-22` valida que los secrets no sean los default (buena práctica ✅).

---

## Puntos fuertes verificados ✅
- `ValidationPipe` estricto: `whitelist` + `forbidNonWhitelisted` + `transform` (`backend/src/main.ts:46-55`) → sin mass-assignment.
- Sin SQL crudo (`$queryRaw`/`$executeRaw` ausentes) → sin inyección SQL por queries.
- CORS con lista explícita de orígenes + `credentials` (`backend/src/main.ts:38-44`).
- Autorización por ownership correcta en `backend/src/application/properties/properties.service.ts:73-90` e `backend/src/application/images/images.service.ts:28-57` (sin IDOR).
- Rotación y revocación de refresh tokens (`backend/src/application/auth/auth.service.ts:198-208`); JWT access 15 min (`backend/src/infrastructure/auth/auth.module.ts:14`).
- altcha con nonce único anti-replay (`backend/src/infrastructure/altcha/altcha.service.ts:34-45`).
- Escape HTML correcto en `middleware.js` y `seo.controller.ts`.

---

## Prioridades de remediación
**C1** (XSS/tokens) → **A1** (cuenta secuestrable) → **A2**/**A3** → **M1** (PII) → **M2**/**M3**/**M4**.
Es recomendable generar el `package-lock.json` del backend y arreglar el build de Docker antes de cualquier despliegue nuevo.
