FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# 1) Sistema: python deps + node + dependencias para chromium (puppeteer)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    netcat-openbsd \
    curl \
    gnupg \
    ca-certificates \
    git \
    # libs típicas que necesita chromium
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libgtk-3-0 \
    fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

# 2) Instalar Node (20.x)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get update && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

# 3) Python deps
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# 4) Copia proyecto
COPY . /app/

# 5) Instala dependencias Node SOLO para el subproyecto scripts
WORKDIR /app/apps/base/scripts
RUN npm ci

# 6) Volver a /app
WORKDIR /app

# Entry point
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
