# Usamos Debian Bookworm (versión 12) que incluye Python 3.11+
FROM node:18-bookworm

# Instalamos ffmpeg, python3, y pip
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalamos la última versión de yt-dlp usando pip3 (con --break-system-packages para asegurar la instalación)
RUN pip3 install yt-dlp --break-system-packages

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
