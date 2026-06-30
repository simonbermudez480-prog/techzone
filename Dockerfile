# Usamos una imagen de Node.js basada en Debian para poder instalar paquetes de sistema
FROM node:18

# Instalamos ffmpeg y python3 (necesario para yt-dlp)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Instalamos yt-dlp usando pip
RUN pip3 install yt-dlp --break-system-packages

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
