# syntax=docker/dockerfile:1

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# System dependencies for psycopg2, lxml, cryptography, aiodns, pillow, magic, etc.
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    curl \
    netcat-openbsd \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    libxml2-dev \
    libxslt1-dev \
    libmagic1 \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    libc-ares-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for better layer caching
COPY requirements-production-essential.txt requirements.txt ./

RUN pip install --upgrade pip && \
    pip install -r requirements-production-essential.txt

# Copy backend source code
COPY . .

# Ensure entrypoint is executable
RUN chmod +x /app/docker-entrypoint.sh || true

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["/app/docker-entrypoint.sh"]