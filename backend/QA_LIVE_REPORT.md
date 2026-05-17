# QA Live Validation Report

**Date:** 2026-05-17 11:06 COT  
**Tester:** QA Subagent (Diogenes 🦞)  
**Environment:** Docker Compose (local macOS arm64)

---

## 1. Servicios Docker

| Servicio | Estado | Puerto | Imagen |
|----------|--------|--------|--------|
| **postgres** | ✅ Healthy (up) | 5432 | postgres:16-alpine |
| **backend** | ✅ Up (NestJS) | 3000 | proyecto-inmobiliario-backend:latest |
| **frontend** | ✅ Up (nginx) | 5173 → 80 | proyecto-inmobiliario-frontend:latest |

## 2. Resumen de Endpoints

### Autenticación
| Endpoint | Resultado |
|----------|-----------|
| `POST /api/auth/register` | ✅ 201 — Usuario creado con token |
| `POST /api/auth/login` | ✅ 200 — Login exitoso, token devuelto |

### Propiedades
| Endpoint | Resultado |
|----------|-----------|
| `POST /api/properties` | ✅ 201 — Casa en Vitacura creada |
| `GET /api/properties` | ✅ 200 — Listado con 2 propiedades |
| `GET /api/properties?search=Vita` | ✅ 200 — Búsqueda funcional |
| `GET /api/properties/:id` | ✅ 200 — Detalle con `aiStatus: "pending"` |

### Vistas
| Endpoint | Resultado |
|----------|-----------|
| `POST /api/properties/:id/view` | ✅ 201 — Vista registrada correctamente |

### Inquiries (Leads)
| Endpoint | Resultado |
|----------|-----------|
| `POST /api/properties/:id/inquiry` | ✅ 201 — Inquiry creado como "new" |
| `GET /api/inquiries/mine` | ✅ 200 — 1 lead retornado |
| `GET /api/inquiries/stats` | ✅ 200 — Stats: total: 1, byStatus: [{new: 1}] |

### Favoritos
| Endpoint | Resultado |
|----------|-----------|
| `POST /api/favorites/toggle` | ✅ 200 — `{favorited: true}` |

### Frontend
| Ruta | Resultado |
|------|-----------|
| `/` (index) | ✅ 200 |
| `/login` | ✅ 200 (SPA) |
| `/register` | ✅ 200 (SPA) |
| `/properties` | ✅ 200 (SPA) |
| `/properties/:id` | ✅ 200 (SPA) |
| `/dashboard` | ✅ 200 (SPA) |
| `/favorites` | ✅ 200 (SPA) |
| `/inquiries` | ✅ 200 (SPA) |

### Proxy / Utilidades
| Recurso | Resultado |
|---------|-----------|
| `/api/` (nginx proxy → backend) | ✅ Proxy funcional |
| `/docs` (Swagger) | ✅ 200 |
| Archivos estáticos (CSS/JS) | ✅ Cacheo con `immutable`, expires 1y |

## 3. Issues Encontrados y Resueltos

| # | Issue | Solución |
|---|-------|----------|
| 1 | ❌ **Build falló por lockfile desactualizado** — `npm ci` reportaba Missing devDependencies (jest, @nestjs/testing, etc.) | ✅ `npm install --package-lock-only` en backend/ regeneró el lockfile. `git diff` confirma cambios en `backend/package-lock.json` |
| 2 | ❌ **Frontend imagen stale (7 días)** — corría `vite dev` en vez de nginx, puerto interno incorrecto | ✅ Rebuild completo con `docker compose build --no-cache frontend` |
| 3 | ❌ **Build del backend interrumpido (SIGKILL)** durante primer `docker compose up --build` | ✅ Separar build con `docker compose build` y luego `up -d` funcionó sin problemas |

## 4. Resultado Final

**✅ TODOS LOS SISTEMAS OPERATIVOS** — 100% de endpoints críticos funcionando.

### Flujo completo validado:
1. Registro de usuario → 🔑 token JWT
2. Login → 🔑 nuevo token JWT
3. Crear propiedad → 🏠 Casa en Vitacura
4. Registrar vista → 👁️ view registrada
5. Crear inquiry → 📩 lead como "new"
6. Ver leads del dueño → ✅ 1 lead
7. Stats de leads → ✅ total: 1
8. Toggle favorito → ⭐ favorited: true
9. Listar propiedades + búsqueda → ✅

### Notas:
- Queda pendiente: integración con IA para `aiTitle`/`aiDescription` (status: `pending`)
- Backend con 24 vulnerabilidades npm (bajas/medias/altas) — revisar para producción real
- Se actualizó `backend/package-lock.json` — commit pendiente
