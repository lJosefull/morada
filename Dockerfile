FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir \
    crewai==0.28.0 \
    langchain==0.1.16 \
    fastapi==0.104.1 \
    uvicorn==0.24.0 \
    python-multipart==0.0.6

COPY . .

CMD ["python", "main.py"]
