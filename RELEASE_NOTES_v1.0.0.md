# Release Notes — Morada v1.0.0

**Fecha:** 20 de junio de 2026
**Producto:** Morada — Marketplace Inmobiliario
**Operador:** ViewSoft SAS
**Dominio:** morada.viewsoft.com.co

---

## Resumen

Primera versión estable de Morada, un marketplace y plataforma tecnológica
inmobiliaria que permite a usuarios, agentes inmobiliarios, constructoras e
inmobiliarias publicar, administrar y promocionar propiedades.

---

## Novedades

### 🆕 Registro y Autenticación
- Registro con email/contraseña
- Inicio de sesión con Google OAuth
- Sistema JWT con refresh tokens y rotación automática
- Cumplimiento legal: checkboxes de consentimiento en registro
  - Términos y Condiciones (obligatorio)
  - Política de Tratamiento de Datos (obligatorio)
  - Comunicaciones comerciales (opcional)

### 🏠 Publicación de Inmuebles
- Creación y edición de propiedades
- Subida de imágenes con selección de imagen principal
- Descripciones mejoradas con IA (DeepSeek)
- Estados: disponible, reservada, vendida, arrendada, oculta
- Tipos: casa, departamento, terreno, comercial
- Límites por plan: Free (3 props, 5 img), Agent (50 props, 20 img), Agency (ilimitado, 50 img)

### 🔍 Búsqueda y Descubrimiento
- Búsqueda global con búsquedas recientes (⌘K)
- Filtros por tipo de propiedad, operación, precio, habitaciones, baños
- Feed personalizado con recomendaciones IA
- Vista "Personas también vieron"
- Mapa interactivo con Leaflet

### 💬 Consultas (Leads)
- Formulario de contacto en cada propiedad
- Panel Kanban para gestión de leads
- Historial de cambios de estado
- Estadísticas de conversión
- Notificaciones in-app

### ⭐ Reseñas
- Calificación de 1 a 5 estrellas
- Respuesta del propietario
- Estadísticas de reseñas

### 👥 Red Social
- Perfiles públicos de agentes
- Seguir/dejar de seguir
- Feed de actividad

### 📊 Dashboard
- Métricas de consultas
- Propiedades publicadas
- Acciones rápidas

### ⚖️ Cumplimiento Legal
- Términos y Condiciones
- Política de Privacidad
- Política de Tratamiento de Datos Personales
- Política de Cookies
- Política de Uso Aceptable
- Política de Propiedad Intelectual
- Política de Publicación de Inmuebles
- Banner de consentimiento de cookies
- Footer con enlaces legales
- Tablas de auditoría: UserConsent, LegalAuditLog, DataSubjectRequest, ContentReport

### 🔒 Seguridad
- Cifrado bcrypt para contraseñas
- Headers de seguridad (helmet)
- Rate limiting
- Validación de entradas (ValidationPipe)
- Autenticación JWT con refresh tokens

### 🌐 SEO y Sharing
- Open Graph tags dinámicos
- Meta tags por propiedad
- Compartir en redes sociales

### 🌎 Internacionalización
- Español implementado
- Arquitectura i18next preparada para más idiomas

---

## Mejoras Técnicas

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS
- **Backend:** NestJS + TypeScript + Prisma ORM
- **Base de datos:** PostgreSQL
- **Arquitectura:** Domain-Driven Design (DDD)
- **API Documentada:** Swagger/OpenGraph en `/docs`
- **Infraestructura:** Listo para Railway/Vercel

---

## Problemas Conocidos

Ninguno reportado para esta versión inicial.

---

## Notas de Instalación/Actualización

Para desplegar esta versión:

```bash
# Backend
cd backend
npm install
npx prisma migrate deploy
npm run build
npm run start:prod

# Frontend
cd frontend
npm install
npm run build
```

Variables de entorno requeridas (ver `.env.example`):
- `DATABASE_URL` — Conexión PostgreSQL
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — Claves JWT
- `DEEPSEEK_API_KEY` — API key para IA
- `FRONTEND_URL` — URL del frontend para CORS
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth (opcional)

---

## Contacto

- **Email legal:** legal@viewsoft.com.co
- **Soporte:** morada.viewsoft.com.co
- **Operador:** ViewSoft SAS

---

© 2026 ViewSoft SAS. Todos los derechos reservados.
