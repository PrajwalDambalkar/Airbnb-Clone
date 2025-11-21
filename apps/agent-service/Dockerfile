FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including curl for Ollama checks
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p chroma_db policies

# Make init script executable
RUN chmod +x init_ollama.sh 2>/dev/null || true

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=120s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health').raise_for_status()" || exit 1

# Start the application with Ollama initialization
CMD ["/bin/bash", "-c", "./init_ollama.sh && uvicorn main:app --host 0.0.0.0 --port 8000"]

