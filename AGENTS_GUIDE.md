# AGENTS GUIDE - InmobiliarIA Platform

## 📋 Project Overview
Real estate marketplace SaaS platform built with:
- **Backend**: NestJS + Prisma + PostgreSQL (Hexagonal Architecture)
- **Frontend**: React + TypeScript + Vite + TailwindCSS + Zustand
- **AI**: CrewAI Python service (you are part of this system)
- **Auth**: JWT + Refresh Tokens
- **Runtime**: Node.js v24, Python 3.10, Docker

## 🏗️ Project Structure
```
/ai-agents/
├── main.py                 # CrewAI entry point (YOU ARE HERE)
├── AGENTS_GUIDE.md         # This file - your context & rules
├── requirements.txt        # Python dependencies
├── Dockerfile              # Python service Docker image
├── docker-compose.yml      # Full stack orchestration
├── backend/
│   ├── src/
│   │   ├── domain/         # Entities, interfaces (ports)
│   │   ├── application/    # Business logic services
│   │   ├── infrastructure/ # DB, Auth, AI, Upload implementations
│   │   └── interfaces/     # Controllers, DTOs, Modules
│   ├── prisma/schema.prisma
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/          # Route pages
│   │   ├── components/     # Shared components
│   │   ├── store/          # Zustand state
│   │   ├── lib/            # API client
│   │   └── types/          # TypeScript types
│   └── package.json
└── audit/                  # Agent audit reports output
```

## 🚫 ANTI-HALLUCINATION RULES (MANDATORY)
1. **NEVER assume files exist** - Only analyze code you can actually read from the project
2. **NEVER invent APIs or endpoints** - Only reference real code in the project
3. **NEVER suggest installing packages** without checking package.json first
4. **ALWAYS read actual project files** before making claims about code
5. **NEVER suggest rewriting entire files** - Make specific, minimal changes
6. **ALWAYS validate architecture rules** - Hexagonal, ports/adapters, separation of concerns
7. **NEVER suggest dependencies** that aren't already in package.json/requirements.txt
8. **ALWAYS cite exact file paths** when referencing code issues

## ✅ CODING STANDARDS

### Backend (NestJS + TypeScript)
- Hexagonal Architecture mandatory: `domain/` → `application/` → `infrastructure/` → `interfaces/`
- All dependencies injected via `@Inject()` decorator using custom tokens (e.g. `PROPERTY_REPOSITORY`)
- Use `class-validator` DTOs in `interfaces/` layer
- Use `@nestjs/jwt` + `passport-jwt` for auth
- Use `PrismaService` for all database access
- Environment variables from `.env` file
- All controllers return plain objects or DTOs

### Frontend (React + TypeScript)
- Use Zustand with `persist` middleware for auth state
- API calls through `src/lib/api.ts` (Axios with interceptors)
- React Router v6 for routing
- TailwindCSS for styling (utility classes, no CSS modules)
- Lucide React for icons
- All API models in `src/types/index.ts`

## 🛠️ AVAILABLE TOOLS

### `read_project_file(file_path: str)`
You have access to this tool. Use it to read ANY file in the project.
- **file_path**: relative path from project root. Examples:
  - `"backend/src/main.ts"`
  - `"frontend/src/pages/PropertiesPage.tsx"`
  - `"backend/prisma/schema.prisma"`
  - `"docker-compose.yml"`
- **Returns**: the file content with line count
- **When to use**: whenever you need to inspect a file that isn't already included in your task description, or to verify cross-file consistency

**ALWAYS use this tool** before making claims about code you haven't seen in your task description.

## 🤖 AGENT ROLES

### 1. Senior Backend Developer (NestJS)
- Review: architecture compliance, security, Prisma schema, auth, API design
- Score categories: Architecture, Security, Code Quality, Prisma/Database
- Focus: hexagonal pattern, NestJS conventions, error handling, TypeScript strictness

### 2. Senior Frontend Developer (React)
- Review: component structure, UX/UI, state management, API integration
- Score categories: Architecture, UX/UI, Code Quality, Performance
- Focus: React patterns, TailwindCSS usage, error/loading states, responsive design

### 3. Senior QA Engineer (Full Stack)
- Review: end-to-end flows, integration, production readiness
- Score categories: Integration, Security (Holistic), Production Readiness
- Focus: API contract alignment, missing features, deployment readiness, edge cases

### 4. Real Estate Strategy Director (CEO)
- Use ONLY for property enhancement flow
- Purpose: market positioning, target audience, key selling points

### 5. Real Estate Copywriter
- Use ONLY for property enhancement flow
- Purpose: optimize titles, write compelling descriptions

### 6. Real Estate Content QA
- Use ONLY for property enhancement flow
- Purpose: validate content accuracy, quality score

## 📝 REPORT FORMAT REQUIREMENTS
Each audit agent MUST output structured reports with:
- Score out of 10 for each category
- Specific file references with line numbers
- Severity tags: [HIGH] / [MEDIUM] / [LOW]
- Actionable recommendations (not generic advice)
- Overall verdict with final score

## 🚀 EXECUTION MODES
- `python main.py --audit` → Developer agents review the codebase
- `python main.py --serve` → HTTP API for property enhancement
- `python main.py` (stdin) → Called by NestJS backend via subprocess
