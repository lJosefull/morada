FROM python:3.11-slim

# Instalar git para que los agentes puedan hacer commits
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --no-cache-dir \
    crewai==0.28.0 \
    langchain==0.1.16 \
    fastapi==0.104.1 \
    uvicorn==0.24.0 \
    python-multipart==0.0.6

COPY . .

# Configurar git para que los commits funcionen
RUN git config --global user.email "agents@inmobiliaria.ai" && \
    git config --global user.name "InmobiliarIA Fixer Agent"

CMD ["python", "main.py"]
