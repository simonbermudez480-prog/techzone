FROM nikolaik/python-nodejs:python3.11-nodejs18

# Dependencias del sistema
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

# --- yt-dlp: instalamos el binario standalone más reciente ---
# Esto siempre trae la última versión publicada en GitHub,
# que suele ir MÁS adelantada que la de PyPI en parches anti-bot de YouTube.
# El argumento de fecha fuerza a Docker a NO cachear esta capa indefinidamente.
ARG CACHEBUST=1
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && yt-dlp --version

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Verificación en build: si cookies.txt no existe, el build falla aquí mismo
# (mejor enterarte en el build que en producción)
RUN if [ ! -f /app/cookies.txt ]; then \
        echo "ADVERTENCIA: cookies.txt no encontrado en build context"; \
    else \
        echo "cookies.txt OK, $(wc -l < /app/cookies.txt) líneas"; \
    fi

ENV PATH="/usr/local/bin:${PATH}"
ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD [ "node", "server.js" ]
