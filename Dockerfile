FROM node:18-bookworm

# Instalamos ffmpeg y python3-pip
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Instalamos la última versión de yt-dlp y aseguramos que esté actualizada
RUN pip3 install --break-system-packages yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
