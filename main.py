import os
import re
import sys
import json
import time
from pathlib import Path
from typing import Optional
from crewai import Agent, Task, Crew
from langchain.chat_models import ChatOpenAI
from pydantic import BaseModel

BASE_DIR = Path(__file__).parent


# ──────────────────────────────────────────────
#  TOOL: función simple para leer archivos
#  (crewai 0.28.0 acepta funciones como tools)
# ──────────────────────────────────────────────

def read_project_file(file_path: str) -> str:
    """Lee cualquier archivo del proyecto y devuelve su contenido.
    Úsalo para inspeccionar código fuente que necesites revisar.
    
    Args:
        file_path: Ruta relativa desde la raíz del proyecto.
                   Ejemplo: 'backend/src/main.ts', 'frontend/src/pages/PropertiesPage.tsx'
    Returns:
        Contenido del archivo o mensaje de error
    """
    full_path = BASE_DIR / file_path
    if not full_path.exists():
        return f"ERROR: File not found: {file_path}"
    try:
        content = full_path.read_text(encoding="utf-8")
        lines = content.count("\n") + 1
        if len(content) > 5000:
            return f"# {file_path} ({lines} lines, first 5000 chars)\n{content[:5000]}\n... (truncated)"
        return f"# {file_path} ({lines} lines)\n{content}"
    except Exception as e:
        return f"ERROR reading {file_path}: {e}"


def write_project_file(file_path: str, content: str) -> str:
    """Escribe o sobrescribe cualquier archivo del proyecto con el contenido indicado.
    Úsalo para corregir bugs, mejorar código, o crear nuevos archivos.
    
    Args:
        file_path: Ruta relativa desde la raíz del proyecto.
                   Ejemplo: 'backend/src/main.ts'
        content: Contenido completo a escribir en el archivo
    Returns:
        Mensaje de confirmación o error
    """
    full_path = BASE_DIR / file_path
    try:
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_text(content, encoding="utf-8")
        lines = content.count("\n") + 1
        return f"OK: Archivo '{file_path}' escrito exitosamente ({lines} líneas)"
    except Exception as e:
        return f"ERROR escribiendo {file_path}: {e}"


def git_commit(message: str) -> str:
    return "OK: Commits deshabilitados"


ALL_FIXER_TOOLS = [read_project_file, write_project_file, git_commit]


# ──────────────────────────────────────────────
#  GUIA DE CONTEXTO
# ──────────────────────────────────────────────

def load_agents_guide() -> str:
    guide_path = BASE_DIR / "AGENTS_GUIDE.md"
    if guide_path.exists():
        return guide_path.read_text(encoding="utf-8")
    return "No guide file found."


AGENTS_GUIDE = load_agents_guide()


# ──────────────────────────────────────────────
#  AGENTES DE PROPIEDADES (CEO, Copywriter, QA)
# ──────────────────────────────────────────────

