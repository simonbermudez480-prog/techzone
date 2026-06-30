# Usamos una imagen base que ya trae Node.js
FROM node:18-bullseye-slim

# Instalamos las dependencias del sistema necesarias para video
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalamos yt-dlp directamente desde su origen oficial
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Configuramos tu app
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Exponemos el puerto y arrancamos
EXPOSE 3000
CMD [ "node", "server.js" ]