def get_llm():
    """Crea una instancia de ChatOpenAI conectada a DeepSeek."""
    api_key = os.getenv("DEEPSEEK_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("No API key found. Set DEEPSEEK_API_KEY or OPENAI_API_KEY")

    model = os.getenv("AI_MODEL", "deepseek-chat")
    base_url = os.getenv("OPENAI_API_BASE", "https://api.deepseek.com/v1")

    return ChatOpenAI(
        model=model,
        openai_api_key=api_key,
        openai_api_base=base_url,
        temperature=0.3,
    )


def create_property_agents():
    llm = get_llm()
    ceo = Agent(
        role="Real Estate Strategy Director",
        goal="Analyze property data to define optimal positioning, target audience, and selling points",
        backstory="Senior real estate strategist with 20+ years in property marketing and market analysis.",
        llm=llm, verbose=True, allow_delegation=False,
    )
    copywriter = Agent(
        role="Real Estate Copywriter Specialist",
        goal="Create compelling, accurate, SEO-optimized property titles and descriptions",
        backstory="Top-tier copywriter specialized in real estate with thousands of successful listings.",
        llm=llm, verbose=True, allow_delegation=False,
    )
    qa = Agent(
        role="Real Estate Content QA Specialist",
        goal="Review and validate quality, accuracy, and compliance of property content",
        backstory="Meticulous QA specialist ensuring every listing meets high quality standards.",
        llm=llm, verbose=True, allow_delegation=False,
    )
    return {"ceo": ceo, "copywriter": copywriter, "qa": qa}


def create_property_tasks(agents, data):
    info = (
        f"Title: {data.get('title', 'N/A')}\n"
        f"Description: {data.get('description', 'N/A')}\n"
        f"Price: {data.get('price', 'N/A')} {data.get('currency', 'CLP')}\n"
        f"Type: {data.get('propertyType', 'N/A')} - {data.get('listingType', 'N/A')}\n"
        f"Bedrooms: {data.get('bedrooms', 'N/A')} | Bathrooms: {data.get('bathrooms', 'N/A')}\n"
        f"Surface: {data.get('surface', 'N/A')} m²\n"
        f"Location: {data.get('location', 'N/A')}"
    )
    return {
        "ceo": Task(
            description=f"Analyze this property and create a strategic plan:\n\n{info}\n\n"
                        "Include: 1) Target audience 2) Key selling points 3) Market positioning "
                        "4) Optimized title (max 60 chars) 5) Emotional triggers.",
            agent=agents["ceo"], expected_output="Strategic analysis with title suggestion",
        ),
        "copywriter": Task(
            description=f"Create an exceptional property listing:\n\n{info}\n\n"
                        "1) Optimized title (max 60 chars) 2) Compelling description (200-300 words)\n"
                        "Format: 'OPTIMIZED TITLE:' then title, 'IMPROVED DESCRIPTION:' then description.",
            agent=agents["copywriter"], expected_output="Optimized title and improved description",
        ),
        "qa": Task(
            description=f"Review the property listing:\n\n{info}\n\n"
                        "1) Verify factual consistency 2) Quality score (1-10) 3) 3-5 suggestions.\n"
                        "Format: 'QUALITY SCORE:', 'SUGGESTIONS:', 'VERDICT:'.",
            agent=agents["qa"], expected_output="Quality review with score and suggestions",
        ),
    }


def extract_title(output, fallback):
    for p in [r"(?i)optimal title[:\s]+(.+)", r"(?i)optimized title[:\s]+(.+)",
              r"(?i)suggested title[:\s]+(.+)", r"(?i)title[:\s]+(.+)"]:
        m = re.search(p, output)
        if m:
            return m.group(1).strip().strip('"').strip("'")
    return fallback


def extract_description(output, fallback):
    for p in [r"(?i)improved description[:\s]+(.+)", r"(?i)optimal description[:\s]+(.+)",
              r"(?i)enhanced description[:\s]+(.+)", r"(?i)description[:\s]+(.+)"]:
        m = re.search(p, output, re.DOTALL)
        if m:
            t = m.group(1).strip().strip('"').strip("'")
            if len(t) > 50:
                return t[:2000]
    return fallback


def extract_score(output):
    m = re.search(r"(?i)(?:quality\s+)?score[:\s]+(\d+(?:\.\d+)?)", output)
    if m:
        try:
            return min(max(float(m.group(1)), 0), 10)
        except ValueError:
            pass
    return 7.0


def extract_suggestions(output):
    s = re.findall(r"(?i)(?:\d+\.\s*|[-*]\s+)(.+?)(?=(?:\d+\.|[-*]|$))", output)
    v = [x.strip() for x in s if len(x.strip()) > 10]
    return v[:5] if v else []


# ──────────────────────────────────────────────
#  AGENTES DESARROLLADORES (Backend, Frontend, QA)
# ──────────────────────────────────────────────

def create_dev_agents():
    llm = get_llm()
    dev_backend = Agent(
        role="Senior Backend Developer (NestJS)",
        goal="Review NestJS backend code for quality, security, best practices, and architecture compliance",
        backstory="Senior backend architect specialized in NestJS, TypeScript, Prisma, PostgreSQL, and hexagonal architecture. Detects code smells and security issues instantly.",
        llm=llm, verbose=True, allow_delegation=False,
    )
    dev_frontend = Agent(
        role="Senior Frontend Developer (React)",
        goal="Review React + TypeScript frontend code for quality, performance, UX, and best practices",
        backstory="Senior frontend architect specialized in React, TypeScript, Vite, TailwindCSS, and Zustand. Expert in UI/UX and performance optimization.",
        llm=llm, verbose=True, allow_delegation=False,
    )
    qa_dev = Agent(
        role="Senior QA Engineer (Full Stack)",
        goal="Perform comprehensive code review across the entire project, find bugs, and validate quality",
        backstory="Senior QA engineer with expertise in full-stack web applications. Reviews backend and frontend holistically. Expert in finding edge cases and integration issues.",
        llm=llm, verbose=True, allow_delegation=False,
    )
    return {"dev_backend": dev_backend, "dev_frontend": dev_frontend, "qa_dev": qa_dev}


# ──────────────────────────────────────────────
#  AGENTES FIXER (arreglan el código, no solo audit)
# ──────────────────────────────────────────────

def create_fixer_agents():
    llm = get_llm()
    fix_backend = Agent(
        role="Senior Backend Developer (NestJS) - FIXER",
        goal="Find and fix bugs in the NestJS backend. Write improved code, commit changes, and increase quality scores.",
        backstory="You are a senior backend architect who not only finds problems but FIXES them. You write production-quality NestJS code with proper hexagonal architecture, security, and error handling.",
        llm=llm, verbose=True, allow_delegation=False,
    )
    fix_frontend = Agent(
        role="Senior Frontend Developer (React) - FIXER",
        goal="Find and fix bugs in the React frontend. Write improved code, commit changes, and increase quality scores.",
        backstory="You are a senior frontend architect who not only finds problems but FIXES them. You write production-quality React code with proper TypeScript, TailwindCSS, Zustand patterns, and error handling.",
        llm=llm, verbose=True, allow_delegation=False,
    )
    fix_qa = Agent(
        role="Senior QA Engineer (Full Stack) - FIXER",
        goal="Verify and fix integration issues across the full stack. Ensure backend and frontend work together.",
        backstory="You are a senior QA engineer who not only finds issues but FIXES them. You ensure API contracts match, auth flows work end-to-end, and the system is production-ready.",
        llm=llm, verbose=True, allow_delegation=False,
    )
    return {"fix_backend": fix_backend, "fix_frontend": fix_frontend, "fix_qa": fix_qa}


def create_fix_tasks(agents, project_files):
    total = len(project_files)
    tree = "\n".join(f"├── {k}  ({len(v.splitlines())} lines)" for k, v in sorted(project_files.items()))

    return {
        "fix_backend": Task(
            description=f"""You are the BACKEND FIXER. Your ONLY job is to output file fixes using EXACTLY this format.

## CRITICAL SCOPE RULE:
You ONLY modify files that start with "backend/". NEVER touch frontend files.
Your allowed files: backend/src/**, backend/prisma/**, backend/package.json

## Project files:
```
{tree[:1500]}
```

## CORRECT FORMAT (mandatory):
[WRITE: backend/src/main.ts]
import {{ NestFactory }} from '@nestjs/core';
import {{ AppModule }} from './app.module';
// ... rest of the COMPLETE file content
[ENDWRITE]

[WRITE: backend/src/domain/auth/auth.types.ts]
export interface JwtPayload {{
  sub: string;
  email: string;
  role: string;
}}
[ENDWRITE]

[COMMIT: fix(backend): add CORS config and security headers]

## RULES (read carefully):
- EVERY [WRITE:path] MUST be followed by the COMPLETE new file content
- EVERY [WRITE:path] MUST end with [ENDWRITE]
- You CAN output MULTIPLE [WRITE] blocks in one response
- Write REAL, valid TypeScript code, not placeholders
- Fix at least 2 known issues with actual improved code

## PRIORITY:
1. Security fixes (JWT, CORS, validation)
2. Architecture fixes
3. Bug fixes
4. Quality improvements""",
            agent=agents["fix_backend"],
            expected_output="[WRITE: path] content [ENDWRITE] blocks with real fixed code",
        ),
        "fix_frontend": Task(
            description=f"""You are the FRONTEND FIXER. Your ONLY job is to output file fixes using EXACTLY this format.

## CRITICAL SCOPE RULE:
You ONLY modify files that start with "frontend/". NEVER touch backend files.
Your allowed files: frontend/src/**, frontend/package.json, frontend/tsconfig.json, frontend/vite.config.ts, frontend/tailwind.config.js, frontend/index.html

## CORRECT FORMAT (mandatory):
[WRITE: frontend/src/pages/DashboardPage.tsx]
import {{ useEffect, useState }} from 'react';
// ... rest of the COMPLETE file content
[ENDWRITE]

[WRITE: frontend/src/lib/api.ts]
import axios from 'axios';
// ... rest of COMPLETE file content
[ENDWRITE]

## RULES (read carefully):
- EVERY [WRITE:path] MUST be followed by the COMPLETE new file content
- EVERY [WRITE:path] MUST end with [ENDWRITE]
- Write REAL, valid TypeScript/React code, not placeholders
- Fix bugs, add missing error handling, improve UX
- Fix at least 2 actual issues with real code""",
            agent=agents["fix_frontend"],
            expected_output="[WRITE: path] content [ENDWRITE] blocks with real fixed code",
        ),
        "fix_qa": Task(
            description=f"""You are the QA FIXER. Your ONLY job is to verify backend/frontend alignment and fix integration issues.

## CRITICAL SCOPE RULE:
You can modify BOTH backend/ and frontend/ files, but ONLY to fix API mismatches.
Do NOT refactor or rewrite files unless there is a clear integration bug.

## FORMAT:
[WRITE: path/to/file.ts]
COMPLETE fixed file content here
[ENDWRITE]

## CHECKLIST:
1. Do frontend API paths match backend controller routes?
2. Is the auth token refresh flow consistent?
3. Are error responses handled correctly on frontend?
4. Fix at least 2 actual mismatches with real code""",
            agent=agents["fix_qa"],
            expected_output="[WRITE: path] content [ENDWRITE] blocks with integration fixes",
        ),
    }


def run_fix_cycle():
    """Una ronda completa donde los agentes arreglan código en vez de solo reportar."""
    print("\n" + "=" * 60)
    print("  🔧 RONDA DE MEJORA - AGENTES FIXER")
    print("=" * 60)

    project_files = read_project_files()
    print(f"  {len(project_files)} archivos cargados")

    agents = create_fixer_agents()
    tasks = create_fix_tasks(agents, project_files)

    crew = Crew(
        agents=[agents["fix_backend"], agents["fix_frontend"], agents["fix_qa"]],
        tasks=[tasks["fix_backend"], tasks["fix_frontend"], tasks["fix_qa"]],
        verbose=True,
    )

    print("Agentes fixer trabajando:")
    print("  1. Backend FIXER - Encontrando y arreglando bugs del backend")
    print("  2. Frontend FIXER - Encontrando y arreglando bugs del frontend")
    print("  3. QA FIXER - Verificando integración y arreglando mismatches")
    print()

    start = time.time()
    result = crew.kickoff()
    elapsed = time.time() - start
    raw = str(result)

    # ─── Procesar comandos del output de los agentes con validación de alcance ───
    print("\n📝 Procesando comandos de los agentes...")

    # Alcances permitidos por cada agente
    agent_scopes = {
        "fix_backend": lambda p: p.startswith("backend/"),
        "fix_frontend": lambda p: p.startswith("frontend/"),
        "fix_qa": lambda p: True,  # QA puede tocar ambos
    }

    wrote_files = []
    write_pattern = re.compile(r'\[WRITE:\s*([^\]]+)\](.*?)\[ENDWRITE\]', re.DOTALL)

    for key, task in tasks.items():
        task_output = str(task.output) if hasattr(task, "output") else ""
        is_allowed = agent_scopes.get(key, lambda p: True)

        for match in write_pattern.finditer(task_output):
            file_path = match.group(1).strip()
            content = match.group(2).strip()

            if not is_allowed(file_path):
                print(f"  ⛔ BLOQUEADO: {key} intentó escribir en '{file_path}' (no está en su alcance)")
                continue

            result_msg = write_project_file(file_path, content)
            wrote_files.append(file_path)
            print(f"  📄 {result_msg}")


    # Guardar reportes
    out = BASE_DIR / "audit"
    out.mkdir(exist_ok=True)

    for key, task in tasks.items():
        name = {"fix_backend": "fix-backend", "fix_frontend": "fix-frontend", "fix_qa": "fix-qa"}.get(key, key)
        (out / f"{name}.md").write_text(str(task.output) if hasattr(task, "output") else "No output", encoding="utf-8")

    (out / "fix-report.md").write_text(raw, encoding="utf-8")

    # Estadísticas
    summary = {
        "status": "ok",
        "files_fixed": len(wrote_files),
        "elapsed": f"{elapsed:.1f}s",
    }
    print(f"\n✅ Ronda de mejora completada en {elapsed:.1f}s")
    if wrote_files:
        print(f"📄 Archivos modificados ({len(wrote_files)}):")
        for f in wrote_files:
            print(f"  - {f}")
    print(f"📁 Reportes guardados en: {out}")
    print(json.dumps(summary))


def read_project_files():
    files = {}
    for ext in ["*.ts", "*.tsx"]:
        for subdir in ["backend/src", "frontend/src"]:
            d = BASE_DIR / subdir
            if d.exists():
                for p in sorted(d.rglob(ext)):
                    try:
                        files[str(p.relative_to(BASE_DIR))] = p.read_text(encoding="utf-8")
                    except Exception:
                        pass
    for extra in ["backend/prisma/schema.prisma", "backend/package.json", "frontend/package.json"]:
        p = BASE_DIR / extra
        if p.exists():
            files[extra] = p.read_text(encoding="utf-8")
    return files


def create_audit_tasks(agents, project_files):
    total = len(project_files)
    total_lines = sum(len(v.splitlines()) for v in project_files.values())
    tree = "\n".join(f"├── {k}  ({len(v.splitlines())} lines)" for k, v in sorted(project_files.items()))
    guide = f"\n\nCONTEXT: {AGENTS_GUIDE}"

    schema = project_files.get("backend/prisma/schema.prisma", "")

    bk = [f"### PRISMA SCHEMA\n```prisma\n{schema[:3000]}\n```"]
    bk_list = [
        "main.ts", "app.module.ts",
        "domain/properties/property.entity.ts",
        "domain/properties/property.repository.ts",
        "application/properties/properties.service.ts",
        "infrastructure/database/prisma-property.repository.ts",
        "infrastructure/database/prisma.service.ts",
        "domain/auth/auth.types.ts", "application/auth/auth.service.ts",
        "infrastructure/auth/jwt.strategy.ts", "infrastructure/auth/jwt-auth.guard.ts",
        "interfaces/auth/auth.controller.ts",
        "interfaces/properties/properties.controller.ts",
        "interfaces/properties/properties.dto.ts",
        "infrastructure/ai/ai-client.service.ts",
        "infrastructure/upload/multer.config.ts",
    ]
    for f in bk_list:
        key = f"backend/src/{f}"
        if key in project_files:
            bk.append(f"### {f}\n```typescript\n{project_files[key][:3000]}\n```")
    bk_full = "\n\n".join(bk)

    fx_list = [
        "main.tsx", "App.tsx",
        "lib/api.ts", "store/auth.ts", "types/index.ts",
        "pages/DashboardPage.tsx", "pages/PropertiesPage.tsx",
        "pages/CreatePropertyPage.tsx", "pages/PropertyDetailPage.tsx",
        "pages/LoginPage.tsx", "pages/RegisterPage.tsx",
        "components/Layout.tsx", "components/Navbar.tsx",
    ]
    fx = []
    for f in fx_list:
        key = f"frontend/src/{f}"
        if key in project_files:
            fx.append(f"### {f}\n```typescript\n{project_files[key][:3000]}\n```")
    fx_full = "\n\n".join(fx)

    return {
        "dev_backend": Task(
            description=f"""You are the Senior Backend Developer auditing the NestJS backend.

## Files ({total} total, ~{total_lines} lines)
```
{tree[:1500]}
```

## Key Backend Code:
{bk_full[:15000]}

## Checklist:
1. Architecture (score /10): Hexagonal compliance?
2. Security (score /10): JWT, validation, upload?
3. Code Quality (score /10): TypeScript, error handling, NestJS conventions?
4. Prisma (score /10): Schema, relations, indexes?
5. Critical Bugs: [HIGH]/[MEDIUM]/[LOW] severity
6. Top 5 Recommendations: specific file paths with line numbers
{guide}""",
            agent=agents["dev_backend"],
            expected_output="Backend audit with scores, bugs, and recommendations",
        ),
        "dev_frontend": Task(
            description=f"""You are the Senior Frontend Developer auditing the React frontend.

## Files ({total} total, ~{total_lines} lines)
```
{tree[:1500]}
```

## Key Frontend Code:
{fx_full[:15000]}

## Checklist:
1. Architecture (score /10): Components, routers, state (Zustand)?
2. UX/UI (score /10): Accessibility, responsive TailwindCSS, loading/error states?
3. Code Quality (score /10): TypeScript, hooks, reusability?
4. Performance (score /10): Re-renders, bundle size, lazy loading?
5. API Integration (score /10): Axios interceptors, error handling, token refresh?
6. Critical Bugs: [HIGH]/[MEDIUM]/[LOW] severity
7. Top 5 Recommendations: specific file paths with line numbers
{guide}""",
            agent=agents["dev_frontend"],
            expected_output="Frontend audit with scores, bugs, and recommendations",
        ),
        "qa_dev": Task(
            description=f"""You are the Senior QA Engineer doing the final full-stack review.

## All Files ({total} total, ~{total_lines} lines)
```
{tree[:3000]}
```

## Checklist:
1. Integration (score /10): Backend API ↔ frontend calls match?
2. Security Holistic (score /10): CORS, token storage, env vars exposure?
3. Production Readiness (score /10): Docker, build scripts, logging, monitoring, rate limiting?
4. E2E Flow: register → login → create property → AI enrichment → view property
5. Critical Blockers for Production
6. Top Recommendations
{guide}""",
            agent=agents["qa_dev"],
            expected_output="Final QA report with integration, security, and production readiness scores",
        ),
    }


def run_audit():
    api_key = os.getenv("DEEPSEEK_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        print(json.dumps({"error": "No API key found. Set DEEPSEEK_API_KEY or OPENAI_API_KEY"}))
        sys.exit(1)

    print("\n" + "=" * 60)
    print("  INMOBILIARIA - CODE AUDIT BY CREW AI")
    print("=" * 60)

    print("\nLoading project files...")
    project_files = read_project_files()
    print(f"  {len(project_files)} files loaded\n")

    agents = create_dev_agents()
    tasks = create_audit_tasks(agents, project_files)

    crew = Crew(
        agents=[agents["dev_backend"], agents["dev_frontend"], agents["qa_dev"]],
        tasks=[tasks["dev_backend"], tasks["dev_frontend"], tasks["qa_dev"]],
        verbose=True,
    )

    print("Starting agents...")
    print("  1. Senior Backend Developer (NestJS)")
    print("  2. Senior Frontend Developer (React)")
    print("  3. Senior QA Engineer (Full Stack)")
    print()

    start = time.time()
    result = crew.kickoff()
    elapsed = time.time() - start
    raw = str(result)

    out = BASE_DIR / "audit"
    out.mkdir(exist_ok=True)

    for key, task in tasks.items():
        name = {"dev_backend": "backend-developer", "dev_frontend": "frontend-developer", "qa_dev": "qa-engineer"}.get(key, key)
        (out / f"{name}.md").write_text(str(task.output) if hasattr(task, "output") else "No output", encoding="utf-8")

    (out / "reporte-final.md").write_text(raw, encoding="utf-8")

    print(f"\n✅ Audit complete in {elapsed:.1f}s")
    print(f"📁 Reports saved to: {out}")
    print(json.dumps({"status": "ok", "files": len(project_files), "report_dir": str(out)}))


# ──────────────────────────────────────────────
#  FLUJO DE PROPIEDADES
# ──────────────────────────────────────────────

def run_property_crew(data):
    agents = create_property_agents()
    tasks = create_property_tasks(agents, data)
    crew = Crew(
        agents=[agents["ceo"], agents["copywriter"], agents["qa"]],
        tasks=[tasks["ceo"], tasks["copywriter"], tasks["qa"]],
        verbose=True,
    )
    result = crew.kickoff()
    raw = str(result)
    return {
        "optimizedTitle": extract_title(raw, data.get("title", "")),
        "improvedDescription": extract_description(raw, data.get("description", "")),
        "qualityScore": extract_score(raw),
        "suggestions": extract_suggestions(raw),
    }


# ──────────────────────────────────────────────
#  CLI
# ──────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--audit":
        run_audit()
    elif len(sys.argv) > 1 and sys.argv[1] == "--serve":
        from fastapi import FastAPI, HTTPException
        import uvicorn

        app = FastAPI(title="Real Estate AI", version="1.0.0")

        class PropertyInput(BaseModel):
            title: str
            description: str
            price: float
            currency: str = "CLP"
            propertyType: str
            listingType: str
            bedrooms: Optional[int] = None
            bathrooms: Optional[int] = None
            surface: Optional[float] = None
            location: str

        class PropertyOutput(BaseModel):
            optimizedTitle: str
            improvedDescription: str
            qualityScore: float
            suggestions: list[str]

        @app.get("/health")
        async def health():
            return {"status": "healthy"}

        @app.post("/enhance", response_model=PropertyOutput)
        async def enhance(input: PropertyInput):
            try:
                return run_property_crew(input.model_dump())
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        port = int(os.getenv("AI_SERVICE_PORT", "8000"))
        uvicorn.run(app, host="0.0.0.0", port=port)

    elif len(sys.argv) > 1 and sys.argv[1] == "--develop":
        import threading
        import uvicorn

        # Estado compartido entre hilos
        app_state = {
            "status": "starting",
            "current_round": 0,
            "last_audit": "never",
            "next_audit_in": "starting...",
            "agent_working": "none",
            "mode": "develop",
        }

        print("\n" + "=" * 60)
        print("  🏗️  INMOBILIARIA - MODO DESARROLLO CONTINUO")
        print("  Todos los agentes trabajando 24/7")
        print("=" * 60)

        # Hilo 1: API de propiedades (CEO, Copywriter, QA)
        def run_api():
            from fastapi import FastAPI, HTTPException
            from fastapi.responses import HTMLResponse

            app = FastAPI(title="Real Estate AI", version="1.0.0")

            class PropertyInput(BaseModel):
                title: str
                description: str
                price: float
                currency: str = "CLP"
                propertyType: str
                listingType: str
                bedrooms: Optional[int] = None
                bathrooms: Optional[int] = None
                surface: Optional[float] = None
                location: str

            class PropertyOutput(BaseModel):
                optimizedTitle: str
                improvedDescription: str
                qualityScore: float
                suggestions: list[str]

            @app.get("/health")
            async def health():
                return app_state

            @app.get("/dashboard", response_class=HTMLResponse)
            async def dashboard():
                return """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>InmobiliarIA - Agent Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { font-size: 1.8rem; margin-bottom: 5px; display: flex; align-items: center; gap: 10px; }
        h1 small { font-size: 0.9rem; color: #64748b; font-weight: normal; }
        .subtitle { color: #64748b; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; }
        .card h3 { font-size: 0.8rem; text-transform: uppercase; color: #64748b; margin-bottom: 5px; letter-spacing: 0.5px; }
        .card .value { font-size: 1.5rem; font-weight: bold; }
        .card .value.green { color: #22c55e; }
        .card .value.yellow { color: #eab308; }
        .card .value.red { color: #ef4444; }
        .card .value.blue { color: #3b82f6; }
        .card .value.purple { color: #a855f7; }
        .agents { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
        .agent-card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; position: relative; }
        .agent-card.active { border-color: #22c55e; box-shadow: 0 0 20px rgba(34,197,94,0.15); }
        .agent-card .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .agent-card .name { font-weight: bold; font-size: 1rem; }
        .agent-card .role { font-size: 0.8rem; color: #64748b; }
        .badge { font-size: 0.7rem; padding: 3px 10px; border-radius: 20px; font-weight: 600; }
        .badge.working { background: #22c55e20; color: #22c55e; border: 1px solid #22c55e; }
        .badge.waiting { background: #eab30820; color: #eab308; border: 1px solid #eab308; }
        .badge.idle { background: #64748b20; color: #64748b; border: 1px solid #64748b; }
        .badge.error { background: #ef444420; color: #ef4444; border: 1px solid #ef4444; }
        .log { background: #0f172a; border-radius: 8px; padding: 15px; font-family: 'Courier New', monospace; font-size: 0.8rem; max-height: 200px; overflow-y: auto; margin-top: 20px; }
        .log .line { padding: 2px 0; color: #64748b; }
        .log .line.active { color: #22c55e; }
        .log .line.error { color: #ef4444; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .pulse { animation: pulse 1.5s infinite; }
        .footer { margin-top: 20px; text-align: center; color: #475569; font-size: 0.8rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 InmobiliarIA <small>Agentes Fixer - Arreglando el código 24/7</small></h1>
        <p class="subtitle" id="lastUpdate">Conectando...</p>

        <div class="grid" id="stats">
            <div class="card"><h3>Estado</h3><div class="value yellow" id="status">-</div></div>
            <div class="card"><h3>Ronda Actual</h3><div class="value blue" id="round">-</div></div>
            <div class="card"><h3>Agente Trabajando</h3><div class="value purple" id="agent">-</div></div>
            <div class="card"><h3>Última Auditoría</h3><div class="value" id="lastAudit">-</div></div>
        </div>

        <h2 style="margin-bottom: 10px;">🧠 Agentes</h2>
        <div class="agents" id="agents">
            <div class="agent-card"><div class="header"><div><div class="name">🏢 CEO</div><div class="role">Real Estate Strategy</div></div><span class="badge idle">esperando</span></div><div>Esperando petición de mejora de propiedad</div></div>
            <div class="agent-card"><div class="header"><div><div class="name">✍️ Copywriter</div><div class="role">Real Estate Copy</div></div><span class="badge idle">esperando</span></div><div>Esperando petición de mejora de propiedad</div></div>
            <div class="agent-card"><div class="header"><div><div class="name">✅ QA Contenido</div><div class="role">Content Quality</div></div><span class="badge idle">esperando</span></div><div>Esperando petición de mejora de propiedad</div></div>
            <div class="agent-card" id="card-dev-backend"><div class="header"><div><div class="name">🖥️ Backend FIXER</div><div class="role">NestJS Expert</div></div><span class="badge idle">esperando</span></div><div>Arreglando bugs del backend...</div></div>
            <div class="agent-card" id="card-dev-frontend"><div class="header"><div><div class="name">🎨 Frontend FIXER</div><div class="role">React Expert</div></div><span class="badge idle">esperando</span></div><div>Arreglando bugs del frontend...</div></div>
            <div class="agent-card" id="card-qa-engineer"><div class="header"><div><div class="name">🔍 QA FIXER</div><div class="role">Full Stack QA</div></div><span class="badge idle">esperando</span></div><div>Arreglando integración...</div></div>
        </div>

        <div class="log" id="log"><div class="line">Esperando actividad de los agentes...</div></div>
        <div class="footer">Actualizado cada 3 segundos · <a href="/health" style="color:#22c55e;">/health API</a></div>
    </div>

    <script>
        const agentMap = {
            'fix-backend': { card: 'card-dev-backend', name: '🖥️ Backend FIXER', badge: 'working' },
            'fix-frontend': { card: 'card-dev-frontend', name: '🎨 Frontend FIXER', badge: 'working' },
            'fix-qa': { card: 'card-qa-engineer', name: '🔍 QA FIXER', badge: 'working' },
            'ceo+copywriter+qa': { card: null, name: '🏢 CEO + ✍️ Copywriter + ✅ QA', badge: 'working' },
            'idle': { card: null, name: '💤 En espera', badge: 'idle' },
        };

        const logLines = [];
        const logEl = document.getElementById('log');

        function addLog(text, type='') {
            const time = new Date().toLocaleTimeString();
            logLines.push(`[${time}] ${text}`);
            if (logLines.length > 50) logLines.shift();
            logEl.innerHTML = logLines.map(l => {
                const cls = l.includes('completada') ? 'active' : l.includes('Error') ? 'error' : '';
                return `<div class="line ${cls}">${l}</div>`;
            }).join('');
            logEl.scrollTop = logEl.scrollHeight;
        }

        async function refresh() {
            try {
                const res = await fetch('/health');
                const data = await res.json();

                document.getElementById('status').textContent = data.status || '-';
                document.getElementById('status').className = 'value ' + (
                    data.status === 'auditing' ? 'green pulse' :
                    data.status === 'waiting' ? 'yellow' :
                    data.status === 'error' ? 'red' : 'blue'
                );
                document.getElementById('round').textContent = '#' + (data.current_round || 0);
                document.getElementById('agent').textContent = data.agent_working || '-';
                document.getElementById('lastAudit').textContent = data.last_audit || 'Nunca';
                document.getElementById('lastUpdate').textContent = 'Última actualización: ' + new Date().toLocaleString();

                const agentCards = document.querySelectorAll('.agent-card');
                agentCards.forEach(c => c.classList.remove('active'));

                if (data.agent_working === 'fix-backend') {
                    document.getElementById('card-dev-backend').classList.add('active');
                    document.getElementById('card-dev-backend').querySelector('.badge').className = 'badge working';
                    document.getElementById('card-dev-backend').querySelector('.badge').textContent = '🔥 arreglando backend';
                } else if (data.agent_working === 'fix-frontend') {
                    document.getElementById('card-dev-frontend').classList.add('active');
                    document.getElementById('card-dev-frontend').querySelector('.badge').className = 'badge working';
                    document.getElementById('card-dev-frontend').querySelector('.badge').textContent = '🔥 arreglando frontend';
                } else if (data.agent_working === 'fix-qa') {
                    document.getElementById('card-qa-engineer').classList.add('active');
                    document.getElementById('card-qa-engineer').querySelector('.badge').className = 'badge working';
                    document.getElementById('card-qa-engineer').querySelector('.badge').textContent = '🔥 arreglando integración';
                }

                if (data.status === 'auditing') {
                    addLog(`� Ronda #${data.current_round}: ${data.agent_working}`);
                } else if (data.status === 'waiting') {
                    addLog(`⏳ Próxima ronda en ${data.next_audit_in}`);
                }
            } catch(e) {
                document.getElementById('lastUpdate').textContent = '⚠️ Error conectando: ' + e.message;
            }
        }

        refresh();
        setInterval(refresh, 3000);
    </script>
</body>
</html>"""

            @app.post("/enhance", response_model=PropertyOutput)
            async def enhance(input: PropertyInput):
                app_state["agent_working"] = "ceo+copywriter+qa"
                try:
                    result = run_property_crew(input.model_dump())
                    app_state["agent_working"] = "idle"
                    return result
                except Exception as e:
                    app_state["agent_working"] = "idle"
                    raise HTTPException(status_code=500, detail=str(e))

            @app.post("/audit")
            async def trigger_audit():
                app_state["status"] = "auditing"
                try:
                    run_fix_cycle()
                    app_state["status"] = "idle"
                    return {"status": "ok", "message": "Fix cycle completed"}
                except Exception as e:
                    app_state["status"] = "idle"
                    raise HTTPException(status_code=500, detail=str(e))

            port = int(os.getenv("AI_SERVICE_PORT", "8000"))
            uvicorn.run(app, host="0.0.0.0", port=port)

        # Hilo 2: Heartbeat - muestra actividad cada 30 segundos
        def heartbeat():
            while True:
                if app_state["status"] == "auditing":
                    print(f"  ❤️  [{time.strftime('%H:%M:%S')}] Ronda #{app_state['current_round']} en progreso... ({app_state['agent_working']})")
                elif app_state["status"] == "waiting":
                    print(f"  💤 [{time.strftime('%H:%M:%S')}] Esperando {app_state['next_audit_in']} para ronda #{app_state['current_round'] + 1}")
                else:
                    print(f"  ✅ [{time.strftime('%H:%M:%S')}] {app_state['status']}")
                time.sleep(30)

        # Hilo 3: Rondas de mejora continua (Backend Fixer, Frontend Fixer, QA Fixer)
        def continuous_audit():
            rounds = 0
            while True:
                rounds += 1
                app_state["current_round"] = rounds
                app_state["status"] = "auditing"
                app_state["agent_working"] = "fix-backend"

                print(f"\n{'='*60}")
                print(f"  � RONDA DE MEJORA #{rounds}")
                print(f"{'='*60}")
                print(f"  Agentes trabajando:")
                print(f"    1. Backend FIXER - Arreglando bugs del backend")
                print(f"    2. Frontend FIXER - Arreglando bugs del frontend")
                print(f"    3. QA FIXER - Arreglando integración")
                print()

                try:
                    run_fix_cycle()
                    app_state["last_audit"] = time.strftime("%Y-%m-%d %H:%M:%S")
                    print(f"\n✅ Ronda de mejora #{rounds} completada.")
                except Exception as e:
                    print(f"\n❌ Error en ronda #{rounds}: {e}")
                    app_state["status"] = "error"
                    app_state["agent_working"] = f"error: {str(e)[:50]}"
                    print("   Reintentando en 5 minutos...")
                    for sec in range(300, 0, -1):
                        app_state["next_audit_in"] = f"{sec//60}m {sec%60}s"
                        time.sleep(1)
                    continue

                # Sin pausa entre rondas - los agentes trabajan continuamente
                print(f"\n⏳ Siguiente ronda en 30 segundos...")
                app_state["status"] = "waiting"
                for sec in range(30, 0, -1):
                    app_state["next_audit_in"] = f"{sec}s"
                    time.sleep(1)

        # Iniciar hilos
        api_thread = threading.Thread(target=run_api, daemon=True)
        api_thread.start()
        time.sleep(2)

        heart_thread = threading.Thread(target=heartbeat, daemon=True)
        heart_thread.start()

        print("\n✅ API de propiedades iniciada (CEO + Copywriter + QA)")
        print("   http://localhost:8000/enhance")
        print("   http://localhost:8000/health")
        print("   http://localhost:8000/audit")
        print("\n✅ Heartbeat activo (logs cada 30s)")
        print("✅ Auditoría continua activa (rondas cada 60 min)")
        print()

        continuous_audit()

    else:
        raw_data = sys.stdin.read()
        if not raw_data:
            print(json.dumps({"error": "No input data"}))
            sys.exit(1)
        try:
            data = json.loads(raw_data)
            result = run_property_crew(data)
            print(json.dumps(result, ensure_ascii=False, indent=2))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)
